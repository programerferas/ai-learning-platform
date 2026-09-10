import * as authService from "./auth.service.js";
import {AppError} from "../../utils/appError.js";
import { env } from "../../config/env.js";
import {
  AUTH_COOKIE,
  authCookieOptions,
  clearAuthCookieOptions,
} from "../../config/cookie.js";

/* --------------------------------- REGISTER -------------------------------- */
export const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

/* ------------------------------- VERIFY EMAIL ------------------------------ */
/**
 * يُفتح من رابط البريد مباشرة، لذلك يردّ بإعادة توجيه لا بـ JSON.
 * كل النهايات قابلة للتعافي: لا نترك المستخدم أمام خطأ مسدود.
 */
export const verifyEmail = async (req, res, next) => {
  // يمنع تسريب التوكن عبر ترويسة Referer إلى أي مورد خارجي في صفحة الوجهة
  res.setHeader("Referrer-Policy", "no-referrer");

  try {
    const { token } = await authService.verifyEmail(req.query.token);
    res.cookie(AUTH_COOKIE, token, authCookieOptions());
    // الوجهة من متغيّر بيئة لا من الاستعلام — لا مجال لإعادة توجيه مفتوحة
    return res.redirect(`${env.CLIENT_URL}/verify-success`);
  } catch (err) {
    if (err instanceof AppError) {
      const reason =
        err.statusCode === 410 ? "expired"
        : err.statusCode === 409 ? "already"
        : "invalid";
      return res.redirect(`${env.CLIENT_URL}/verify-failed?reason=${reason}`);
    }
    return next(err); // أخطاء غير متوقعة تذهب للمعالج المركزي
  }
};

/* --------------------------- RESEND VERIFICATION --------------------------- */
export const resendVerification = async (req, res, next) => {
  try {
    const result = await authService.resendVerification(req.body.email);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

/* ---------------------------------- LOGIN ---------------------------------- */
export const login = async (req, res, next) => {
  try {
    const { user, token } = await authService.login(req.body);
    res.cookie(AUTH_COOKIE, token, authCookieOptions());
    res.status(200).json({ user, token });
  } catch (err) {
    next(err);
  }
};

/* ------------------------------ UPDATE PROFILE ----------------------------- */
export const updateProfile = async (req, res, next) => {
  try {
    const result = await authService.updateProfile(req.user.id, req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

/* ------------------------------ CHANGE PASSWORD ---------------------------- */
export const changePassword = async (req, res, next) => {
  try {
    const result = await authService.changePassword(req.user.id, req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

/* ------------------------------ FORGOT PASSWORD ---------------------------- */
export const forgotPassword = async (req, res, next) => {
  try {
    const result = await authService.forgotPassword(req.body.email);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

/* ------------------------------ RESET PASSWORD ----------------------------- */
export const resetPassword = async (req, res, next) => {
  try {
    const result = await authService.resetPassword(
      req.params.token,
      req.body.password
    );
    // كلمة المرور تغيّرت: أي جلسة قائمة في هذا المتصفح يجب أن تنتهي
    res.clearCookie(AUTH_COOKIE, clearAuthCookieOptions());
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

/* ---------------------------------- LOGOUT --------------------------------- */
export const logout = async (req, res) => {
  // الخصائص يجب أن تطابق خصائص الإنشاء وإلا لن يحذف المتصفح الكوكي
  res.clearCookie(AUTH_COOKIE, clearAuthCookieOptions());
  res.status(200).json({ message: "تم تسجيل الخروج" });
};

/* ----------------------------------- ME ------------------------------------ */
// req.user يأتي من protect وهو مقروء من قاعدة البيانات، أي محدَّث دائماً
export const getMe = async (req, res) => {
  res.status(200).json({ user: req.user });
};