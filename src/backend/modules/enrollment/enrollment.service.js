import prisma from "../../lib/prisma.js";
import { AppError } from "../../utils/appError.js";
import { sendEnrollmentEmail } from "../../lib/mailer.js";
import { withViewableThumbnail } from "../course/course.service.js";
import logger from "../../utils/logger.js";

/**
 * ENROLL IN COURSE
 */
export const enrollInCourse = async (courseId, user) => {
  if (!courseId) throw new AppError("المعرف الدورة مطلوب", 400);

  // 1. CHECK COURSE EXISTS & PUBLISHED
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });
  if (!course) throw new AppError("Course not found", 404);
  if (!course.published) throw new AppError("الأسف، هذه الدورة غير متاحة حالياً", 403);

  // 2. CHECK ALREADY ENROLLED
  const existing = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: user.id,
        courseId: courseId,
      },
    },
  });
  if (existing) throw new AppError("أنت مسجل بالفعل في هذه الدورة", 409);

  // 3. CREATE ENROLLMENT
  const enrollment = await prisma.enrollment.create({
    data: {
      userId: user.id,
      courseId: courseId,
    },
  });

  // 4. SEND EMAIL — خارج مسار الاستجابة: التسجيل تمّ فعلاً،
  // وفشل SMTP لا يجوز أن يعيد 500 للطالب المسجّل
  setImmediate(() => {
    sendEnrollmentEmail(user.email, user.name, course.title).catch((err) =>
      logger.error("enrollment.email_failed", { userId: user.id, courseId, err }),
    );
  });

  return enrollment;
};

/**
 * CHECK ENROLLMENT
 */
export const checkEnrollment = async (courseId, user) => {
  if (!courseId) throw new AppError("المعرف الدورة مطلوب", 400);

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: user.id,
        courseId: courseId,
      },
    },
  });

  return { enrolled: !!enrollment };
};

/**
 * GET MY ENROLLMENTS
 */
export const getMyEnrollments = async (user) => {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: user.id },
    include: {
      course: {
        include: {
          category: true,
          lessons: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // صورة الكورس المخزّنة بمفتاح تحتاج رابطاً موقّعاً كما في /courses
  return await Promise.all(
    enrollments.map(async (enrollment) => ({
      ...enrollment,
      course: await withViewableThumbnail(enrollment.course),
    })),
  );
};

/**
 * UNENROLL FROM COURSE
 */
export const unenrollFromCourse = async (courseId, user) => {
  if (!courseId) throw new AppError("المعرف الدورة مطلوب", 400);

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: user.id,
        courseId: courseId,
      },
    },
  });
  if (!enrollment) throw new AppError("انت لست مسجلاً في هذه الدورة", 404);

  await prisma.enrollment.delete({
    where: {
      userId_courseId: {
        userId: user.id,
        courseId: courseId,
      },
    },
  });

  return { success: true, message: "نجحت عملية إلغاء التسجيل" };
};

/**
 * GET ALL ENROLLMENTS (ADMIN)
 */
export const getAllEnrollments = async () => {
  return await prisma.enrollment.findMany({
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      course: {
        select: { id: true, title: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

/**
 * CONTINUE LEARNING
 */
export const getContinueLearning = async (user) => {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: user.id },
    include: {
      course: {
        include: {
          lessons: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  return enrollments.map((enrollment) => {
    const lessons = enrollment.course.lessons;
    const nextLesson =
      lessons.find((l) => l.id === enrollment.lastLessonId) || lessons[0];

    return {
      courseId: enrollment.courseId,
      courseTitle: enrollment.course.title,
      progress: enrollment.progress,
      nextLesson,
    };
  });
};

/**
 * SAVE PROGRESS
 */
export const saveProgress = async (userId, courseId, lessonId, position) => {
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { id: true },
  });
  if (!enrollment) throw new AppError("انت لست مسجلاً في هذه الدورة", 404);

  // الدرس يجب أن يكون من هذا الكورس فعلاً
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, courseId },
    select: { id: true },
  });
  if (!lesson) throw new AppError("الدرس غير موجود في هذه الدورة", 404);

  return await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: {
      lastLessonId: lessonId,
      lastPosition: position,
    },
  });
};

/**
 * GET RESUME
 */
export const getResume = async (userId, courseId) => {
  const enrollment = await prisma.enrollment.findFirst({
    where: { userId, courseId },
    include: {
      course: {
        include: {
          lessons: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!enrollment) throw new AppError("انت لست مسجلاً في هذه الدورة", 404);

  return {
    lastLessonId: enrollment.lastLessonId,
    lastPosition: enrollment.lastPosition,
    lessons: enrollment.course.lessons,
  };
};

/**
 * ملخص تقدم الطالب في كورس: للصفحة الخاصة بالدرس
 */
export const getEnrollmentByCourse = async (courseId, user) => {
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
    select: { progress: true, completedLessons: true },
  });
  if (!enrollment) throw new AppError("انت لست مسجلاً في هذه الدورة", 404);

  const totalLessons = await prisma.lesson.count({ where: { courseId } });

  return {
    completedLessons: enrollment.completedLessons,
    completed: enrollment.completedLessons.length,
    progress: enrollment.progress,
    totalLessons,
  };
};
