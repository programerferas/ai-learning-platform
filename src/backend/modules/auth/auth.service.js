import crypto from "crypto";
import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";
import prisma from "../../lib/prisma.js";
import {AppError} from "../../utils/appError.js";
import logger from "../../utils/logger.js";
import { normalizeEmail } from "../../utils/normalizeEmail.js";
import { signAuthToken } from "../../utils/jwt.js";
import {
  sendVerificationEmail,
  sendResetPasswordEmail,
} from "../../lib/mailer.js";

/* ---------------------------------- إعدادات ---------------------------------- */
const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
// التسمية مشتقة من القيمة فلا يمكن أن تتعارض معها
const VERIFY_TOKEN_TTL_LABEL = `${VERIFY_TOKEN_TTL_MS / (60 * 60 * 1000)} ساعة`;

const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;    // صلاحية رابط إعادة التعيين
const SEND_COOLDOWN_MS = 60 * 1000;           // فترة تهدئة لكل بريد
const MAX_PENDING_PER_EMAIL = 3;              // سقف المحاولات المعلقة لنفس البريد
const PENDING_GRACE_MS = 48 * 60 * 60 * 1000; // مهلة سماح قبل الحذف النهائي
const BCRYPT_COST = 12;
// هاش حقيقي تُقارن به المحاولات على بريد غير موجود، فيتساوى زمن الرد
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", BCRYPT_COST);

/* ---------------------------------- أدوات ---------------------------------- */
// توكن تفعيل البريد: SHA-256، يُخزَّن مجزّأً، يُستخدم مرة واحدة — لا علاقة له بـ JWT
const hashToken = (rawToken) =>
  crypto.createHash("sha256").update(rawToken).digest("hex");

const createVerifyToken = () => {
  const rawVerifyToken = crypto.randomBytes(32).toString("hex");
  return {
    rawVerifyToken,
    hashedVerifyToken: hashToken(rawVerifyToken),
    verifyTokenExpires: new Date(Date.now() + VERIFY_TOKEN_TTL_MS),
  };
};

const isPrismaError = (err, code) =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === code;

/** هل أُرسل بريد لهذا العنوان خلال فترة التهدئة؟ (الإرسال الناجح فقط يُحتسب) */
const hasRecentSend = async (email) => {
  const row = await prisma.pendingUser.findFirst({
    where: { email, lastSentAt: { gt: new Date(Date.now() - SEND_COOLDOWN_MS) } },
    select: { id: true },
  });
  return Boolean(row);
};

/** يحافظ على سقف المحاولات المعلقة لنفس البريد بحذف الأقدم */
const enforcePendingLimit = async (email) => {
  const surplus = await prisma.pendingUser.findMany({
    where: { email },
    orderBy: { createdAt: "desc" },
    skip: MAX_PENDING_PER_EMAIL - 1,
    select: { id: true },
  });
  if (surplus.length) {
    await prisma.pendingUser.deleteMany({
      where: { id: { in: surplus.map((r) => r.id) } },
    });
  }
};

const markSent = (id, email) =>
  prisma.pendingUser
    .update({ where: { id }, data: { lastSentAt: new Date() } })
    .catch((err) => logger.error("auth.mark_sent_failed", { email, err }));

/* ---------------------------------- REGISTER --------------------------------- */
export const register = async (data) => {
  const email = normalizeEmail(data.email); 
  const { name, password, phoneNumber } = data;

  const sentMessage = {
    message: `تم إرسال رابط التفعيل إلى بريدك الإلكتروني، أكمل التفعيل خلال ${VERIFY_TOKEN_TTL_LABEL}`,
  };

  // لا نحمّل صف المستخدم كاملاً (وفيه هاش كلمة المرور) لمجرد فحص وجوده
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existingUser) throw new AppError("البريد الإلكتروني مستخدم بالفعل", 409);

  // إن كان هناك رابط أُرسل للتو، لا نرسل غيره ولا نمسّ أي سجل قائم.
  // الرد مطابق تماماً: لا إشارة لمن يحاول العبث، ورابط المستخدم الأصلي يبقى صالحاً.
  if (await hasRecentSend(email)) {
    logger.warn("register.cooldown_hit", { email });
    return sentMessage;
  }

  await enforcePendingLimit(email);

  const hashedPassword = await bcrypt.hash(password, BCRYPT_COST);
  const { rawVerifyToken, hashedVerifyToken, verifyTokenExpires } =
    createVerifyToken();

  // سجل مستقل لكل محاولة تسجيل: التوكن مرتبط بكلمة المرور المُرسلة معه،
  // فلا يستطيع طرف آخر استبدال بياناتك في سجل ستُفعّله أنت.
  const pending = await prisma.pendingUser.create({
    data: {
      name,
      email,
      password: hashedPassword,
      phoneNumber,
      verifyToken: hashedVerifyToken,
      verifyTokenExpires,
    },
    select: { id: true },
  });

  try {
    await sendVerificationEmail(email, name, rawVerifyToken);
  } catch (err) {
    // لا نحذف السجل: الحذف كان يتلف تسجيلاً سابقاً صالحاً لنفس البريد.
    // lastSentAt يبقى null فتُسمح إعادة المحاولة فوراً، ووظيفة التنظيف تكنسه لاحقاً.
    logger.error("register.verification_email_failed", { email, err });
    throw new AppError(
      "تعذر إرسال بريد التفعيل، يرجى طلب إعادة الإرسال بعد قليل",
      502
    );
  }

  await markSent(pending.id, email);
  return sentMessage;
};

