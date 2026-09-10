// modules/ai/ai.routes.js
import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { chatSchema, quizSchema } from "../../schemas/ai.schema.js";
import {
  chatController,
  summaryController,
  quizController,
  courseQuizController,
  recommendationsController,
} from "./ai.controller.js";

export const router = Router();

// All AI routes require authentication
router.use(authMiddleware);

// POST /api/ai/chat
router.post("/chat", validate(chatSchema), chatController);

// POST /api/ai/summary/:lessonId
router.post("/summary/:lessonId", summaryController);

//post /api/ai/course-quiz/:courseId
router.post("/course-quiz/:courseId", courseQuizController);
// POST /api/ai/quiz/:lessonId
router.post("/quiz/:lessonId", validate(quizSchema), quizController);

// GET /api/ai/recommendations
router.get("/recommendations", recommendationsController);

/**
 * @swagger
 * /ai/chat:
 *   post:
 *     summary: Chat with AI assistant
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: AI response
 */

/**
 * @swagger
 * /ai/summary/{lessonId}:
 *   post:
 *     summary: Generate a summary for a lesson
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lesson summary generated
 */

/**
 * @swagger
 * /ai/quiz/{lessonId}:
 *   post:
 *     summary: Generate a quiz for a lesson
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               count:
 *                 type: integer
 *                 description: Number of questions to generate
 *     responses:
 *       200:
 *         description: Quiz generated
 */

/**
 * @swagger
 * /ai/recommendations:
 *   get:
 *     summary: Get AI course recommendations
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of recommended courses
 */

export default router;
