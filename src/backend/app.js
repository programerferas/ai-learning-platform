import { env, IS_PROD } from "./config/env.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import hpp from "hpp";
import rateLimit from "express-rate-limit";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import reviewRouter from "./modules/review/review.route.js";
import authRoutes from "./modules/auth/auth.routes.js";
import categoryRoutes from "./modules/category/category.routes.js";
import courseRoutes from "./modules/course/course.routes.js";
import lessonRoutes from "./modules/lesson/lesson.routes.js";
import enrollmentRoutes from "./modules/enrollment/enrollment.routes.js";
import aiRoutes from "./modules/ai/ai.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js"
import userRoutes from "./modules/user/user.routes.js"
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";
import cookieParser from 'cookie-parser';
import notificationRoutes from "./modules/notifications/notification.routes.js";
import uploadRoutes from "./modules/upload/upload.routes.js";

const app = express();

// ── SECURITY HEADERS ──────────────────────────────
app.use(helmet());
app.use(cookieParser())
app.set('trust proxy', 1);

// ── CORS ──────────────────────────────────────────
const allowedOrigins = env.FRONTEND_URLS.split(",").map((url) => url.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (mobile apps, curl, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// ── BODY PARSER WITH SIZE LIMIT ───────────────────
// محتوى الدرس نص عربي (~3 بايت/حرف) ورسائل المحادثة حتى 2000 حرف — 10kb كان يقطعها.
// الملفات لا تمرّ من هنا أصلاً (روابط رفع موقّعة)، فـ 1mb سقف آمن للـ JSON.
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// ── PREVENT HTTP PARAMETER POLLUTION ─────────────
app.use(hpp());

// ── RATE LIMITERS ─────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { message: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  skip: (req) => req.path === '/me', // skip /api/auth/me
  message: { message: "Too many auth attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const meLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { message: "Too many requests" },
  standardHeaders: true,
  legacyHeaders: false,
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { message: "Too many AI requests, please slow down" },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);

// ── HEALTH CHECK (for load balancers / uptime monitors) ──
app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));

// ── SWAGGER (development only) ────────────────────
if (!IS_PROD) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// ── ROUTES ────────────────────────────────────────
app.use("/api/auth/me", meLimiter);   
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/ai", aiLimiter, aiRoutes);
app.use("/api/dashboard",dashboardRoutes);
app.use("/api/users",userRoutes);
app.use("/api/reviews", reviewRouter);
app.use("/api/notifications", notificationRoutes);
app.use("/api/uploads", uploadRoutes);

// ── 404 (JSON, not Express's HTML page) ───────────
app.use((req, res) => {
  res.status(404).json({ message: "المسار غير موجود" });
});

// ── ERROR HANDLER ─────────────────────────────────
app.use(errorMiddleware);

export default app;
