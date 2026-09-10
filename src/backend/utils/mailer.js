import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


export const sendVerificationEmail = async (email, name, token) => {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;

  await transporter.sendMail({
    from: `"Squares" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "تفعيل حسابك في Squares",
    html: `
      <h2>مرحباً ${name}</h2>
      <p>اضغط على الرابط التالي لتفعيل حسابك:</p>
      <a href="${verifyUrl}" style="background:#482349;color:#CE9C25;padding:10px 20px;border-radius:8px;text-decoration:none;">
        تفعيل الحساب
      </a>
      <p>الرابط صالح لمدة 24 ساعة</p>
    `,
  });
};

export const sendResetPasswordEmail = async (email, name, resetUrl) => {
  await transporter.sendMail({
    from: `"Squares" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "إعادة تعيين كلمة المرور - Squares",
    html: `
      <h2>مرحباً ${name}</h2>
      <p>لقد طلبت إعادة تعيين كلمة المرور. اضغط على الرابط التالي لإنشاء كلمة مرور جديدة:</p>
      <a href="${resetUrl}" style="background:#482349;color:#CE9C25;padding:10px 20px;border-radius:8px;text-decoration:none;">
        إعادة تعيين كلمة المرور
      </a>
      <p>الرابط صالح لمدة 15 دقيقة</p>
      <p>إذا لم تطلب ذلك، تجاهل هذه الرسالة.</p>
    `,
  });
};