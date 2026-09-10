import express from "express";
import { getDashboardOverviewController } from  "./dashboard.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { allowRoles } from "../../middlewares/role.middleware.js";


const router = express.Router();

// Dashboard overview - admin only
router.get(
  "/overview",
  authMiddleware,
  allowRoles("ADMIN"),
  getDashboardOverviewController,
);

export default router;

