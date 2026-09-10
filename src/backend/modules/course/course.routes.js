import express from "express";
import * as courseController from "./course.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { allowRoles } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  upload,
  uploadToSupabase,
} from "../../middlewares/upload.middleware.js";
import {
  createCourseSchema,
  updateCourseSchema,
} from "../../schemas/course.schema.js";

const router = express.Router();

// PUBLIC
router.get("/", courseController.getAllCourses);
router.get("/:id", courseController.getCourseById);

// INSTRUCTOR & ADMIN
router.post(
  "/",
  authMiddleware,
  allowRoles("INSTRUCTOR", "ADMIN"),
  upload.single("thumbnail"),
  uploadToSupabase,
  validate(createCourseSchema),
  courseController.createCourse,
);
router.put(
  "/:id",
  authMiddleware,
  allowRoles("INSTRUCTOR", "ADMIN"),
  upload.single("thumbnail"),
  uploadToSupabase,
  validate(updateCourseSchema),
  courseController.updateCourse,
);
router.delete(
  "/:id",
  authMiddleware,
  allowRoles("INSTRUCTOR", "ADMIN"),
  courseController.deleteCourse,
);
router.patch(
  "/:id/publish",
  authMiddleware,
  allowRoles("INSTRUCTOR", "ADMIN"),
  courseController.togglePublish,
);
router.get(
  "/:courseId/progress",
  authMiddleware,
  courseController.getCourseProgressController,
);

/**
 * @swagger
 * /courses:
 *   get:
 *     summary: Get all courses
 *     tags: [Courses]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of courses
 */

/**
 * @swagger
 * /courses/{id}:
 *   get:
 *     summary: Get course by ID
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course found
 *       404:
 *         description: Course not found
 */

/**
 * @swagger
 * /courses:
 *   post:
 *     summary: Create a new course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, description, price, level, categoryId]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               level:
 *                 type: string
 *                 enum: [BEGINNER, INTERMEDIATE, ADVANCED]
 *               categoryId:
 *                 type: string
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Course created
 *       400:
 *         description: Validation error
 */

/**
 * @swagger
 * /courses/{id}:
 *   put:
 *     summary: Update a course
 *     tags: [Courses]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Course updated
 */

/**
 * @swagger
 * /courses/{id}:
 *   delete:
 *     summary: Delete a course
 *     tags: [Courses]
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
 *         description: Course deleted
 */

/**
 * @swagger
 * /courses/{id}/publish:
 *   patch:
 *     summary: Publish or unpublish a course
 *     tags: [Courses]
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
 *         description: Course publish status toggled
 */

export default router;