/* -------------------------------- VERIFY EMAIL ------------------------------- */
export const verifyEmail = async (rawToken) => {
  if (typeof rawToken !== "string" || rawToken.length === 0)
    throw new AppError("رابط التفعيل غير صالح", 400);

  const hashedToken = hashToken(rawToken);

  try {
    // القراءة والفحص والكتابة كلها داخل معاملة واحدة
    const user = await prisma.$transaction(async (tx) => {
      const pendingUser = await tx.pendingUser.findUnique({
        where: { verifyToken: hashedToken },
      });
      if (!pendingUser)
        throw new AppError("رابط التفعيل غير صالح أو تم استخدامه بالفعل", 400);

      // لا نحذف عند انتهاء الصلاحية — وظيفة التنظيف مسؤولة عن ذلك،
      // فتبقى إعادة الإرسال متاحة والرسالة ثابتة بغضّ النظر عن توقيت التنظيف
      if (pendingUser.verifyTokenExpires.getTime() < Date.now())
        throw new AppError("انتهت صلاحية رابط التفعيل، يمكنك طلب رابط جديد", 410);

      const alreadyRegistered = await tx.user.findUnique({
        where: { email: pendingUser.email },
        select: { id: true },
      });
      if (alreadyRegistered)
        throw new AppError("هذا الحساب مفعّل بالفعل، يمكنك تسجيل الدخول", 409);

      const created = await tx.user.create({
        data: {
          name: pendingUser.name,
          email: pendingUser.email, // مُطبَّع مسبقاً عند التسجيل
          password: pendingUser.password, // مُشفّرة مسبقاً
          phoneNumber: pendingUser.phoneNumber,
          isVerified: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phoneNumber: true,
        },
      });

      // ينظّف كل محاولات التسجيل المعلقة لهذا البريد، لا الصف المُستخدَم فقط
      await tx.pendingUser.deleteMany({ where: { email: pendingUser.email } });

      return created;
    });

    return { user, token: signAuthToken(user) };
  } catch (err) {
    // قيد الفرادة هو الحارس الحقيقي ضد التزامن — نعامله كنتيجة متوقعة لا كانهيار
    if (isPrismaError(err, "P2002"))
      throw new AppError("هذا الحساب مفعّل بالفعل، يمكنك تسجيل الدخول", 409);
    if (isPrismaError(err, "P2025"))
      throw new AppError("رابط التفعيل غير صالح أو تم استخدامه بالفعل", 400);
    throw err;
  }
};

/* --------------------------- RESEND VERIFICATION --------------------------- */
export const resendVerification = async (rawEmail) => {
  const email = normalizeEmail(rawEmail);
  const genericResponse = {
    message: "إذا كان البريد مسجلاً لدينا فقد أرسلنا رابط تفعيل جديد",
  };

  const pendingUser = await prisma.pendingUser.findFirst({
    where: { email },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, lastSentAt: true }, // بدون هاش كلمة المرور
  });
  if (!pendingUser) return genericResponse;

  if (
    pendingUser.lastSentAt &&
    Date.now() - pendingUser.lastSentAt.getTime() < SEND_COOLDOWN_MS
  )
    return genericResponse;

  const { rawVerifyToken, hashedVerifyToken, verifyTokenExpires } =
    createVerifyToken();

  // الترتيب مقصود: نكتب قبل أن نرسل، فلا يوجد أبداً رابط في يد المستخدم
  // بلا مقابل في قاعدة البيانات. العكس هو الذي يكسر هذا الضمان.
  try {
    await prisma.pendingUser.update({
      where: { id: pendingUser.id },
      data: { verifyToken: hashedVerifyToken, verifyTokenExpires },
    });
  } catch (err) {
    if (isPrismaError(err, "P2025")) return genericResponse; // حُذف الصف في هذه الأثناء
    throw err;
  }

  // الإرسال خارج مسار الاستجابة: يوحّد زمن الرد بين "البريد موجود" و"غير موجود"،
  // ويمنع فشل SMTP من أن يتحوّل إلى إشارة تكشف وجود الحساب
  setImmediate(() => {
    sendVerificationEmail(email, pendingUser.name, rawVerifyToken)
      .then(() => markSent(pendingUser.id, email))
      .catch((err) => {
        // التوكن الجديد بقي في القاعدة ولم يصل المستخدم: لا تراجُع ممكن أصلاً
        // (الهاش وحده مخزّن)، والمستخدم يستطيع طلب الإرسال مجدداً.
        // هذا السطر هو أثرك الوحيد على المشكلة.
        logger.error("resend.verification_email_failed", { email, err });
      });
  });

  return genericResponse;
};

