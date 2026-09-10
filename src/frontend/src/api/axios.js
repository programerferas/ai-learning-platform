// src/api/axios.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",  // رابط الـ backend
  withCredentials: true,                 // مهم لأن عندك httpOnly cookies
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.log("API Error:", err.response?.status, err.response?.data);
    return Promise.reject(err);
  }
);

export default api;