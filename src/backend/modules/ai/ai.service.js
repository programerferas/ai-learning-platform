// modules/ai/ai.service.js
import prisma from "../../lib/prisma.js";
import { callGemini } from "../../lib/gemini.js";
import { AppError } from "../../utils/appError.js";
import {
  chatPrompt,
  summaryPrompt,
  quizPrompt,
  recommendationPrompt,
} from "../../utils/geminiPrompts.js";
import {
  parseQuizResponse,
  parseRecommendationResponse,
} from "../../utils/aiParser.js";
import { createTtlCache } from "../../utils/ttlCache.js";

// اختبار الكورس والتوصيات لا يُخزَّنان في القاعدة (بخلاف ملخص/اختبار الدرس)،
// فنخزّنهما مؤقتاً حتى لا يتحوّل كل ضغط على الزر إلى استدعاء Gemini جديد.
const courseQuizCache = createTtlCache({ ttlMs: 6 * 60 * 60 * 1000 });     // 6 ساعات
const recommendationsCache = createTtlCache({ ttlMs: 24 * 60 * 60 * 1000 }); // 24 ساعة

// ─────────────────────────────────────────────
// CHAT ASSISTANT
// ─────────────────────────────────────────────

export const chatWithAssistant = async ({
  userId,
  userRole,
  message,
  sessionId,
  lessonId,
}) => {
  let lesson = null;
  if (lessonId) {
    lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        title: true,
        content: true,
        course: {
          select: {
            instructorId: true,
            enrollments: { where: { userId }, select: { id: true }, take: 1 },
          },
        },
      },
    });
    if (!lesson) throw new AppError("الدرس غير موجود.", 404);

    // محتوى الدرس يدخل في الـ prompt، فنطبّق نفس قاعدة الوصول لمسارات الدروس
    const isEnrolled = lesson.course.enrollments.length > 0;
    const isInstructor = lesson.course.instructorId === userId;
    if (!isEnrolled && !isInstructor && userRole !== "ADMIN") {
      throw new AppError("يجب أن تكون مسجّلاً في هذا الكورس لاستخدام المساعد.", 403);
    }
  }

  let session;
  if (sessionId) {
    session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        // آخر 20 رسالة (لا أول 20) ثم نعيد ترتيبها تصاعدياً للسياق
        messages: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });
    if (!session)
      throw new AppError("جلسة المحادثة غير موجودة أو لا تخصّ هذا المستخدم.", 404);
  } else {
    session = await prisma.chatSession.create({
      data: {
        userId,
        lessonId: lesson?.id ?? null,
      },
      include: { messages: true },
    });
  }

  const history = [...session.messages].reverse().map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  const prompt = chatPrompt({
    lessonTitle: lesson?.title ?? null,
    lessonContent: lesson?.content ?? null,
    userMessage: message,
    history,
  });

  const aiReply = await callGemini(prompt);

  await prisma.$transaction([
    prisma.chatMessage.create({
      data: { sessionId: session.id, role: "user", content: message },
    }),
    prisma.chatMessage.create({
      data: { sessionId: session.id, role: "assistant", content: aiReply },
    }),
  ]);

  return {
    sessionId: session.id,
    reply: aiReply,
  };
};

// ─────────────────────────────────────────────
// COURSE SUMMARY GENERATOR
// ─────────────────────────────────────────────

