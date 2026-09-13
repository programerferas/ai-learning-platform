import express from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "./user.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { allowRoles } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { adminUpdateUserSchema } from "../../schemas/user.schema.js";

const router = express.Router();

// إدارة المستخدمين كلها للأدمن فقط.
// بيانات المستخدم نفسه تأتي من /auth/me و /auth/update-profile.
router.use(authMiddleware, allowRoles("ADMIN"));

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.put("/:id", validate(adminUpdateUserSchema), updateUser);
router.delete("/:id", deleteUser);

export default router;
