import express from "express";
import * as lessonController from "./lesson.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { allowRoles } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createLessonSchema,
  updateLessonSchema,
} from "../../schemas/lesson.schema.js";
import { completeLessonController } from "./lesson.controller.js";

const router = express.Router();

router.get("/courses/:courseId", lessonController.getLessonsByCourse);
// lesson.routes.js
router.get("/", lessonController.getAllLessons);
router.get("/:id", lessonController.getLessonById);


router.post(
  "/",
  authMiddleware,
  allowRoles("INSTRUCTOR", "ADMIN"),
  validate(createLessonSchema),
  lessonController.createLesson,
);

router.put(
  "/:id",
  authMiddleware,
  allowRoles("INSTRUCTOR", "ADMIN"),
  validate(updateLessonSchema),
  lessonController.updateLesson,
);
router.delete(
  "/:id",
  authMiddleware,
  allowRoles("INSTRUCTOR", "ADMIN"),
  lessonController.deleteLesson,
);

router.post("/complete-lesson", authMiddleware, completeLessonController);

/**
 * @swagger
 * /lessons:
 *   post:
 *     summary: Create a lesson
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, courseId, order]
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               videoUrl:
 *                 type: string
 *               videoKey:
 *                 type: string
 *                 description: Storage key returned by POST /uploads/presign
 *                 example: lessons/3f2a1b90-5c4d-4e8f-9a1b-2c3d4e5f6a7b.mp4
 *               courseId:
 *                 type: string
 *               order:
 *                 type: string
 *     responses:
 *       201:
 *         description: Lesson created
 */

/**
 * @swagger
 * /lessons/course/{id}:
 *   get:
 *     summary: Get lessons by course
 *     tags: [Lessons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of lessons
 */

/**
 * @swagger
 * /lessons/{id}:
 *   get:
 *     summary: Get lesson by ID
 *     tags: [Lessons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lesson found
 */

/**
 * @swagger
 * /lessons/{id}:
 *   put:
 *     summary: Update a lesson
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               videoUrl:
 *                 type: string
 *               videoKey:
 *                 type: string
 *                 description: Storage key returned by POST /uploads/presign
 *                 example: lessons/3f2a1b90-5c4d-4e8f-9a1b-2c3d4e5f6a7b.mp4
 *               order:
 *                 type: string
 *     responses:
 *       200:
 *         description: Lesson updated
 */

/**
 * @swagger
 * /lessons/{id}:
 *   delete:
 *     summary: Delete a lesson
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lesson deleted
 */

export default router;
