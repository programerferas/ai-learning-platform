import prisma from "../../lib/prisma.js";
import { sendEnrollmentEmail } from "../../lib/mailer.js";

/**
 * ENROLL IN COURSE
 */
export const enrollInCourse = async (courseId, user) => {
  if (!courseId) throw new Error("المعرف الدورة مطلوب");

  // 1. CHECK COURSE EXISTS & PUBLISHED
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });
  if (!course) throw new Error("Course not found");
  if (!course.published) throw new Error("الأسف، هذه الدورة غير متاحة حالياً");

  // 2. CHECK ALREADY ENROLLED
  const existing = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: user.id,
        courseId: courseId,
      },
    },
  });
  if (existing) throw new Error("أنت مسجل بالفعل في هذه الدورة");

  // 3. CREATE ENROLLMENT
  const enrollment = await prisma.enrollment.create({
    data: {
      userId: user.id,
      courseId: courseId,
    },
  });

  // 4. SEND EMAIL
  await sendEnrollmentEmail(user.email, user.name, course.title);

  return enrollment;
};

/**
 * CHECK ENROLLMENT
 */
export const checkEnrollment = async (courseId, user) => {
  if (!courseId) throw new Error("المعرف الدورة مطلوب");

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
  return await prisma.enrollment.findMany({
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
};

/**
 * UPDATE PROGRESS
 */
export const updateProgress = async (courseId, user, progress) => {
  if (!courseId) throw new Error("المعرف الدورة مطلوب");
  if (progress === undefined) throw new Error("التقدم مطلوب");
  if (progress < 0 || progress > 100)
    throw new Error("التقدم يجب أن يكون بين 0 و 100");

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: user.id,
        courseId: courseId,
      },
    },
  });
  if (!enrollment) throw new Error("Not enrolled in this course");

  return await prisma.enrollment.update({
    where: {
      userId_courseId: {
        userId: user.id,
        courseId: courseId,
      },
    },
    data: { progress: Number(progress) },
  });
};

/**
 * UNENROLL FROM COURSE
 */
export const unenrollFromCourse = async (courseId, user) => {
  if (!courseId) throw new Error("المعرف الدورة مطلوب");

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: user.id,
        courseId: courseId,
      },
    },
  });
  if (!enrollment) throw new Error("انت لست مسجلاً في هذه الدورة");

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
  const enrollment = await prisma.enrollment.findFirst({
    where: { userId, courseId },
  });

  if (!enrollment) throw new Error("انت لست مسجلاً في هذه الدورة");

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

  if (!enrollment) throw new Error("انت لست مسجلاً في هذه الدورة");

  return {
    lastLessonId: enrollment.lastLessonId,
    lastPosition: enrollment.lastPosition,
    lessons: enrollment.course.lessons,
  };
};