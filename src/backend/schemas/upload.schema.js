import { z } from "zod";

// سقف حجم فيديو الدرس — 500 ميجابايت
export const MAX_VIDEO_SIZE_BYTES = 500 * 1024 * 1024;

export const presignUploadSchema = z.object({
  filename: z
    .string()
    .min(1, "اسم الملف مطلوب")
    .max(255, "اسم الملف طويل جداً"),
  // فيديو فقط: video/mp4، video/webm، video/quicktime …
  contentType: z
    .string()
    .regex(/^video\/[a-zA-Z0-9][a-zA-Z0-9.+-]*$/, "نوع الملف يجب أن يكون فيديو"),
  size: z
    .number()
    .int("حجم الملف يجب أن يكون رقماً صحيحاً")
    .positive("حجم الملف يجب أن يكون أكبر من صفر")
    .max(MAX_VIDEO_SIZE_BYTES, "حجم الفيديو يتجاوز الحد المسموح (500 ميجابايت)"),
});
