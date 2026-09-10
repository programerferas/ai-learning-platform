import prisma from "../lib/prisma.js";
import { AppError } from "../utils/appError.js";
import { verifyAuthToken } from "../utils/jwt.js";
import { AUTH_COOKIE, clearAuthCookieOptions } from "../config/cookie.js";

export const authMiddleware = async (req, res, next) => {
  try {
    // 1. الكوكي أولاً (المسار الطبيعي للمتصفح)
    let token = req.cookies?.[AUTH_COOKIE];

    // 2. ترويسة Authorization كبديل (Postman و Swagger)
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.slice(7).trim();
      }
    }

    if (!token) return next(new AppError("لا يوجد رمز مصادقة", 401));

    // verifyAuthToken يرمي ولا يعيد قيمة فارغة أبداً — لا حاجة لفحص !decoded
    let payload;
    try {
      payload = verifyAuthToken(token);
    } catch (err) {
      if (err.name === "TokenExpiredError")
        return next(
          new AppError(
            "رمز المصادقة منتهي الصلاحية، من فضلك سجل الدخول مرة أخرى",
            401
          )
        );
      return next(new AppError("رمز غير صالح", 401));
    }

    // الدور والحالة من قاعدة البيانات لا من التوكن:
    // الترقية والحظر وإلغاء التفعيل تسري فوراً بدل انتظار انتهاء صلاحية الرمز
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, name: true, email: true, role: true, isVerified: true },
    });

    if (!user) {
      // حساب محذوف ورمزه ما زال صالحاً — ننظّف الكوكي حتى لا تتكرر المحاولة
      res.clearCookie(AUTH_COOKIE, clearAuthCookieOptions());
      return next(new AppError("فشل المصادقة", 401));
    }

    if (!user.isVerified)
      return next(new AppError("يرجى تفعيل حسابك أولاً", 403));

    req.user = user;
    next();
  } catch (err) {
    next(err); // أخطاء غير متوقعة (قاعدة البيانات مثلاً) تذهب للمعالج المركزي
  }
};

// اسم بديل حتى تعمل الملفات التي تستورد protect
export const protect = authMiddleware;