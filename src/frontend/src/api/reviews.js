// src/api/reviews.js
import api from "./axios";

// جلب تقييمات كورس معين
export const getCourseReviews = (courseId) =>
  api.get(`/courses/${courseId}/reviews`);

// إضافة تقييم جديد
export const submitReview = (courseId, data) =>
  api.post(`/courses/${courseId}/reviews`, data);

// تعديل تقييم
export const updateReview = (courseId, reviewId, data) =>
  api.put(`/courses/${courseId}/reviews/${reviewId}`, data);

// حذف تقييم
export const deleteReview = (courseId, reviewId) =>
  api.delete(`/courses/${courseId}/reviews/${reviewId}`);

export const getAllReviews = () => api.get("/reviews");