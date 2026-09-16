import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import logger from "../utils/logger.js";

const SENDER_NAME = "Luxora Learn";
// Apps Script قد يستغرق بضع ثوانٍ في الاستيقاذ البارد
const WEBHOOK_TIMEOUT_MS = 25_000;

/* ------------------------------- قناة الإرسال ------------------------------- */
// Railway (وأمثالها) تحجب منافذ SMTP على الخطط غير المدفوعة، فيبقى الطلب معلّقاً
// حتى يفشل. في الإنتاج نرسل عبر HTTPS إلى Google Apps Script منشور كـ Web App
// (scripts/gmail-webhook.gs) يرسل من نفس حساب Gmail. Gmail SMTP يبقى للتطوير المحلي.
const USE_WEBHOOK = Boolean(env.MAIL_WEBHOOK_URL && env.MAIL_WEBHOOK_SECRET);

const transporter = USE_WEBHOOK
  ? null
  : nodemailer.createTransport({
      service: "gmail",
      auth: { user: env.EMAIL_USER, pass: env.EMAIL_PASS },
    });

// Apps Script يردّ بإعادة توجيه 302 إلى رابط المحتوى؛ fetch يتبعه تلقائياً.
// الحالة الحقيقية داخل JSON (ok) لأن Apps Script يعيد 200 حتى عند الفشل.
const webhookRequest = async (init = {}) => {
  const res = await fetch(env.MAIL_WEBHOOK_URL, {
    ...init,
    headers: { accept: "application/json", ...init.headers },
    redirect: "follow",
    signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
  });
  const text = await res.text().catch(() => "");
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    // صفحة HTML بدل JSON = النشر غير مضبوط (الوصول ليس "Anyone") أو الرابط خاطئ
  }
  if (!res.ok || !data || data.ok !== true) {
    const reason = data?.error || `HTTP ${res.status}: ${text.slice(0, 200)}`;
    const err = new Error(`Mail webhook: ${reason}`);
    err.code = data ? "MAIL_WEBHOOK_REJECTED" : `MAIL_WEBHOOK_${res.status}`;
    throw err;
  }
  return data;
};

/** يرسل رسالة عبر القناة المضبوطة؛ الواجهة موحّدة مهما كانت القناة */
const deliver = async ({ to, subject, text, html }) => {
  if (USE_WEBHOOK) {
    await webhookRequest({
      method: "POST",
      // text/plain لا application/json: يتجنّب طلب CORS التمهيدي الذي لا يدعمه Apps Script
      headers: { "content-type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        secret: env.MAIL_WEBHOOK_SECRET,
        senderName: SENDER_NAME,
        to,
        subject,
        text,
        html,
      }),
    });
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
    const transport = USE_WEBHOOK ? "apps-script-webhook" : "gmail-smtp";
    // GET على السكربت يعيد {ok:true, sender} دون إرسال شيء — فحص صحة فقط
    if (USE_WEBHOOK) {
      const { sender, remainingToday } = await webhookRequest({ method: "GET" });
      logger.info("mailer.ready", { transport, sender, remainingToday });
    } else {
      await transporter.verify();
      logger.info("mailer.ready", { transport });
    }
  } catch (err) {
    logger.error("mailer.unavailable", {
      transport: USE_WEBHOOK ? "apps-script-webhook" : "gmail-smtp",
      err,
    });
  }
};