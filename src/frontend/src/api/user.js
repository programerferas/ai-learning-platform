// user.api.js or api/users.js

import api from './axios'; 

// Get all users (Admin only)
export const getAllUsers = () =>
  api.get('/users').then((r) => r.data);

// Get user by ID
export const getUserById = (id) =>
  api.get(`/users/${id}`).then((r) => r.data);

// Update user
export const updateUser = (id, userData) =>
  api.put(`/users/${id}`, userData).then((r) => r.data);

// Delete user (Admin only)
export const deleteUser = (id) =>
  api.delete(`/users/${id}`).then((r) => r.data);

// بيانات المستخدم الحالي: /auth/me و /auth/update-profile في api/auth.js
