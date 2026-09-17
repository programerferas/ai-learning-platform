// src/api/courses.js
import axios from "axios";
import api from "./axios";

// Public list: published courses only, paginated (default 10)
export const getCourses    = (params) => api.get("/courses", { params });
// Admin/instructor list: every course in the DB (unpublished included), no pagination
export const getManagedCourses = () => api.get("/courses/manage");
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

/**
 * Upload a course image directly to storage (bytes never pass through the API).
 * Same flow as uploadLessonVideo:
 * 1. POST /uploads/presign/image { filename, contentType, size } -> { uploadUrl, key }
 * 2. PUT the file to uploadUrl
 * Returns the storage key to send as `thumbnailKey` when creating/updating a course.
 * onProgress(percent) is optional.
 */
export const uploadCourseImage = async (file, onProgress) => {
  const { uploadUrl, key } = await api
    .post("/uploads/presign/image", {
      filename: file.name,
      contentType: file.type,
      size: file.size,
    })
    .then((r) => r.data);

  // Plain axios: the presigned URL is on the storage host, not our API,
  // so no baseURL / cookies must be attached.
  await axios.put(uploadUrl, file, {
    headers: { "Content-Type": file.type },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
    },
  });

  return key;
};
