// services/lessonService.js
// Connects the frontend to the Luxora Learn backend
// Usage: import { getLessonById, ... } from "@/services/lessonService"

import axios from "axios";
import api from "./axios";


/* ─────────────────────────────────────────
   LESSONS
───────────────────────────────────────── */

/**
 * Get a single lesson by ID
 * GET /lessons/:lessonId
 * Returns: { lesson: { id, title, description, videoUrl, duration, order, courseId, ... } }
 */
export const getLessonById = (lessonId) =>
  api.get(`/lessons/${lessonId}`).then((r) => r.data);


/**
 * Get all lessons (admin table view)
 * GET /lessons
 * Returns: [...] or { lessons: [...] } depending on your backend response
 */
export const getAllLessons = () =>
  api.get(`/lessons`).then((r) => r.data);

/**
 * Get all lessons for a course
 * GET /lessons/courses/:courseId
 * Returns: { lessons: [...] }
 */
export const getLessonsByCourse = (courseId) =>
  api.get(`/lessons/courses/${courseId}`).then((r) => r.data);

/**
 * Mark a lesson as completed
 * POST /lessons/complete-lesson
 * Body: { courseId, lessonId }
 * Returns: { message, progress: { completedLessons, totalLessons, percent } }
 */
export const completeLesson = (data) =>
  api.post("/lessons/complete-lesson", data).then((r) => r.data);

/**
 * Get student progress for a course
 * GET /courses/:courseId/progress
 * Returns: { completedLessons, totalLessons, percent, completedIds: [...] }
 */
export const getCourseProgress = (courseId) =>
  api.get(`/courses/${courseId}/progress`).then((r) => r.data);

// Create a new lesson
export const createLesson = (lessonData) =>
  api.post('/lessons', lessonData).then((r) => r.data);

// Update an existing lesson
export const updateLesson = (id, lessonData) =>
  api.put(`/lessons/${id}`, lessonData).then((r) => r.data);

// Delete a lesson
export const deleteLesson = (id) =>
  api.delete(`/lessons/${id}`).then((r) => r.data);

/**
 * Upload a lesson video directly to storage (bytes never pass through the API).
 * 1. POST /uploads/presign { filename, contentType, size } -> { uploadUrl, key }
 * 2. PUT the file to uploadUrl
 * Returns the storage key to send as `videoKey` when creating/updating a lesson.
 * onProgress(percent) is optional.
 */
export const uploadLessonVideo = async (file, onProgress) => {
  const { uploadUrl, key } = await api
    .post("/uploads/presign", {
      filename: file.name,
      contentType: file.type,
      size: file.size,
    })
    .then((r) => r.data);

  // Plain axios: the presigned URL is on the storage host, not our API,
  // so no baseURL / cookies must be attached.
  await axios.put(uploadUrl, file, {
    headers: { "Content-Type": file.type },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
    },
  });

  return key;
};

/**
 * Get AI-generated quiz for a lesson
 * POST /ai/quiz/:lessonId
 * Body: { count } (optional number of questions)
 */
export const getLessonQuiz = (lessonId, count) =>
  api.post(`/ai/quiz/${lessonId}`, count ? { count } : {}).then((r) => r.data);

/* ─────────────────────────────────────────
   AI ASSISTANT (lesson-scoped)
───────────────────────────────────────── */

/**
 * Send a message to the AI assistant (scoped to current lesson)
 * POST /ai/chat
 * Body: { message, lessonId, courseId }
 * Returns: { reply: "..." }
 */
export const askAI = (message, lessonId, courseId) =>
  api
    .post("/ai/chat", { message, lessonId, courseId })
    .then((r) => r.data);

/**
 * Get AI-generated summary for a lesson
 * POST /ai/summary/:lessonId
 * Returns: { summary: "..." }
 */
export const getLessonSummary = (lessonId) =>
  api.post(`/ai/summary/${lessonId}`).then((r) => r.data);



/* ─────────────────────────────────────────
   ERROR HANDLING HELPER
───────────────────────────────────────── */

/**
 * Extracts a readable error message from an axios error
 * Usage: catch(e) { const msg = getErrorMessage(e); }
 */
export const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || "حدث خطأ غير متوقع";