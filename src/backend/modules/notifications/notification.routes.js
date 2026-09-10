import express from "express";
import { validate } from "../../middlewares/validate.middleware.js"; 
import { createNotificationSchema } from "../../schemas/notification.validation.js"; 
import { authMiddleware } from "../../middlewares/auth.middleware.js"; 
import {
  createNotificationController,
  getAllNotificationsController,
  markNotificationAsReadController,
  deleteNotificationController,
} from "./notification.controller.js";
import { allowRoles } from "../../middlewares/role.middleware.js"; 

const router = express.Router();

// Public - student contact form
router.post("/", validate(createNotificationSchema), createNotificationController);

// Admin only
router.get("/", authMiddleware, allowRoles("ADMIN"), getAllNotificationsController);
router.patch("/:id/read", authMiddleware, allowRoles("ADMIN"), markNotificationAsReadController);
router.delete("/:id", authMiddleware, allowRoles("ADMIN"), deleteNotificationController);

export default router;