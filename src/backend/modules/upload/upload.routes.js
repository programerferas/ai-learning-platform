import express from "express";
import * as uploadController from "./upload.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { allowRoles } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { presignUploadSchema } from "../../schemas/upload.schema.js";

const router = express.Router();

router.post(
  "/presign",
  authMiddleware,
  allowRoles("ADMIN"),
  validate(presignUploadSchema),
  uploadController.presignLessonVideo,
);

/**
 * @swagger
 * /uploads/presign:
 *   post:
 *     summary: Get a presigned URL to upload a lesson video directly to storage
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [filename, contentType, size]
 *             properties:
 *               filename:
 *                 type: string
 *                 example: intro.mp4
 *               contentType:
 *                 type: string
 *                 description: Must be a video/* MIME type
 *                 example: video/mp4
 *               size:
 *                 type: integer
 *                 description: File size in bytes, max 500MB
 *                 example: 10485760
 *     responses:
 *       200:
 *         description: Presigned upload URL, valid for 15 minutes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uploadUrl:
 *                   type: string
 *                 key:
 *                   type: string
 *                   example: lessons/3f2a1b90-5c4d-4e8f-9a1b-2c3d4e5f6a7b.mp4
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Admins only
 */

export default router;
