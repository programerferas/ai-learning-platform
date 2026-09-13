import prisma from "../../lib/prisma.js";
import { AppError } from "../../utils/appError.js";

// الحقول التي تُعاد للأدمن — بلا هاش كلمة المرور ولا رموز التفعيل/إعادة التعيين
const ADMIN_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  phoneNumber: true,
  role: true,
  createdAt: true,
  isVerified: true,
};

export const getAllUsersService = async () => {
  return await prisma.user.findMany({
    select: ADMIN_USER_SELECT,
    orderBy: { createdAt: "desc" },
  });
};

export const getUserByIdService = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: ADMIN_USER_SELECT,
  });
  if (!user) throw new AppError("المستخدم غير موجود", 404);
  return user;
};

/**
 * data مُتحقَّق منه مسبقاً عبر adminUpdateUserSchema (قائمة بيضاء).
 * الأدمن لا يستطيع تغيير دوره هو: تنزيل نفسه يقفل لوحة التحكم فوراً.
 */
export const updateUserService = async (id, data, actor) => {
  if (id === actor.id && data.role && data.role !== actor.role) {
    throw new AppError("لا يمكنك تغيير دور حسابك الحالي", 400);
  }

  return await prisma.user.update({
    where: { id },
    data,
    select: ADMIN_USER_SELECT,
  });
};

export const deleteUserService = async (id, actor) => {
  if (id === actor.id) {
    throw new AppError("لا يمكنك حذف حسابك الحالي", 400);
  }

  await prisma.user.delete({ where: { id } });
};
