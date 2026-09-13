import prisma from "../../lib/prisma.js";
import { AppError } from "../../utils/appError.js";
import slugify from "slugify";
import {
  withViewableThumbnail,
  withViewableThumbnails,
} from "../course/course.service.js";

// withViewableThumbnail لا يعتمد على شكل الكورس — يكفي وجود thumbnailKey —
// لذا نعيد استعماله للتصنيفات حتى يبقى منطق الصورة واحداً في المكانين.

export const createCategory = async (data) => {
  const { name, description, thumbnail, thumbnailKey } = data;
  if (!name) throw new AppError("اسم الفئة مطلوب", 400);

  const existing = await prisma.category.findUnique({ where: { name } });
  if (existing) throw new AppError("الفئة موجودة بالفعل", 409);

  const slug = slugify(name, { lower: true, strict: true });

  const existingSlug = await prisma.category.findUnique({ where: { slug } });
  if (existingSlug) throw new AppError("هذا التصنيف موجود بالفعل", 409);

  const category = await prisma.category.create({
    data: { name, slug, description, thumbnail, thumbnailKey },
  });
  return await withViewableThumbnail(category);
};

export const getAllCategories = async () => {
  const categories = await prisma.category.findMany({
    orderBy: { createdAt: "desc" },
  });
  return await withViewableThumbnails(categories);
};

export const getCategoryById = async (id) => {
  if (!id) throw new AppError("معرف الفئة مطلوب", 400);

  const category = await prisma.category.findUnique({
    where: { id },
    include: { courses: true },
  });

  if (!category) throw new AppError("الفئة غير موجودة", 404);
  return {
    ...(await withViewableThumbnail(category)),
    courses: await withViewableThumbnails(category.courses),
  };
};

export const updateCategory = async (id, data) => {
  if (!id) throw new AppError("معرف الفئة مطلوب", 400);

  const category = await prisma.category.findUnique({
    where: { id },
  });
  if (!category) throw new AppError("الفئة غير موجودة", 404);

  const { name, description, thumbnail, thumbnailKey } = data;
  const updatedSlug = name
    ? slugify(name, { lower: true, strict: true })
    : category.slug;

  if (name) {
    const slugExists = await prisma.category.findUnique({
      where: { slug: updatedSlug },
    });
    if (slugExists && slugExists.id !== id) {
      throw new AppError("اسم الفئة مستخدم بالفعل", 409);
    }
  }

  const updated = await prisma.category.update({
    where: { id },
    data: {
      name: name || category.name,
      slug: updatedSlug,
      description: description !== undefined ? description : category.description,
      thumbnail: thumbnail || category.thumbnail,
      thumbnailKey: thumbnailKey || category.thumbnailKey,
    },
  });
  return await withViewableThumbnail(updated);
};

export const deleteCategory = async (id) => {
  if (!id) throw new AppError("معرف الفئة مطلوب", 400);

  const category = await prisma.category.findUnique({
    where: { id },
  });
  if (!category) throw new AppError("الفئة غير موجودة", 404);

  await prisma.category.delete({ where: { id } });
  return { success: true, message: "الفئة حذفت بنجاح" };
};