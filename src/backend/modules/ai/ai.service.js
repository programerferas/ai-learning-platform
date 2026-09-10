// modules/ai/ai.service.js
import prisma from "../../lib/prisma.js";
import { callGroq as callGroq } from "../../lib/groq.js";
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

// ─────────────────────────────────────────────
// HELPER — replaces extractTextContent
// ─────────────────────────────────────────────

export const callcallGroq = async (prompt) => {
  const result = await geminiModel.generateContent(prompt);
  const text = result.response.text();
  if (!text) throw new Error("Gemini returned an empty response.");
  return text.trim();
};

// ─────────────────────────────────────────────
// CHAT ASSISTANT
// ─────────────────────────────────────────────

export const chatWithAssistant = async ({
  userId,
  message,
  sessionId,
  lessonId,
}) => {
  let lesson = null;
  if (lessonId) {
    lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, title: true, content: true },
    });
  }

  let session;
  if (sessionId) {
    session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 20,
        },
      },
    });
    if (!session)
      throw new Error(
        "Chat session not found or does not belong to this user.",
      );
  } else {
    session = await prisma.chatSession.create({
      data: {
        userId,
        lessonId: lesson?.id ?? null,
      },
      include: { messages: true },
    });
  }

  const history = session.messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  const prompt = chatPrompt({
    lessonTitle: lesson?.title ?? null,
    lessonContent: lesson?.content ?? null,
    userMessage: message,
    history,
  });

  const aiReply = await callGroq(prompt);

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

export const generateLessonSummary = async ({ lessonId, userId }) => {
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

  if (!lesson) throw new Error("Lesson not found.");

  const isEnrolled = lesson.course.enrollments.length > 0;
  const isInstructor = lesson.course.instructorId === userId;

  if (!isEnrolled && !isInstructor) {
    throw new Error(
      "You must be enrolled in this course to generate a summary.",
    );
  }

  if (!lesson.content || lesson.content.trim().length < 50) {
    throw new Error(
      "Lesson content is too short to generate a meaningful summary.",
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

  const summaryText = await callGroq(prompt);

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

  if (!lesson) throw new Error("Lesson not found.");

  const isEnrolled = lesson.course.enrollments.length > 0;
  const isInstructor = lesson.course.instructorId === userId;

  if (!isEnrolled && !isInstructor) {
    throw new Error("You must be enrolled in this course to generate a quiz.");
  }

  if (!lesson.content || lesson.content.trim().length < 50) {
    throw new Error("Lesson content is too short to generate a quiz.");
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

  const rawText = await callGroq(prompt);
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

export const generateCourseQuiz = async ({ courseId, userId, questionCount = 10 }) => {
  // 1. Check enrollment
  const enrollment = await prisma.enrollment.findFirst({
    where: { courseId: courseId, userId },
  });

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { instructorId: true, title: true },
  });

  if (!course) throw new Error("Course not found.");
  if (!enrollment && course.instructorId !== userId)
    throw new Error("You must be enrolled in this course.");

  // 2. Fetch all lesson summaries for this course
  const summaries = await prisma.lessonSummary.findMany({
    where: { lesson: { courseId: courseId } },
    include: { lesson: { select: { title: true, order: true } } },
    orderBy: { lesson: { order: "asc" } },
  });

  if (summaries.length === 0)
    throw new Error("No summaries found. Please generate lesson summaries first.");

  // 3. Build combined content from all summaries
  const combinedContent = summaries
    .map((s) => `## ${s.lesson.title}\n${s.content}`)
    .join("\n\n");

  // 4. Call Groq
  const prompt = quizPrompt({
    lessonTitle: course.title,
    lessonContent: combinedContent,
    questionCount,
  });

  const rawText = await callGroq(prompt);
  const parsedQuestions = parseQuizResponse(rawText);

  return {
    questions: parsedQuestions.map((q, i) => ({
      id: i + 1,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
    })),
  };
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
        isPublished: true,
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

  const rawText = await callGroq(prompt);
  const aiData = parseRecommendationResponse(rawText);

  return {
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
};
