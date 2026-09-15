import prisma from "../../lib/prisma.js";
import { createPresignedDownloadUrl } from "../../lib/storage.js";
import { AppError } from "../../utils/appError.js";
import { Prisma } from "@prisma/client";

const PLAYBACK_URL_TTL_SECONDS = 30 * 60; // صلاحية رابط المشاهدة الموقّع

/**
 * الرابط القابل للتشغيل لدرس واحد:
 * إن وُجد videoKey نولّد رابط GET موقّعاً صالحاً 30 دقيقة，
 * وإلا نُعيد videoUrl القديم كما هو — الدروس المرفوعة يدوياً تبقى تعمل.
 * اسم الحقل في الرد يبقى videoUrl حتى لا يتغيّر شكل الاستجابة على الواجهة.
 */
const withPlayableVideoUrl = async (lesson) => {
  if (!lesson?.videoKey) return lesson;

  const videoUrl = await createPresignedDownloadUrl({
    key: lesson.videoKey,
    expiresIn: PLAYBACK_URL_TTL_SECONDS,
  });

  return { ...lesson, videoUrl };
};

const withPlayableVideoUrls = async (lessons) =>
  await Promise.all(lessons.map(withPlayableVideoUrl));

/**
 * من يحق له قراءة محتوى دروس الكورس ورابط الفيديو الموقّع:
 * الطالب المسجّل في الكورس، أو مدرّس الكورس، أو الأدمن.
 * نفس القاعدة المطبّقة في modules/ai على الملخص والاختبار.
 * يرمي 404 إن لم يوجد الكورس، و403 إن لم يكن للمستخدم حق الوصول.
 */
const assertCourseAccess = async (courseId, user) => {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      instructorId: true,
      enrollments: {
        where: { userId: user.id },
        select: { id: true },
        take: 1,
      },
    },
  });
  if (!course) throw new AppError("لا توجد دورة بهذا المعرف", 404);

  const isEnrolled = course.enrollments.length > 0;
  const isInstructor = course.instructorId === user.id;
  const isAdmin = user.role === "ADMIN";

  if (!isEnrolled && !isInstructor && !isAdmin) {
    throw new AppError("يجب أن تكون مسجّلاً في هذا الكورس لعرض دروسه", 403);
  }
};

export const createLesson = async (data, user) => {
  const { title, content, videoUrl, videoKey, order, courseId } = data;

  if (!title || !courseId) throw new AppError("العنوان ومعرف الدورة التدريبية مطلوبان", 400);
  if (!videoUrl && !videoKey) throw new AppError("فيديو الدرس مطلوب: videoKey أو videoUrl", 400);

  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });
  if (!course) throw new AppError("لا توجد دورة بهذا المعرف", 404);

  if (course.instructorId !== user.id && user.role !== "ADMIN") {
    throw new AppError("Not allowed to add lessons to this course", 403);
  }

  // الترتيب فريد داخل الكورس (@@unique([courseId, order])): إن لم يُرسل نضعه بعد الأخير
  let lessonOrder = order;
  if (lessonOrder === undefined || lessonOrder === null) {
    const last = await prisma.lesson.findFirst({
      where: { courseId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    lessonOrder = last ? last.order + 1 : 1;
  }

  try {
    return await prisma.lesson.create({
      data: {
        title,
        content,
        videoUrl,
        videoKey,
        order: Number(lessonOrder),
        courseId: courseId,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new AppError("يوجد درس بنفس الترتيب في هذه الدورة، اختر ترتيباً آخر", 409);
    }
    throw err;
  }
};

export const getLessonsByCourse = async (courseId, user) => {
  if (!courseId) throw new AppError("معرف الدورة مطلوب", 400);

  await assertCourseAccess(courseId, user);

  const lessons = await prisma.lesson.findMany({
    where: { courseId: courseId },
    orderBy: { order: "asc" },
  });

  return await withPlayableVideoUrls(lessons);
};

export const getLessonById = async (id, user) => {
  if (!id) throw new AppError("معرف الدرس مطلوب", 400);

  const lesson = await prisma.lesson.findUnique({ where: { id: id } });
  if (!lesson) throw new AppError("الدرس غير موجود", 404);

  await assertCourseAccess(lesson.courseId, user);

  return await withPlayableVideoUrl(lesson);
};

export const updateLesson = async (id, data, user) => {
  if (!id) throw new AppError("Lesson id is required", 400);

  const lesson = await prisma.lesson.findUnique({
    where: { id: id },
    include: { course: true },
  });
  if (!lesson) throw new AppError("Lesson not found", 404);

  if (lesson.course.instructorId !== user.id && user.role !== "ADMIN") {
    throw new AppError("Not allowed to update this lesson", 403);
  }

  const { title, content, videoUrl, videoKey, order } = data;

  try {
    return await prisma.lesson.update({
      where: { id: id },
      data: {
        title: title || lesson.title,
        content: content || lesson.content,
        videoUrl: videoUrl || lesson.videoUrl,
        videoKey: videoKey || lesson.videoKey,
        order: order !== undefined ? Number(order) : lesson.order,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new AppError("يوجد درس بنفس الترتيب في هذه الدورة، اختر ترتيباً آخر", 409);
    }
    throw err;
  }
};

export const deleteLesson = async (id, user) => {
  if (!id) throw new AppError("Lesson id is required", 400);

  const lesson = await prisma.lesson.findUnique({
    where: { id: id },
    include: { course: true },
  });
  if (!lesson) throw new AppError("Lesson not found", 404);

  if (lesson.course.instructorId !== user.id && user.role !== "ADMIN") {
    throw new AppError("Not allowed to delete this lesson", 403);
  }

  await prisma.lesson.delete({ where: { id: id } });
  return { success: true, message: "Lesson deleted successfully" };
};

export const completeLesson = async (userId, courseId, lessonId) => {
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { id: true, completedLessons: true },
  });
  if (!enrollment) throw new AppError("انت لست مسجلاً في هذه الدورة", 404);

  // الدرس يجب أن يكون من هذا الكورس فعلاً، وإلا أمكن رفع التقدم بمعرّفات عشوائية
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, courseId },
    select: { id: true },
  });
  if (!lesson) throw new AppError("الدرس غير موجود في هذه الدورة", 404);

  const courseLessonIds = (
    await prisma.lesson.findMany({ where: { courseId }, select: { id: true } })
  ).map((l) => l.id);

  // نحتفظ فقط بالدروس التي ما زالت موجودة، ونضيف الحالي بلا تكرار
  const completedLessons = [
    ...new Set([
      ...enrollment.completedLessons.filter((id) => courseLessonIds.includes(id)),
      lessonId,
    ]),
  ];

  // التقدم مشتق دائماً من العدّ، ولا يُقبل من العميل
  const totalLessons = courseLessonIds.length;
  const progress = totalLessons
    ? Math.min(100, Math.round((completedLessons.length / totalLessons) * 100))
    : 0;

  return await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: { completedLessons, progress },
  });
};


// جدول لوحة التحكم: الأدمن يرى كل الدروس، والمدرّس دروس كورساته فقط
export const getAllLessons = async (user) => {
  const lessons = await prisma.lesson.findMany({
    where: user.role === "ADMIN" ? {} : { course: { instructorId: user.id } },
    include: { course: true },
    orderBy: { order: "asc" },
  });


  return await withPlayableVideoUrls(lessons);
};
