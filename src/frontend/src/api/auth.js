// src/api/auth.js
import api from "./axios";

export const login    = (data) => api.post("/auth/login", data);
export const register = (data) => api.post("/auth/register", data);
export const logout   = ()     => api.post("/auth/logout");
export const getMe    = ()     => api.get("/auth/me");
export const updateProfile  = (data) => api.put("/auth/update-profile", data);
export const changePassword = (data) => api.put("/auth/change-password", data);
export const forgotPasswordRequest = (email) => {
   return api.post("/auth/forgot-password", { email });
};

export const resetPasswordRequest = (token, password) => {
   return api.post(`/auth/reset-password/${token}`, { password });
}



const auth = { login, register, logout, getMe, updateProfile, changePassword, forgotPasswordRequest, resetPasswordRequest };
export default auth;