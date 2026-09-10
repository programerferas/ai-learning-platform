// src/api/courses.js
import api from "./axios";

export const getCourses    = (params) => api.get("/courses", { params });
export const getCourseById = (id)     => api.get(`/courses/${id}`);
export const getCategories = ()       => api.get("/categories");

// Create course
export const createCourse = (data) => api.post("/courses", data);

// Update course
export const updateCourse = (id, data) => api.put(`/courses/${id}`, data);

// Delete course
export const deleteCourse = (id) => api.delete(`/courses/${id}`);

// Toggle publish course
export const togglePublish = (id) => api.patch(`/courses/${id}/publish`);

// Get course progress
export const getCourseProgress = (courseId) => api.get(`/courses/${courseId}/progress`);




