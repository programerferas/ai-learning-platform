// api/categories.js
import api from "./axios"; // your existing axios instance

// Get all categories
export const getAllCategories = () => api.get("/categories");

// Get single category by ID
export const getCategoryById = (id) => api.get(`/categories/${id}`);

// Admin only
export const createCategory = (data) => api.post("/categories", data);
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);