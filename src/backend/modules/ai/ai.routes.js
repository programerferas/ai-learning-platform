// modules/ai/ai.routes.js
import { Router } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
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

/* ------------------------- حدود الاستخدام لكل حساب ------------------------- */
// المفتاح هو معرّف المستخدم لا عنوان IP: حساب واحد لا يستطيع استهلاك
// حصة الجميع، ومستخدمو الشبكة الواحدة (جامعة/مكتب) لا يحجبون بعضهم.
// يجب أن تأتي بعد authMiddleware حتى يكون req.user موجوداً.
const perUser = (req) => req.user?.id ?? ipKeyGenerator(req.ip);

const aiLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    keyGenerator: perUser,
    message: { message },
    standardHeaders: true,
    legacyHeaders: false,
  });

// دفعة قصيرة: 15 طلباً في الدقيقة لكل حساب
const aiBurstLimiter = aiLimiter(
  60 * 1000,
  15,
  "طلبات كثيرة للمساعد الذكي، انتظر دقيقة ثم حاول مجدداً",
);

// حصة يومية: سقف التكلفة لكل حساب مهما كانت الدفعات
const aiDailyLimiter = aiLimiter(
  24 * 60 * 60 * 1000,
  200,
  "استنفدت حصتك اليومية من المساعد الذكي، حاول غداً",
);

// التوليد (اختبار كامل، توصيات) أغلى من رسالة محادثة — حصة أضيق
const aiGenerationLimiter = aiLimiter(
  60 * 60 * 1000,
  20,
  "طلبات توليد كثيرة، حاول بعد ساعة",
);

router.use(aiBurstLimiter, aiDailyLimiter);

// POST /api/ai/chat
router.post("/chat", validate(chatSchema), chatController);

// POST /api/ai/summary/:lessonId  (مخزّن مؤقتاً لكل درس)
router.post("/summary/:lessonId", summaryController);

// POST /api/ai/course-quiz/:courseId
router.post(
  "/course-quiz/:courseId",
  aiGenerationLimiter,
  validate(quizSchema),
  courseQuizController,
);

// POST /api/ai/quiz/:lessonId  (مخزّن مؤقتاً لكل درس)
router.post("/quiz/:lessonId", validate(quizSchema), quizController);

// GET /api/ai/recommendations
router.get("/recommendations", aiGenerationLimiter, recommendationsController);

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
