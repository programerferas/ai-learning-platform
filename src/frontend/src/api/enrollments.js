import api from "./axios";

export const enrollCourse      = (courseId) => api.post(`/enrollments/${courseId}`);
export const checkEnrollment   = (courseId) => api.get(`/enrollments/check/${courseId}`);
export const getMyEnrollments  = ()         => api.get("/enrollments/my");
export const unenrollCourse    = (courseId) => api.delete(`/enrollments/${courseId}`);
export const saveProgress      = (data)     => api.post("/enrollments/progress", data);
export const getResume         = (courseId) => api.get(`/enrollments/resume/${courseId}`);
export const getContinueLearning = ()       => api.get("/enrollments/continue-learning");
export const getEnrollmentByCourse = (courseId) => api.get(`/enrollments/${courseId}`);