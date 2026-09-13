// src/api/axios.js
import axios from "axios";

// رابط الـ backend يأتي من متغيّر البيئة وقت البناء (VITE_API_URL في .env)،
// والقيمة الافتراضية للتطوير المحلي فقط. في الإنتاج يجب ضبطه على رابط الـ API الحقيقي.
const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");

if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
  // بناء إنتاجي بلا VITE_API_URL سيرسل الطلبات إلى localhost على جهاز المستخدم
  console.error("VITE_API_URL is not set — API requests will go to localhost");
}

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true, // مهم لأن عندك httpOnly cookies
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (import.meta.env.DEV) {
      console.log("API Error:", err.response?.status, err.response?.data);
    }
    return Promise.reject(err);
  }
);

export default api;
