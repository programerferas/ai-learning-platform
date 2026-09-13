import express from "express";
import * as enrollmentController from "./enrollment.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { allowRoles } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { saveProgressSchema } from "../../schemas/enrollment.schema.js";

const router = express.Router();

// ✅ Static routes FIRST (before /:courseId)
router.get("/my",               authMiddleware, enrollmentController.getMyEnrollments);
router.get("/continue-learning", authMiddleware, enrollmentController.getContinueLearningController);
router.get("/",                 authMiddleware, allowRoles("ADMIN"), enrollmentController.getAllEnrollments);
router.post("/progress",        authMiddleware, validate(saveProgressSchema), enrollmentController.saveProgressController);

// ✅ check enrollment (needed by frontend)
router.get("/check/:courseId",  authMiddleware, enrollmentController.checkEnrollment);

// ✅ Dynamic routes AFTER static ones
router.post("/:courseId",       authMiddleware, enrollmentController.enrollInCourse);
router.delete("/:courseId",     authMiddleware, enrollmentController.unenrollFromCourse);
router.get("/resume/:courseId", authMiddleware, enrollmentController.getResumeController);


router.get("/:courseId", authMiddleware, enrollmentController.getEnrollmentByCourse); 


export default router;