import api from "./axios"; // your axios instance

// POST /api/ai/chat
export const chatWithAI = (message, sessionId = null) =>
  api.post("/ai/chat", {
    message,
    ...(sessionId && { sessionId }),
  });

// POST /api/ai/summary/:lessonId
export const getLessonSummary = (lessonId) =>
  api.post(`/ai/summary/${lessonId}`);


// POST /api/ai/quiz/:courseId
export const generateCourseQuiz = (courseId, count = 10) =>
  api.post(`/ai/course-quiz/${courseId}`, { questionCount: count });

// GET /api/ai/recommendations
export const getRecommendations = () =>
  api.get("/ai/recommendations");

