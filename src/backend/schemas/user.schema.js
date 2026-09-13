import { z } from "zod";

// ما يحق للأدمن تعديله في حساب مستخدم آخر — قائمة بيضاء صريحة.
// كلمة المرور والبريد ورموز التفعيل/إعادة التعيين ليست هنا عمداً:
// كلمة المرور تُغيَّر عبر مسارات المصادقة (مُجزّأة)، وليس بكتابة مباشرة في القاعدة.
export const adminUpdateUserSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "يجب أن يكون الاسم على الأقل مكون من 3 أحرف")
      .max(30, "يجب أن يكون الاسم على الأكثر مكون من 30 حرفاً")
      .optional(),
    phoneNumber: z
      .string()
      .trim()
      .regex(/^09\d{8}$/, "رقم الهاتف يجب أن يكون 10 أرقام")
      .optional(),
    role: z.enum(["STUDENT", "INSTRUCTOR", "ADMIN"], "الدور غير صالح").optional(),
    isVerified: z.boolean().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "لا توجد حقول للتحديث",
  });
