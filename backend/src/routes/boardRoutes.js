// routes/boardRoutes.js
import express from "express";
import {
  createBoard,
  getBoardsByOrg,
  deleteBoard,
  fetchTasksFromBoard,
} from "../controllers/board.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protect, createBoard);
router.get("/:orgId", protect, getBoardsByOrg);
router.delete("/:boardId", protect, deleteBoard);
router.get("/:boardId/tasks", protect, fetchTasksFromBoard);

export default router;