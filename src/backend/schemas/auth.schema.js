import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(3, "يجب أن يكون الاسم على الأقل مكون من 3 أحرف").max(30, "يجب أن يكون الاسم على الأكثر مكون من 30 حرفاً"),
  email: z.string().trim().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/,"البريد الإلكتروني غير صالح"),
  phoneNumber: z.string().trim().regex(/^09\d{8}$/, "رقم الهاتف يجب أن يكون 10 أرقام"),
  password: z
    .string()
    .min(8, "يجب أن تكون كلمة المرور على الأقل 8 أحرف")
    .regex(
      /^[A-Z](?=.*\d).+$/,
      "يجب أن تبدأ كلمة المرور بحرف كبير وتحتوي على رقم واحد على الأقل",
    ),
    
});

export const loginSchema = z.object({
  email: z.string().trim().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/,"البريد الإلكتروني غير صالح"),
  password: z.string().trim().min(8, "يجب أن تكون كلمة المرور على الأقل 8 أحرف و تحتوي على رقم واحد على الأقل و تبدأ بحرف كبير"),
});

const emailField = z
  .string()
  .trim()
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "البريد الإلكتروني غير صالح");

const passwordField = z
  .string()
  .min(8, "يجب أن تكون كلمة المرور على الأقل 8 أحرف")
  .regex(
    /^[A-Z](?=.*\d).+$/,
    "يجب أن تبدأ كلمة المرور بحرف كبير وتحتوي على رقم واحد على الأقل",
  );

export const resendVerificationSchema = z.object({ email: emailField });

export const forgotPasswordSchema = z.object({ email: emailField });

export const resetPasswordSchema = z.object({ password: passwordField });

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "يجب أن يكون الاسم على الأقل مكون من 3 أحرف")
    .max(30, "يجب أن يكون الاسم على الأكثر مكون من 30 حرفاً"),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^09\d{8}$/, "رقم الهاتف يجب أن يكون 10 أرقام"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "كلمة المرور الحالية مطلوبة"),
  newPassword: passwordField,
});
