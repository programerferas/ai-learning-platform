import * as notificationService from "./notification.service.js";

export const createNotificationController = async (req, res, next) => {
  try {
    const result = await notificationService.createNotification(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const getAllNotificationsController = async (req, res, next) => {
  try {
    const result = await notificationService.getAllNotifications();
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const markNotificationAsReadController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await notificationService.markNotificationAsRead(id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const deleteNotificationController = async (req, res, next) => {
  try {
    const { id } = req.params;
    await notificationService.deleteNotification(id);
    res.status(200).json({ message: "Notification deleted" });
  } catch (err) {
    next(err);
  }
};