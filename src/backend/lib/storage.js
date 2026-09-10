import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../config/env.js";
import { AppError } from "../utils/appError.js";

/**
 * وحدة التخزين الوحيدة التي تعرف مزوّد التخزين.
 * تتحدث مع Supabase Storage عبر بروتوكوله المتوافق مع S3،
 * وهي منفصلة تماماً عن lib/supabase.js الذي يبقى كما هو لما يستخدمه أصلاً.
 * تبديل المزوّد لاحقاً يتم من هنا فقط دون لمس المسارات أو المتحكمات.
 */

const REQUIRED_KEYS = [
  "SUPABASE_S3_ENDPOINT",
  "SUPABASE_S3_REGION",
  "SUPABASE_S3_ACCESS_KEY_ID",
  "SUPABASE_S3_SECRET_ACCESS_KEY",
  "SUPABASE_STORAGE_BUCKET",
];

let client = null;

/**
 * إعدادات التخزين اختيارية في config/env.js حتى لا يتوقف الخادم عن الإقلاع
 * قبل ضبطها، لذلك نتحقق منها هنا عند أول استخدام فعلي،
 * ونذكر كل الناقص دفعةً واحدة بدل مفتاح واحد في كل محاولة.
 */
const assertConfigured = () => {
  const missing = REQUIRED_KEYS.filter((key) => !env[key]);
  if (missing.length) {
    throw new AppError(`إعدادات التخزين ناقصة: ${missing.join(", ")}`, 500);
  }
};

const getClient = () => {
  if (!client) {
    client = new S3Client({
      endpoint: env.SUPABASE_S3_ENDPOINT,
      region: env.SUPABASE_S3_REGION,
      forcePathStyle: true,
      // إصدارات AWS SDK الحديثة تضيف checksum افتراضياً إلى الرابط الموقّع،
      // فيفشل الرفع من المتصفح لأن جسم الطلب لا يطابق checksum الجسم الفارغ.
      // Supabase لا يحتاجه، لذا نطلبه عند الضرورة فقط.
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
      credentials: {
        accessKeyId: env.SUPABASE_S3_ACCESS_KEY_ID,
        secretAccessKey: env.SUPABASE_S3_SECRET_ACCESS_KEY,
      },
    });
  }

  return client;
};

export const getBucket = () => env.SUPABASE_STORAGE_BUCKET;

/**
 * رابط PUT موقّع يرفع المتصفح الملف إليه مباشرة دون المرور بالخادم.
 */
export const createPresignedUploadUrl = async ({ key, contentType, expiresIn }) => {
  assertConfigured();

  const command = new PutObjectCommand({
    Bucket: getBucket(),
    Key: key,
    ContentType: contentType,
  });

  return await getSignedUrl(getClient(), command, { expiresIn });
};

/**
 * رابط GET موقّع لتشغيل ملف مخزّن بمفتاحه.
 */
export const createPresignedDownloadUrl = async ({ key, expiresIn }) => {
  assertConfigured();

  const command = new GetObjectCommand({
    Bucket: getBucket(),
    Key: key,
  });

  return await getSignedUrl(getClient(), command, { expiresIn });
};
