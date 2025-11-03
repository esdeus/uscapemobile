import express from "express";
import { 
  getUsers, 
  getUserById, 
  updateUserRole, 
  updateMyUser, 
  uploadProfileImage, 
  assignUserToDepartment 
} from "../controllers/user.controller.js";
import { protect, adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

// User Management Routes
router.get("/", protect, getUsers);
router.get("/:id", protect, getUserById);
router.put("/:userId/role", protect, adminOnly, updateUserRole);
router.put("/my", protect, updateMyUser);
router.post("/upload-profile-image", protect, uploadProfileImage);
router.patch('/:orgId/assign-department', protect, adminOnly, assignUserToDepartment);

export default router;