export const generateLessonSummary = async ({ lessonId, userId, userRole }) => {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      title: true,
      content: true,
      course: {
        select: {
          id: true,
          instructorId: true,
          enrollments: {
            where: { userId },
            select: { id: true },
          },
        },
      },
    },
  });

  if (!lesson) throw new AppError("الدرس غير موجود.", 404);

  // الطالب المسجّل أو مدرّس الكورس أو الأدمن (لوحة التحكم) يمكنه توليد الملخص
  const isEnrolled = lesson.course.enrollments.length > 0;
  const isInstructor = lesson.course.instructorId === userId;
  const isAdmin = userRole === "ADMIN";

  if (!isEnrolled && !isInstructor && !isAdmin) {
    throw new AppError(
      "يجب أن تكون مسجّلاً في هذا الكورس لتوليد الملخص.",
      403,
    );
  }

  if (!lesson.content || lesson.content.trim().length < 50) {
    throw new AppError(
      "محتوى الدرس قصير جداً لتوليد ملخص مفيد (50 حرفاً على الأقل).",
      400,
    );
  }

  const existing = await prisma.lessonSummary.findUnique({
    where: { lessonId: lesson.id },
  });

  if (existing) {
    return { summary: existing.content, cached: true };
  }

  const prompt = summaryPrompt({
    lessonTitle: lesson.title,
    lessonContent: lesson.content,
  });

  const summaryText = await callGemini(prompt);

  await prisma.lessonSummary.create({
    data: { lessonId: lesson.id, content: summaryText },
  });



  return { summary: summaryText, cached: false };
};

// ─────────────────────────────────────────────
// QUIZ GENERATOR
// ─────────────────────────────────────────────

export const generateLessonQuiz = async ({
  lessonId,
  userId,
  userRole,
  questionCount,
}) => {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      title: true,
      content: true,
      course: {
        select: {
          instructorId: true,
          enrollments: {
            where: { userId },
            select: { id: true },
          },
        },
      },
    },
  });

  if (!lesson) throw new AppError("الدرس غير موجود.", 404);

  // الطالب المسجّل أو مدرّس الكورس أو الأدمن (لوحة التحكم) يمكنه توليد الاختبار
  const isEnrolled = lesson.course.enrollments.length > 0;
  const isInstructor = lesson.course.instructorId === userId;
  const isAdmin = userRole === "ADMIN";

  if (!isEnrolled && !isInstructor && !isAdmin) {
    throw new AppError(
      "يجب أن تكون مسجّلاً في هذا الكورس لتوليد الاختبار.",
      403,
    );
  }

  if (!lesson.content || lesson.content.trim().length < 50) {
    throw new AppError(
      "محتوى الدرس قصير جداً لتوليد اختبار مفيد (50 حرفاً على الأقل).",
      400,
    );
  }

  const existing = await prisma.quiz.findUnique({
    where: { lessonId: lesson.id },
    include: { questions: true },
  });

  if (existing) {
    return {
      quizId: existing.id,
      questions: existing.questions.map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
      })),
      cached: true,
    };
  }

  const prompt = quizPrompt({
    lessonTitle: lesson.title,
    lessonContent: lesson.content,
    questionCount,
  });

  const rawText = await callGemini(prompt, { json: true });
  const parsedQuestions = parseQuizResponse(rawText);

  const quiz = await prisma.$transaction(async (tx) => {
    const newQuiz = await tx.quiz.create({
      data: { lessonId: lesson.id },
    });

    await tx.quizQuestion.createMany({
      data: parsedQuestions.map((q) => ({
        quizId: newQuiz.id,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
      })),
    });

    return newQuiz;
  });

  const savedQuestions = await prisma.quizQuestion.findMany({
    where: { quizId: quiz.id },
  });

  return {
    quizId: quiz.id,
    questions: savedQuestions.map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
    })),
    cached: false,
  };
};

// ─────────────────────────────────────────────
// generateCourseQuiz
// ─────────────────────────────────────────────

