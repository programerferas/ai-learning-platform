import { z } from "zod";

// مفتاح الفيديو كما يولّده POST /uploads/presign: lessons/<uuid>.<ext>
// التقييد بهذه الصيغة يمنع تمرير مفتاح عشوائي يشير إلى ملف آخر في نفس الدلو.
export const videoKeySchema = z
  .string()
  .regex(
    /^lessons\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]{1,10}$/,
    "مفتاح الفيديو غير صالح",
  );

export const createLessonSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  content: z.string().optional(),
  videoUrl: z.string().url("Invalid video URL").optional(),
  videoKey: videoKeySchema.optional(),
  order: z.number().int().min(0).optional(),
  courseId: z.string().uuid("CourseId is required"),
});

export const updateLessonSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  content: z.string().optional(),
  videoUrl: z.string().url().optional(),
  videoKey: videoKeySchema.optional(),
  order: z.number().int().min(0).optional(),
});
