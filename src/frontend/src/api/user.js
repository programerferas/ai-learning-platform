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

// Get current user profile (if you have this endpoint)
export const getCurrentUser = () =>
  api.get('/users/me').then((r) => r.data);

// Update current user profile
export const updateCurrentUser = (userData) =>
  api.put('/users/me', userData).then((r) => r.data);

