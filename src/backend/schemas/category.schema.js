import { z } from "zod";

// مفتاح الصورة كما يولّده POST /uploads/presign/category-image: categories/<uuid>.<ext>
// التقييد بهذه الصيغة يمنع تمرير مفتاح عشوائي يشير إلى ملف آخر في نفس الدلو.
export const categoryThumbnailKeySchema = z
  .string()
  .regex(
    /^categories\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]{1,10}$/,
    "مفتاح الصورة غير صالح",
  );

export const createCategorySchema = z.object({
  name: z.string().min(3, "يجب أن يتكون الاسم من 3 حروف على الأقل.").max(10, "يجب ألا يتجاوز الاسم 10 أحرف."),
  description: z.string().optional(),
  thumbnail: z.string().url().optional(),
  thumbnailKey: categoryThumbnailKeySchema.optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(3, "يجب أن يتكون الاسم من 3 حروف على الأقل.").max(10, "يجب ألا يتجاوز الاسم 10 أحرف.").optional(),
  description: z.string().optional(),
  thumbnail: z.string().url().optional(),
  thumbnailKey: categoryThumbnailKeySchema.optional(),
});