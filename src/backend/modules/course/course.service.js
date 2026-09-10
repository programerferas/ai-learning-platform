import prisma from "../../lib/prisma.js";
import slugify from "slugify";

export const createCourse = async (data, user) => {
  const { title, description, level, categoryId, thumbnail } = data;

  if (!title || !description || !level || !categoryId) {
    throw new Error("جميع الحقول المطلوبة يجب أن تكون موجودة");
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });
  if (!category) throw new Error("Category not found");

  const baseSlug = slugify(title, { lower: true, strict: true });
  const uniqueSlug = `${baseSlug}-${Date.now()}`;

  return await prisma.course.create({
    data: {
      title,
      description,
      level,
      thumbnail,
      categoryId,
      instructorId: user.id,
      slug: uniqueSlug,
    },
  });
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
      include: { category: true, instructor: true },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: "desc" },
    }),
    prisma.course.count({ where }),
  ]);

  return {
    courses,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
  };
};

export const getCourseById = async (id) => {
  if (!id) throw new Error("المعرف الدورة مطلوب");

  const course = await prisma.course.findUnique({
    where: { id },
    include: { category: true, lessons: true },
  });

  if (!course) throw new Error("لا توجد دورة بهذا المعرف");
  return course;
};

export const updateCourse = async (id, data, user) => {
  if (!id) throw new Error("المعرف الدورة مطلوب");

  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) throw new Error("لا توجد دورة بهذا المعرف");

  if (course.instructorId !== user.id && user.role !== "ADMIN") {
    throw new Error("غير مسموح بتحديث هذه الدورة");
  }

  const { title, description, level, thumbnail, categoryId, published } = data;

  const updatedSlug = title
    ? `${slugify(title, { lower: true, strict: true })}-${Date.now()}`
    : course.slug;

  return await prisma.course.update({
    where: { id },
    data: {
      title: title || course.title,
      description: description || course.description,
      level: level || course.level,
      thumbnail: thumbnail || course.thumbnail,
      categoryId: categoryId || course.categoryId,
      slug: updatedSlug,
      published: published !== undefined ? published : course.published,
    },
  });
};

export const deleteCourse = async (id, user) => {
  if (!id) throw new Error("المعرف الدورة مطلوب");

  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) throw new Error("لا توجد دورة بهذا المعرف");

  if (course.instructorId !== user.id && user.role !== "ADMIN") {
    throw new Error("غير مسموح بحذف هذه الدورة");
  }

  const enrollmentCount = await prisma.enrollment.count({ where: { courseId: id } });
  if (enrollmentCount > 0) {
    throw new Error("لا يمكن حذف الكورس لأنه يحتوي على طلاب مسجلين. قم بإلغاء نشره بدلاً من ذلك.");
  }

  await prisma.course.delete({ where: { id } });
  return { success: true, message: "تم حذف الدورة بنجاح" };
};

export const togglePublish = async (id, user) => {
  if (!id) throw new Error("المعرف الدورة مطلوب");

  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) throw new Error("لا توجد دورة بهذا المعرف");

  if (course.instructorId !== user.id && user.role !== "ADMIN") {
    throw new Error("غير مسموح بتعديل حالة نشر هذه الدورة");
  }

  return await prisma.course.update({
    where: { id },
    data: { published: !course.published },
  });
};

export const getCourseProgress = async (courseId, userId) => {
  if (!courseId) throw new Error("المعرف الدورة مطلوب");
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      lessons: true,
    },
  });

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      courseId,
      userId,
    },
  });

  const totalLessons = course.lessons.length;
  const completed = enrollment?.progress || 0;

  const progress = totalLessons
    ? Math.round((completed / totalLessons) * 100)
    : 0;

  return {
    courseId,
    totalLessons,
    completed,
    progress,
  };
};