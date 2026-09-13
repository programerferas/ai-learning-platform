// api/categories.js
import axios from "axios";
import api from "./axios"; // your existing axios instance

// Get all categories
export const getAllCategories = () => api.get("/categories");

// Get single category by ID
export const getCategoryById = (id) => api.get(`/categories/${id}`);

// Admin only
export const createCategory = (data) => api.post("/categories", data);
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);


/**
 * Upload a category image directly to storage — same flow as uploadCourseImage:
 * 1. POST /uploads/presign/category-image { filename, contentType, size } -> { uploadUrl, key }
 * 2. PUT the file to uploadUrl
 * Returns the storage key to send as `thumbnailKey` when creating/updating a category.
 * onProgress(percent) is optional.
 */
export const uploadCategoryImage = async (file, onProgress) => {
  const { uploadUrl, key } = await api
    .post("/uploads/presign/category-image", {
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
