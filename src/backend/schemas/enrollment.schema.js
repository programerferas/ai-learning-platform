import { z } from "zod";

// موضع التوقف في الدرس (بالثواني) لاستئناف المشاهدة
export const saveProgressSchema = z.object({
  courseId: z.string().uuid("معرف الدورة غير صالح"),
  lessonId: z.string().uuid("معرف الدرس غير صالح"),
  position: z.number().int().min(0).optional(),
});