export const generateCourseQuiz = async ({
  courseId,
  userId,
  userRole,
  questionCount = 10,
}) => {
  // 1. Check enrollment
  const enrollment = await prisma.enrollment.findFirst({
    where: { courseId: courseId, userId },
  });

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { instructorId: true, title: true },
  });

  if (!course) throw new AppError("الكورس غير موجود.", 404);

  const isInstructor = course.instructorId === userId;
  const isAdmin = userRole === "ADMIN";
  if (!enrollment && !isInstructor && !isAdmin) {
    throw new AppError("يجب أن تكون مسجّلاً في هذا الكورس.", 403);
  }

  const cacheKey = `${courseId}:${questionCount}`;
  const cached = courseQuizCache.get(cacheKey);
  if (cached) return { ...cached, cached: true };

  // 2. Fetch all lesson summaries for this course
  const summaries = await prisma.lessonSummary.findMany({
    where: { lesson: { courseId: courseId } },
    include: { lesson: { select: { title: true, order: true } } },
    orderBy: { lesson: { order: "asc" } },
  });

  if (summaries.length === 0) {
    throw new AppError(
      "لا توجد ملخصات لهذا الكورس. يرجى توليد ملخصات الدروس أولاً.",
      400,
    );
  }

  // 3. Build combined content from all summaries
  const combinedContent = summaries
    .map((s) => `## ${s.lesson.title}\n${s.content}`)
    .join("\n\n");

  // 4. Call Gemini
  const prompt = quizPrompt({
    lessonTitle: course.title,
    lessonContent: combinedContent,
    questionCount,
  });

  const rawText = await callGemini(prompt, { json: true });
  const parsedQuestions = parseQuizResponse(rawText);

  const result = {
    questions: parsedQuestions.map((q, i) => ({
      id: i + 1,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
    })),
  };
  courseQuizCache.set(cacheKey, result);
  return { ...result, cached: false };
};

// ─────────────────────────────────────────────
// COURSE RECOMMENDATION SYSTEM
// ─────────────────────────────────────────────

export const getRecommendations = async ({ userId }) => {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    include: {
      course: {
        include: { category: true },
      },
    },
  });

  if (enrollments.length === 0) {
    return {
      recommendations: [],
      message: "Enroll in some courses to get personalized recommendations.",
    };
  }

  const enrolledCourseIds = enrollments.map((e) => e.course.id);

  // المفتاح يشمل مجموعة الكورسات المسجّل بها: تسجيل جديد = توصيات جديدة تلقائياً
  const cacheKey = `${userId}:${[...enrolledCourseIds].sort().join(",")}`;
  const cached = recommendationsCache.get(cacheKey);
  if (cached) return { ...cached, cached: true };

  const enrolledCategoryIds = [
    ...new Set(enrollments.map((e) => e.course.categoryId)),
  ];

  let candidateCourses = await prisma.course.findMany({
    where: {
      id: { notIn: enrolledCourseIds },
      categoryId: { in: enrolledCategoryIds },
      published: true,
    },
    include: { category: true },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  if (candidateCourses.length < 3) {
    const fallback = await prisma.course.findMany({
      where: {
        id: { notIn: enrolledCourseIds },
        published: true,
      },
      include: { category: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    });
    // Merge without duplicates using Map
    const merged = new Map();
    [...candidateCourses, ...fallback].forEach((c) => merged.set(c.id, c));
    candidateCourses = [...merged.values()].slice(0, 6);
  }

  if (candidateCourses.length === 0) {
    return {
      recommendations: [],
      message: "You have explored all available courses!",
    };
  }

  const prompt = recommendationPrompt({
    completedCourses: enrollments.map((e) => ({
      title: e.course.title,
      category: e.course.category.name,
    })),
    recommendedCourses: candidateCourses.map((c) => ({
      title: c.title,
      category: c.category.name,
    })),
  });

  const rawText = await callGemini(prompt, { json: true });
  const aiData = parseRecommendationResponse(rawText);

  const result = {
    recommendations: candidateCourses.map((course) => ({
      id: course.id,
      title: course.title,
      slug: course.slug,
      category: course.category.name,
      explanation:
        aiData.explanations[course.title] ??
        "This course aligns with your learning path.",
    })),
    overallMessage: aiData.overallMessage,
  };
  recommendationsCache.set(cacheKey, result);
  return { ...result, cached: false };
};
