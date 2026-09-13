import { randomUUID } from "crypto";
import path from "path";
import { createPresignedUploadUrl } from "../../lib/storage.js";
import { AppError } from "../../utils/appError.js";

const UPLOAD_URL_TTL_SECONDS = 15 * 60; // صلاحية رابط الرفع الموقّع
const LESSON_VIDEO_PREFIX = "lessons";
const COURSE_IMAGE_PREFIX = "courses";
const CATEGORY_IMAGE_PREFIX = "categories";

/** الامتداد من اسم الملف، بلا نقطة ومحصور بمحارف آمنة للمفتاح */
const getExtension = (filename) => {
  const ext = path.extname(filename).slice(1).toLowerCase();
  return /^[a-z0-9]{1,10}$/.test(ext) ? ext : null;
};

/**
 * ينشئ مفتاحاً جديداً تحت البادئة المعطاة ورابط PUT موقّعاً يرفع المتصفح
 * الملف إليه مباشرة، فلا تمر بايتات الملف عبر خادم Express إطلاقاً.
 * اسم الملف الأصلي لا يدخل المفتاح — المفتاح uuid حتى لا تتعارض الأسماء
 * ولا تتسرب أسماء ملفات المستخدمين إلى التخزين.
 */
const createUpload = async (prefix, { filename, contentType }) => {
  const extension = getExtension(filename);
  if (!extension) throw new AppError("امتداد الملف غير صالح", 400);

  const key = `${prefix}/${randomUUID()}.${extension}`;

  const uploadUrl = await createPresignedUploadUrl({
    key,
    contentType,
    expiresIn: UPLOAD_URL_TTL_SECONDS,
  });

  return { uploadUrl, key };
};

export const createLessonVideoUpload = (data) =>
  createUpload(LESSON_VIDEO_PREFIX, data);

export const createCourseImageUpload = (data) =>
  createUpload(COURSE_IMAGE_PREFIX, data);

export const createCategoryImageUpload = (data) =>
  createUpload(CATEGORY_IMAGE_PREFIX, data);
