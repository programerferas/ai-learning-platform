import prisma from "../../lib/prisma.js";
import { createPresignedDownloadUrl } from "../../lib/storage.js";

const PLAYBACK_URL_TTL_SECONDS = 2 * 60 * 60; // صلاحية رابط المشاهدة الموقّع

/**
 * الرابط القابل للتشغيل لدرس واحد:
 * إن وُجد videoKey نولّد رابط GET موقّعاً صالحاً ساعتين،
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

export const createLesson = async (data, user) => {
  const { title, content, videoUrl, videoKey, order, courseId } = data;

  if (!title || !courseId) throw new Error("العنوان ومعرف الدورة التدريبية مطلوبان");
  if (!videoUrl && !videoKey) throw new Error("فيديو الدرس مطلوب: videoKey أو videoUrl");

  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });
  if (!course) throw new Error("لا توجد دورة بهذا المعرف");

  if (course.instructorId !== user.id && user.role !== "ADMIN") {
    throw new Error("Not allowed to add lessons to this course");
  }

  return await prisma.lesson.create({
    data: {
      title,
      content,
      videoUrl,
      videoKey,
      order: Number(order) || 0,
      courseId: courseId,
    },
  });
};

export const getLessonsByCourse = async (courseId) => {
  if (!courseId) throw new Error("Course id is required");

  const lessons = await prisma.lesson.findMany({
    where: { courseId: courseId },
    orderBy: { order: "asc" },
  });

  return await withPlayableVideoUrls(lessons);
};

export const getLessonById = async (id) => {
  if (!id) throw new Error("Lesson id is required");

  const lesson = await prisma.lesson.findUnique({ where: { id: id } });
  if (!lesson) throw new Error("Lesson not found");

  return await withPlayableVideoUrl(lesson);
};

export const updateLesson = async (id, data, user) => {
  if (!id) throw new Error("Lesson id is required");

  const lesson = await prisma.lesson.findUnique({
    where: { id: id },
    include: { course: true },
  });
  if (!lesson) throw new Error("Lesson not found");

  if (lesson.course.instructorId !== user.id && user.role !== "ADMIN") {
    throw new Error("Not allowed to update this lesson");
  }

  const { title, content, videoUrl, videoKey, order } = data;

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
};

export const deleteLesson = async (id, user) => {
  if (!id) throw new Error("Lesson id is required");

  const lesson = await prisma.lesson.findUnique({
    where: { id: id },
    include: { course: true },
  });
  if (!lesson) throw new Error("Lesson not found");

  if (lesson.course.instructorId !== user.id && user.role !== "ADMIN") {
    throw new Error("Not allowed to delete this lesson");
  }

  await prisma.lesson.delete({ where: { id: id } });
  return { success: true, message: "Lesson deleted successfully" };
};

export const completeLesson = async (userId, courseId, lessonId) => {
  const enrollment = await prisma.enrollment.findFirst({
    where: { userId, courseId },
  });

  if (!enrollment) throw new Error("Not enrolled");

  const alreadyDone = enrollment.completedLessons.includes(lessonId);

  if (!alreadyDone) {
    enrollment.completedLessons.push(lessonId);
  }

  const totalLessons = await prisma.lesson.count({
    where: { courseId },
  });

  const progress = Math.round(
    (enrollment.completedLessons.length / totalLessons) * 100,
  );

  return await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: {
      completedLessons: enrollment.completedLessons,
      progress,
    },
  });
};


export const getAllLessons = async () => {
  const lessons = await prisma.lesson.findMany({
    include: { course: true },
    orderBy: { order: "asc" },
  });


  return await withPlayableVideoUrls(lessons);
};
