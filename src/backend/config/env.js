import "dotenv/config";
import { z } from "zod";

/* "7d" | "15m" | "3600s" → ms  (null if unparseable) */
export const parseDuration = (value) => {
  const match = /^(\d+)\s*(ms|s|m|h|d)$/.exec(String(value).trim());
  if (!match) return null;
  const units = { ms: 1, s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return Number(match[1]) * units[match[2]];
};

/* متغيّر اختياري: القيمة الفارغة تُعامل كغير مضبوطة أصلاً */
const optionalEnv = (label) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().min(1, label).optional(),
  );

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),

  DATABASE_URL: z.string().min(1, "DATABASE_URL مطلوب"),

  JWT_SECRET: z.string().min(1, "JWT_SECRET مطلوب"),
  JWT_EXPIRES_IN: z
    .string()
    .default("7d")
    .refine((v) => parseDuration(v) !== null, "JWT_EXPIRES_IN غير صالح، مثال: 7d أو 15m"),
  JWT_ISSUER: z.string().default("luxora-learn"),
  JWT_AUDIENCE: z.string().default("luxora-learn-web"),

  CLIENT_URL: z
    .string()
    .url("CLIENT_URL يجب أن يكون رابطاً كاملاً")
    .default("http://localhost:5173"),
  API_URL: z
    .string()
    .url("API_URL يجب أن يكون رابطاً كاملاً")
    .default("http://localhost:5000"),
  // مصادر مسموحة لـ CORS، مفصولة بفواصل
  FRONTEND_URLS: z.string().default("http://localhost:5173"),

  EMAIL_USER: z.string().min(1, "EMAIL_USER مطلوب لإرسال رسائل التفعيل"),
  EMAIL_PASS: z.string().min(1, "EMAIL_PASS مطلوب لإرسال رسائل التفعيل"),

  COOKIE_NAME: z.string().default("token"),
  COOKIE_DOMAIN: z.string().optional(),
  // true only when the frontend and the API are on different registrable domains
  CROSS_SITE_COOKIES: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),

  // إعدادات تخزين الفيديو عبر بروتوكول S3 المتوافق في Supabase Storage.
  // اختيارية عمداً حتى لا يتوقف إقلاع الخادم قبل ضبطها،
  // وlib/storage.js يرمي خطأً واضحاً إن استُخدم التخزين وهي ناقصة.
  SUPABASE_S3_ENDPOINT: optionalEnv("SUPABASE_S3_ENDPOINT غير صالح").refine(
    (v) => v === undefined || z.string().url().safeParse(v).success,
    "SUPABASE_S3_ENDPOINT يجب أن يكون رابطاً كاملاً",
  ),
  SUPABASE_S3_REGION: optionalEnv("SUPABASE_S3_REGION غير صالح"),
  SUPABASE_S3_ACCESS_KEY_ID: optionalEnv("SUPABASE_S3_ACCESS_KEY_ID غير صالح"),
  SUPABASE_S3_SECRET_ACCESS_KEY: optionalEnv("SUPABASE_S3_SECRET_ACCESS_KEY غير صالح"),
  SUPABASE_STORAGE_BUCKET: optionalEnv("SUPABASE_STORAGE_BUCKET غير صالح"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ إعدادات البيئة غير صالحة، تم إيقاف التشغيل:");
  for (const issue of parsed.error.issues) {
    console.error(`   - ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1); // fail at boot, never per-request
}

export const env = parsed.data;

export const JWT_COOKIE_MAX_AGE_MS = parseDuration(env.JWT_EXPIRES_IN);
export const IS_PROD = env.NODE_ENV === "production";