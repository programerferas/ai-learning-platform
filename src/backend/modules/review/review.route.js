import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { allowRoles } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { createReviewSchema, updateReviewSchema } from "../../schemas/review.schema.js";
import {
  createReviewController,
  getReviewsByCourseController,
  updateReviewController,
  deleteReviewController,
  getAllReviewsController,
} from "./review.controller.js";

const router = Router();

router.post(
  "/courses/:courseId/reviews",
  authMiddleware,
  validate(createReviewSchema),
  createReviewController,
);
router.get("/courses/:courseId/reviews", getReviewsByCourseController);
router.put(
  "/courses/:courseId/reviews/:reviewId",
  authMiddleware,
  validate(updateReviewSchema),
  updateReviewController,
);
router.delete(
  "/courses/:courseId/reviews/:reviewId",
  authMiddleware,
  deleteReviewController,
);

// قائمة لوحة التحكم: تُعيد بريد كل مقيّم، لذلك هي للأدمن فقط
router.get("/", authMiddleware, allowRoles("ADMIN"), getAllReviewsController);

/**
 * @swagger
 * /courses/{courseId}/reviews:
 *   post:
 *     summary: Create a review for a course
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rating]
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review created
 *       400:
 *         description: Not enrolled or already reviewed
 */

/**
 * @swagger
 * /courses/{courseId}/reviews:
 *   get:
 *     summary: Get all reviews for a course
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of reviews
 */

/**
 * @swagger
 * /courses/{courseId}/reviews/{reviewId}:
 *   put:
 *     summary: Update a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review updated
 */

/**
 * @swagger
 * /courses/{courseId}/reviews/{reviewId}:
 *   delete:
 *     summary: Delete a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Review deleted
 */

export default router;