/* ----------------------------------- LOGIN ---------------------------------- */
export const login = async (data) => {
  const email = normalizeEmail(data.email);

  const user = await prisma.user.findUnique({ where: { email } });

  // مقارنة وهمية عند عدم وجود المستخدم حتى لا يكشف زمن الرد أي البريدين مسجل
  if (!user) {
    await bcrypt.compare(data.password, DUMMY_HASH);
    throw new AppError("بيانات الدخول غير صحيحة", 401);
  }

  const isMatch = await bcrypt.compare(data.password, user.password);
  if (!isMatch) throw new AppError("بيانات الدخول غير صحيحة", 401);

  if (!user.isVerified)
    throw new AppError("يرجى تفعيل حسابك من رابط البريد أولاً", 403);

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phoneNumber: user.phoneNumber,
  };

  return { user: safeUser, token: signAuthToken(safeUser) };
};

/* ------------------------------ UPDATE PROFILE ------------------------------ */
export const updateProfile = async (userId, data) => {
  const { name, phoneNumber } = data;

  const user = await prisma.user.update({
    where: { id: userId },
    data: { name, phoneNumber },
    select: { id: true, name: true, email: true, phoneNumber: true, role: true },
  });

  return { user };
};

/* ------------------------------ CHANGE PASSWORD ----------------------------- */
export const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, password: true },
  });
  if (!user) throw new AppError("المستخدم غير موجود", 404);

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) throw new AppError("كلمة المرور الحالية غير صحيحة", 400);

  await prisma.user.update({
    where: { id: userId },
    data: { password: await bcrypt.hash(newPassword, BCRYPT_COST) },
  });

  return { message: "تم تغيير كلمة المرور بنجاح" };
};

/* ------------------------------ FORGOT PASSWORD ----------------------------- */
export const forgotPassword = async (rawEmail) => {
  const email = normalizeEmail(rawEmail);
  // رد موحّد سواء وُجد البريد أم لا، حتى لا يتحول النموذج إلى أداة كشف حسابات
  const genericResponse = {
    message: "إذا كان البريد مسجلاً لدينا فقد أرسلنا رابط إعادة تعيين",
  };

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true },
  });
  if (!user) return genericResponse;

  const rawResetToken = crypto.randomBytes(32).toString("hex");

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordToken: hashToken(rawResetToken),
      resetPasswordExpires: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });

  // الإرسال خارج مسار الاستجابة: يوحّد زمن الرد ويمنع فشل SMTP من كشف وجود الحساب
  setImmediate(() => {
    sendResetPasswordEmail(user.email, user.name, rawResetToken).catch((err) =>
      logger.error("forgot.reset_email_failed", { email, err })
    );
  });

  return genericResponse;
};

/* ------------------------------ RESET PASSWORD ------------------------------ */
export const resetPassword = async (rawToken, newPassword) => {
  if (typeof rawToken !== "string" || rawToken.length === 0)
    throw new AppError("رابط إعادة التعيين غير صالح", 400);

  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: hashToken(rawToken),
      resetPasswordExpires: { gt: new Date() },
    },
    select: { id: true },
  });
  if (!user)
    throw new AppError("رابط إعادة التعيين غير صالح أو منتهي الصلاحية", 400);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: await bcrypt.hash(newPassword, BCRYPT_COST),
      resetPasswordToken: null,
      resetPasswordExpires: null,
    },
  });

  return { message: "تم تغيير كلمة المرور بنجاح، يمكنك تسجيل الدخول الآن" };
};

/* --------------------------------- CLEANUP ---------------------------------- */
export const purgeExpiredPendingUsers = async () => {
  // مهلة سماح حتى تبقى رسالة "انتهت الصلاحية، اطلب رابطاً جديداً" ممكنة
  const cutoff = new Date(Date.now() - PENDING_GRACE_MS);
  const { count } = await prisma.pendingUser.deleteMany({
    where: { verifyTokenExpires: { lt: cutoff } },
  });
  if (count) logger.info("cleanup.pending_users_purged", { count });
  return count;
};