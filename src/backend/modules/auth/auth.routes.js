import express from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import * as authController from "./auth.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  registerSchema,
  loginSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  changePasswordSchema,
} from "../../schemas/auth.schema.js";

const router = express.Router();

/* ------------------------------ محدّدات المعدّل ----------------------------- */
const limiter = (windowMs, max, message, keyGenerator) =>
  rateLimit({
    windowMs,
    max,
    message: { message },
    standardHeaders: true,
    legacyHeaders: false,
    ...(keyGenerator ? { keyGenerator } : {}),
  });

const HOUR = 60 * 60 * 1000;

const registerIpLimiter = limiter(
  HOUR,
  10,
  "محاولات تسجيل كثيرة من هذا العنوان، حاول لاحقاً"
);

// حدّ إضافي لكل بريد: يمنع إغراق صندوق بريد شخص واحد من عناوين مختلفة
const registerEmailLimiter = limiter(
  HOUR,
  5,
  "محاولات تسجيل كثيرة لهذا البريد، حاول لاحقاً",
  (req) =>
    String(req.body?.email || "").trim().toLowerCase() ||
    ipKeyGenerator(req.ip)
);

const loginLimiter = limiter(
  15 * 60 * 1000,
  20,
  "محاولات دخول كثيرة، حاول بعد قليل"
);

const verifyEmailLimiter = limiter(HOUR, 30, "طلبات كثيرة، حاول لاحقاً");

const resendLimiter = limiter(
  HOUR,
  5,
  "طلبات إعادة إرسال كثيرة، حاول لاحقاً",
  (req) =>
    String(req.body?.email || "").trim().toLowerCase() ||
    ipKeyGenerator(req.ip)
);

const passwordResetLimiter = limiter(
  HOUR,
  5,
  "طلبات إعادة تعيين كثيرة، حاول لاحقاً"
);

/* --------------------------------- المسارات -------------------------------- */
router.post(
  "/register",
  registerIpLimiter,
  registerEmailLimiter,
  validate(registerSchema),
  authController.register
);

// GET لأنه يُفتح من رابط البريد. لا Zod هنا: الخدمة تتحقق من التوكن،
// والمتحكم يردّ بإعادة توجيه لا بخطأ تحقق.
router.get("/verify-email", verifyEmailLimiter, authController.verifyEmail);

router.post(
  "/resend-verification",
  resendLimiter,
  validate(resendVerificationSchema),
  authController.resendVerification
);

router.post("/login", loginLimiter, validate(loginSchema), authController.login);

router.post(
  "/forgot-password",
  passwordResetLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);

router.post(
  "/reset-password/:token",
  passwordResetLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword
);

router.post("/logout", authController.logout);
router.get("/me", protect, authController.getMe);

router.put(
  "/update-profile",
  protect,
  validate(updateProfileSchema),
  authController.updateProfile
);

router.put(
  "/change-password",
  protect,
  validate(changePasswordSchema),
  authController.changePassword
);

export default router;
