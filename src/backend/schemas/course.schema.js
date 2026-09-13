import { z } from "zod";

// مفتاح الصورة كما يولّده POST /uploads/presign/image: courses/<uuid>.<ext>
// التقييد بهذه الصيغة يمنع تمرير مفتاح عشوائي يشير إلى ملف آخر في نفس الدلو.
export const thumbnailKeySchema = z
  .string()
  .regex(
    /^courses\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]{1,10}$/,
    "مفتاح الصورة غير صالح",
  );

export const createCourseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters"),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  categoryId: z.string().uuid(),
  thumbnail: z.string().url().optional(),
  thumbnailKey: thumbnailKeySchema.optional(),
});

export const updateCourseSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  description: z.string().min(10).optional(),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  categoryId: z.string().uuid().optional(),
  thumbnail: z.string().url().optional(),
  thumbnailKey: thumbnailKeySchema.optional(),
});
