// routes/taskRoutes.js
import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  getTasksByBoard,
  createTask,
  updateTaskStatus,
  updateTaskChecklist,
  getTaskById,
  updateTask,
  deleteTask,
  addCommentToTask,
  getTaskComments,
} from "../controllers/task.controller.js";

const router = express.Router();

router.get("/board/:boardId", protect, getTasksByBoard);
router.get("/:id", protect, getTaskById);
router.post("/", protect, createTask);
router.put("/:id", protect, updateTask);
router.delete("/:id", protect, deleteTask);
router.patch("/:id/status", protect, updateTaskStatus);
router.put("/:id/todo", protect, updateTaskChecklist);
router.post("/:id/comments", protect, addCommentToTask);
router.get("/:id/comments", protect, getTaskComments);

export default router;