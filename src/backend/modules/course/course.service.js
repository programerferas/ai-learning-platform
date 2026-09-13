import prisma from "../../lib/prisma.js";
import { AppError } from "../../utils/appError.js";
import slugify from "slugify";
import { createPresignedDownloadUrl } from "../../lib/storage.js";

const THUMBNAIL_URL_TTL_SECONDS = 2 * 60 * 60; // صلاحية رابط الصورة الموقّع

// الحقول العامة فقط من المدرّس. لا نستخدم include: { instructor: true } أبداً
// لأنه يُعيد صف User كاملاً (هاش كلمة المرور، رموز إعادة التعيين، البريد، الهاتف).
const PUBLIC_INSTRUCTOR_SELECT = { select: { id: true, name: true, role: true } };

/**
 * الرابط القابل للعرض لصورة كورس واحد:
 * إن وُجد thumbnailKey نولّد رابط GET موقّعاً صالحاً ساعتين،
 * وإلا نُعيد thumbnail القديم كما هو — الكورسات ذات الروابط الكاملة تبقى تعمل.
 * اسم الحقل في الرد يبقى thumbnail حتى لا يتغيّر شكل الاستجابة على الواجهة.
 */
export const withViewableThumbnail = async (course) => {
  if (!course?.thumbnailKey) return course;

  const thumbnail = await createPresignedDownloadUrl({
    key: course.thumbnailKey,
    expiresIn: THUMBNAIL_URL_TTL_SECONDS,
  });

  return { ...course, thumbnail };
};

export const withViewableThumbnails = async (courses) =>
  await Promise.all(courses.map(withViewableThumbnail));

export const createCourse = async (data, user) => {
  const { title, description, level, categoryId, thumbnail, thumbnailKey } = data;

  if (!title || !description || !level || !categoryId) {
    throw new AppError("جميع الحقول المطلوبة يجب أن تكون موجودة", 400);
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });
  if (!category) throw new AppError("Category not found", 404);

  const baseSlug = slugify(title, { lower: true, strict: true });
  const uniqueSlug = `${baseSlug}-${Date.now()}`;

  const course = await prisma.course.create({
    data: {
      title,
      description,
      level,
      thumbnail,
      thumbnailKey,
      categoryId,
      instructorId: user.id,
      slug: uniqueSlug,
    },
  });

  return await withViewableThumbnail(course);
};

export const getAllCourses = async (query) => {
  const { categoryId, search, page = 1, limit = 10 } = query;

  const where = {
    published: true,
    ...(categoryId && { categoryId }),
    ...(search && {
      title: { contains: search, mode: "insensitive" },
    }),
  };

  const [courses, total] = await prisma.$transaction([
    prisma.course.findMany({
      where,
      include: { category: true, instructor: PUBLIC_INSTRUCTOR_SELECT },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: "desc" },
    }),
    prisma.course.count({ where }),
  ]);

  return {
    courses: await withViewableThumbnails(courses),
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
  };
};

export const getCourseById = async (id) => {
  if (!id) throw new AppError("المعرف الدورة مطلوب", 400);

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      category: true,
      instructor: PUBLIC_INSTRUCTOR_SELECT,
      // صفحة الكورس عامة: نعرض عناوين الدروس وعددها فقط.
      // المحتوى ورابط الفيديو يُقرآن من /lessons بعد التحقق من التسجيل.
      lessons: {
        select: { id: true, title: true, order: true },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!course) throw new AppError("لا توجد دورة بهذا المعرف", 404);
  return await withViewableThumbnail(course);
};

export const updateCourse = async (id, data, user) => {
  if (!id) throw new AppError("المعرف الدورة مطلوب", 400);

  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) throw new AppError("لا توجد دورة بهذا المعرف", 404);

  if (course.instructorId !== user.id && user.role !== "ADMIN") {
    throw new AppError("غير مسموح بتحديث هذه الدورة", 403);
  }

  const { title, description, level, thumbnail, thumbnailKey, categoryId, published } = data;

  const updatedSlug = title
    ? `${slugify(title, { lower: true, strict: true })}-${Date.now()}`
    : course.slug;

  const updated = await prisma.course.update({
    where: { id },
    data: {
      title: title || course.title,
      description: description || course.description,
      level: level || course.level,
      thumbnail: thumbnail || course.thumbnail,
      thumbnailKey: thumbnailKey || course.thumbnailKey,
      categoryId: categoryId || course.categoryId,
      slug: updatedSlug,
      published: published !== undefined ? published : course.published,
    },
  });

  return await withViewableThumbnail(updated);
};

export const deleteCourse = async (id, user) => {
  if (!id) throw new AppError("المعرف الدورة مطلوب", 400);

  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) throw new AppError("لا توجد دورة بهذا المعرف", 404);

  if (course.instructorId !== user.id && user.role !== "ADMIN") {
    throw new AppError("غير مسموح بحذف هذه الدورة", 403);
  }

  const enrollmentCount = await prisma.enrollment.count({ where: { courseId: id } });
  if (enrollmentCount > 0) {
    throw new AppError("لا يمكن حذف الكورس لأنه يحتوي على طلاب مسجلين. قم بإلغاء نشره بدلاً من ذلك.", 409);
  }

  await prisma.course.delete({ where: { id } });
  return { success: true, message: "تم حذف الدورة بنجاح" };
};

export const togglePublish = async (id, user) => {
  if (!id) throw new AppError("المعرف الدورة مطلوب", 400);

  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) throw new AppError("لا توجد دورة بهذا المعرف", 404);

  if (course.instructorId !== user.id && user.role !== "ADMIN") {
    throw new AppError("غير مسموح بتعديل حالة نشر هذه الدورة", 403);
  }

  const updated = await prisma.course.update({
    where: { id },
    data: { published: !course.published },
  });

  return await withViewableThumbnail(updated);
};

export const getCourseProgress = async (courseId, userId) => {
  if (!courseId) throw new AppError("المعرف الدورة مطلوب", 400);

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { _count: { select: { lessons: true } } },
  });
  if (!course) throw new AppError("لا توجد دورة بهذا المعرف", 404);

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { progress: true, completedLessons: true },
  });

  const totalLessons = course._count.lessons;
  const completed = enrollment?.completedLessons.length ?? 0;

  return {
    courseId,
    totalLessons,
    completed,
    progress: enrollment?.progress ?? 0,
  };
};
