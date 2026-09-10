import prisma from "../../lib/prisma.js";
import slugify from "slugify";

export const createCategory = async (data) => {
  const { name, description, thumbnail } = data;
  if (!name) throw new Error("اسم الفئة مطلوب");

  const existing = await prisma.category.findUnique({ where: { name } });
  if (existing) throw new Error("الفئة موجودة بالفعل");

  const slug = slugify(name, { lower: true, strict: true });

  const existingSlug = await prisma.category.findUnique({ where: { slug } });
  if (existingSlug) throw new Error("هذا التصنيف موجود بالفعل");

  return await prisma.category.create({
    data: { name, slug, description, thumbnail },
  });
};

export const getAllCategories = async () => {
  return await prisma.category.findMany({
    orderBy: { createdAt: "desc" },
  });
};

export const getCategoryById = async (id) => {
  if (!id) throw new Error("معرف الفئة مطلوب");

  const category = await prisma.category.findUnique({
    where: { id },
    include: { courses: true },
  });

  if (!category) throw new Error("الفئة غير موجودة");
  return category;
};

export const updateCategory = async (id, data) => {
  if (!id) throw new Error("معرف الفئة مطلوب");

  const category = await prisma.category.findUnique({
    where: { id },
  });
  if (!category) throw new Error("الفئة غير موجودة");

  const { name, description, thumbnail } = data;
  const updatedSlug = name
    ? slugify(name, { lower: true, strict: true })
    : category.slug;

  if (name) {
    const slugExists = await prisma.category.findUnique({
      where: { slug: updatedSlug },
    });
    if (slugExists && slugExists.id !== id) {
      throw new Error("اسم الفئة مستخدم بالفعل");
    }
  }

  return await prisma.category.update({
    where: { id },
    data: {
      name: name || category.name,
      slug: updatedSlug,
      description: description !== undefined ? description : category.description,
      thumbnail: thumbnail || category.thumbnail,
    },
  });
};

export const deleteCategory = async (id) => {
  if (!id) throw new Error("معرف الفئة مطلوب");

  const category = await prisma.category.findUnique({
    where: { id },
  });
  if (!category) throw new Error("الفئة غير موجودة");

  await prisma.category.delete({ where: { id } });
  return { success: true, message: "الفئة حذفت بنجاح" };
};