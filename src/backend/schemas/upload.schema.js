import { z } from "zod";

// سقف حجم فيديو الدرس — 500 ميجابايت
export const MAX_VIDEO_SIZE_BYTES = 500 * 1024 * 1024;
// سقف حجم صورة الكورس — 5 ميجابايت
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const filenameSchema = z
  .string()
  .min(1, "اسم الملف مطلوب")
  .max(255, "اسم الملف طويل جداً");

export const presignUploadSchema = z.object({
  filename: filenameSchema,
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

export const presignImageUploadSchema = z.object({
  filename: filenameSchema,
  // صور فقط: image/jpeg، image/png، image/webp …
  contentType: z
    .string()
    .regex(/^image\/[a-zA-Z0-9][a-zA-Z0-9.+-]*$/, "نوع الملف يجب أن يكون صورة"),
  size: z
    .number()
    .int("حجم الملف يجب أن يكون رقماً صحيحاً")
    .positive("حجم الملف يجب أن يكون أكبر من صفر")
    .max(MAX_IMAGE_SIZE_BYTES, "حجم الصورة يتجاوز الحد المسموح (5 ميجابايت)"),
});
