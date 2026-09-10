import express from "express";
import { getAllUsers, getUserById, updateUser, deleteUser } from './user.controller.js';
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { allowRoles } from "../../middlewares/role.middleware.js";



const router = express.Router();
// Get all users - admin only
router.get(
  "/",
  authMiddleware,
  allowRoles("ADMIN"),
  getAllUsers,
);

// Get single user
router.get("/:id", authMiddleware, getUserById);

// Update user - admin only
router.put(
  "/:id",
  authMiddleware,
  allowRoles("ADMIN"),
  updateUser,
);

// Delete user - admin only
router.delete(
  "/:id",
  authMiddleware,
  allowRoles("ADMIN"),
  deleteUser,
);



export default router;