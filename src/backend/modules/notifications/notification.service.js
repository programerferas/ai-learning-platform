import prisma from "../../lib/prisma.js";
import { AppError } from "../../utils/appError.js";

// نفس البريد لا يستطيع إرسال رسالة جديدة قبل مرور هذه المدة
const SAME_EMAIL_COOLDOWN_MS = 10 * 60 * 1000;
// الرسالة المطابقة حرفياً تُهمل إن أُرسلت خلال هذه المدة
const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;
// أكثر من هذا العدد من الروابط في رسالة تواصل شبه مؤكد أنه سبام
const MAX_LINKS = 2;

const countLinks = (text) => (text.match(/https?:\/\/|www\./gi) || []).length;

export const createNotification = async (data) => {
  const { website, ...payload } = data;

  // Honeypot ممتلئ → بوت. نُعيد نجاحاً وهمياً دون حفظ حتى لا يتعلم البوت أنه اكتُشف.
  if (website) return { id: null, ...payload, isRead: false, createdAt: new Date() };

  if (countLinks(payload.message) > MAX_LINKS) {
    throw new AppError("الرسالة تحتوي على روابط كثيرة", 400);
  }

  const now = Date.now();

  const recent = await prisma.notification.findFirst({
    where: {
      email: payload.email,
      createdAt: { gte: new Date(now - DUPLICATE_WINDOW_MS) },
    },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true, message: true },
  });

  if (recent) {
    // رسالة مطابقة خلال 24 ساعة → لا نكرّرها، ونُعيد نجاحاً حتى لا يعيد المستخدم المحاولة
    if (recent.message === payload.message) {
      return { id: null, ...payload, isRead: false, createdAt: recent.createdAt };
    }

    const elapsed = now - recent.createdAt.getTime();
    if (elapsed < SAME_EMAIL_COOLDOWN_MS) {
      const waitMinutes = Math.ceil((SAME_EMAIL_COOLDOWN_MS - elapsed) / 60000);
      throw new AppError(
        `لقد أرسلت رسالة مؤخراً. يرجى المحاولة بعد ${waitMinutes} دقيقة`,
        429,
      );
    }
  }

  return await prisma.notification.create({ data: payload });
};

export const getAllNotifications = async () => {
  return await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
  });
};

export const markNotificationAsRead = async (id) => {
  return await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });
};

export const deleteNotification = async (id) => {
  return await prisma.notification.delete({ where: { id } });
};
