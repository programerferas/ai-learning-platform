import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import logger from "../utils/logger.js";

const SENDER_NAME = "Luxora Learn";
const MAILJET_API = "https://api.mailjet.com";
const MAILJET_TIMEOUT_MS = 15_000;

/* ------------------------------- قناة الإرسال ------------------------------- */
// Railway (وأمثالها) تحجب منافذ SMTP على الخطط غير المدفوعة، فيبقى الطلب معلّقاً
// حتى يفشل. Mailjet يرسل عبر HTTPS العادي فلا يتأثر، وGmail SMTP يبقى للتطوير المحلي.
const USE_MAILJET = Boolean(env.MAILJET_API_KEY && env.MAILJET_SECRET_KEY);

const transporter = USE_MAILJET
  ? null
  : nodemailer.createTransport({
      service: "gmail",
      auth: { user: env.EMAIL_USER, pass: env.EMAIL_PASS },
    });

const mailjetRequest = async (path, init = {}) => {
  const credentials = Buffer.from(
    `${env.MAILJET_API_KEY}:${env.MAILJET_SECRET_KEY}`
  ).toString("base64");
  const res = await fetch(`${MAILJET_API}${path}`, {
    ...init,
    headers: {
      authorization: `Basic ${credentials}`,
      accept: "application/json",
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...init.headers,
    },
    signal: AbortSignal.timeout(MAILJET_TIMEOUT_MS),
  });
  if (!res.ok) {
    // نص الخطأ من Mailjet يشرح السبب (مرسل غير موثّق، مفتاح خاطئ، ...)
    const body = await res.text().catch(() => "");
    const err = new Error(`Mailjet ${res.status}: ${body.slice(0, 300)}`);
    err.code = `MAILJET_${res.status}`;
    throw err;
  }
  return res;
};

