// api/notifications.js
import api from "./axios"; 

export const sendContactForm = (data) => {
  return api.post("/notifications", data);
};

export const getAllNotifications = () => {
  return api.get("/notifications");
};

export const markNotificationAsRead = (id) => {
  return api.patch(`/notifications/${id}/read`);
};

export const deleteNotification = (id) => {
  return api.delete(`/notifications/${id}`);
};