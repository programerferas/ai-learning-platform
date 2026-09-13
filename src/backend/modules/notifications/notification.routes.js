import express from "express";
import rateLimit from "express-rate-limit";
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

// نموذج التواصل عام بلا تسجيل دخول، فهو الهدف الأسهل للسبام:
// حد صارم لكل IP بالإضافة إلى الحد العام في app.js
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // ساعة
  max: 5,
  message: { message: "لقد أرسلت عدداً كبيراً من الرسائل. يرجى المحاولة لاحقاً" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public - student contact form
router.post(
  "/",
  contactLimiter,
  validate(createNotificationSchema),
  createNotificationController,
);

// Admin only
router.get("/", authMiddleware, allowRoles("ADMIN"), getAllNotificationsController);
router.patch("/:id/read", authMiddleware, allowRoles("ADMIN"), markNotificationAsReadController);
router.delete("/:id", authMiddleware, allowRoles("ADMIN"), deleteNotificationController);

export default router;