/** يرسل رسالة عبر القناة المضبوطة؛ الواجهة موحّدة مهما كانت القناة */
const deliver = async ({ to, subject, text, html }) => {
  if (USE_MAILJET) {
    const res = await mailjetRequest("/v3.1/send", {
      method: "POST",
      body: JSON.stringify({
        Messages: [
          {
            From: { Email: env.EMAIL_USER, Name: SENDER_NAME },
            To: [{ Email: to }],
            Subject: subject,
            HTMLPart: html,
            ...(text ? { TextPart: text } : {}),
          },
        ],
      }),
    });
    // v3.1 يردّ 200 حتى لو رُفضت رسالة بعينها، فالحالة داخل الجسم هي الحكم
    const { Messages = [] } = await res.json().catch(() => ({}));
    const failed = Messages.find((m) => m.Status !== "success");
    if (failed) {
      const reason =
        failed.Errors?.map((e) => e.ErrorMessage).join("; ") || failed.Status;
      const err = new Error(`Mailjet rejected message: ${reason}`);
      err.code = "MAILJET_REJECTED";
      throw err;
    }
    return;
  }
  await transporter.sendMail({
    from: `"${SENDER_NAME}" <${env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
};

/** يمنع حقن HTML عبر الاسم القادم من المستخدم */
const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const layout = (bodyHtml) => `
  <div dir="rtl" style="font-family:Tajawal,Segoe UI,Arial,sans-serif;
       background:#f2f2e1;padding:32px;color:#2b2b2b;">
    <div style="max-width:560px;margin:0 auto;background:#fff;
         border-radius:12px;padding:32px;">
      ${bodyHtml}
      <hr style="border:none;border-top:1px solid #eee;margin:28px 0;">
      <p style="font-size:12px;color:#777;">Luxora Learn</p>
    </div>
  </div>
`;

/* ----------------------------- تفعيل البريد ----------------------------- */
export const sendVerificationEmail = async (to, name, rawVerifyToken) => {
  const verifyUrl = `${env.API_URL}/api/auth/verify-email?token=${encodeURIComponent(
    rawVerifyToken
  )}`;
  const safeName = escapeHtml(name);

  await deliver({
    to,
    subject: "تفعيل حسابك في Luxora Learn",
    // نسخة نصية إلى جانب HTML: تقلّل احتمال الوصول لمجلد الرسائل المزعجة
    text: `مرحباً ${name}،\nفعّل حسابك خلال 24 ساعة عبر الرابط:\n${verifyUrl}\n\nإذا لم تطلب إنشاء حساب، تجاهل هذه الرسالة ولا تضغط الرابط.`,
    html: layout(`
      <h2 style="color:#482349;margin-top:0;">مرحباً ${safeName}</h2>
      <p>اضغط الزر التالي لتفعيل حسابك. الرابط صالح لمدة <strong>24 ساعة</strong>.</p>
      <p style="margin:28px 0;">
        <a href="${verifyUrl}"
           style="background:#482349;color:#f2f2e1;text-decoration:none;
                  padding:12px 28px;border-radius:8px;display:inline-block;">
          تفعيل الحساب
        </a>
      </p>
      <p style="font-size:13px;color:#666;">
        إذا لم يعمل الزر، انسخ هذا الرابط في المتصفح:<br>
        <span style="word-break:break-all;color:#CE9C25;">${verifyUrl}</span>
      </p>
      <p style="font-size:13px;color:#666;">
        إذا لم تطلب إنشاء حساب على Luxora Learn، تجاهل هذه الرسالة ولا تضغط الرابط.
      </p>
    `),
  });
};

/* -------------------------- إعادة تعيين كلمة المرور ------------------------- */
export const sendResetPasswordEmail = async (to, name, rawResetToken) => {
  const resetUrl = `${env.CLIENT_URL}/auth/reset-password/${encodeURIComponent(
    rawResetToken
  )}`;

  await deliver({
    to,
    subject: "إعادة تعيين كلمة المرور - Luxora Learn",
    text: `مرحباً ${name}،\nلإعادة تعيين كلمة المرور افتح الرابط خلال 15 دقيقة:\n${resetUrl}\n\nإذا لم تطلب ذلك، تجاهل هذه الرسالة.`,
    html: layout(`
      <h2 style="color:#482349;margin-top:0;">مرحباً ${escapeHtml(name)}</h2>
      <p>طلبت إعادة تعيين كلمة المرور. الرابط صالح لمدة <strong>15 دقيقة</strong>.</p>
      <p style="margin:28px 0;">
        <a href="${resetUrl}"
           style="background:#482349;color:#f2f2e1;text-decoration:none;
                  padding:12px 28px;border-radius:8px;display:inline-block;">
          إعادة تعيين كلمة المرور
        </a>
      </p>
      <p style="font-size:13px;color:#666;">
        إذا لم يعمل الزر، انسخ هذا الرابط في المتصفح:<br>
        <span style="word-break:break-all;color:#CE9C25;">${resetUrl}</span>
      </p>
      <p style="font-size:13px;color:#666;">إذا لم تطلب ذلك، تجاهل هذه الرسالة.</p>
    `),
  });
};

/* -------------------------------- ترحيب -------------------------------- */
export const sendWelcomeEmail = async (to, name) => {
  await deliver({
    to,
    subject: "أهلاً بك في Luxora Learn",
    html: layout(`
      <h2 style="color:#482349;margin-top:0;">أهلاً ${escapeHtml(name)}</h2>
      <p>سعداء بانضمامك. ابدأ باستكشاف الدورات وطوّر مهاراتك.</p>
    `),
  });
};

/* ------------------------------- التسجيل ------------------------------- */
export const sendEnrollmentEmail = async (to, name, courseTitle) => {
  const safeTitle = escapeHtml(courseTitle);
  await deliver({
    to,
    subject: `تم تسجيلك في ${courseTitle}`,
    html: layout(`
      <h2 style="color:#482349;margin-top:0;">مرحباً ${escapeHtml(name)}</h2>
      <p>تم تسجيلك بنجاح في <strong>${safeTitle}</strong>.</p>
      <p>بالتوفيق في رحلتك التعليمية.</p>
    `),
  });
};

/** فحص اتصال SMTP عند الإقلاع — يكشف كلمة مرور تطبيق خاطئة قبل أول مستخدم */
export const verifyMailer = async () => {
  try {
    if (USE_MAILJET) await mailjetRequest("/v3/REST/apikey");
    else await transporter.verify();
    logger.info("mailer.ready", { transport: USE_MAILJET ? "mailjet" : "gmail-smtp" });
  } catch (err) {
    logger.error("mailer.unavailable", { transport: USE_MAILJET ? "mailjet" : "gmail-smtp", err });
  }
};