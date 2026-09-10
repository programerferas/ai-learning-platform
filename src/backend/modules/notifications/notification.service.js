import prisma from "../../lib/prisma.js";

export const createNotification = async (data) => {
  return await prisma.notification.create({ data });
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