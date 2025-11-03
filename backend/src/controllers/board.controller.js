// src/controllers/boardController.js
import Board from "../models/Board.js";
import Task from "../models/Task.js";

// Create a new board with departmentId
export const createBoard = async (req, res) => {
  try {
    const { name, orgId, departmentId } = req.body;
    const createdBy = req.user._id;

    if (!name || !orgId || !departmentId) {
      return res.status(400).json({ message: "Name, orgId, and departmentId are required." });
    }

    const newBoard = new Board({ name, createdBy, orgId, departmentId });
    await newBoard.save();

    res.status(201).json(newBoard);
  } catch (error) {
    console.error("Error creating board:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Get boards by org and optionally by departmentId
export const getBoardsByOrg = async (req, res) => {
  try {
    const { orgId } = req.params;
    const { departmentId } = req.query;

    console.log('=== BOARD API CALL ===');
    console.log('Organization ID:', orgId);
    console.log('Department ID:', departmentId);

    if (!orgId || orgId === "undefined") {
      return res.status(400).json({ message: "Invalid or missing orgId." });
    }

    const filter = { orgId };
    if (departmentId && departmentId !== "null" && departmentId !== "undefined") {
      filter.departmentId = departmentId;
    }

    console.log('Database filter:', filter);

    const boards = await Board.find(filter)
      .populate("createdBy", "name")
      .populate("tasks")
      .sort({ order: 1 });

    console.log('Boards found:', boards.length);
    console.log('=== END BOARD API CALL ===');

    res.status(200).json(boards);
  } catch (error) {
    console.error("Error fetching boards:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Delete a board
export const deleteBoard = async (req, res) => {
  try {
    const boardId = req.params.boardId;

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: "Board not found." });
    }

    // Delete all tasks associated with the board
    await Task.deleteMany({ boardId });

    // Delete the board itself
    await Board.findByIdAndDelete(boardId);

    res.status(200).json({ message: "Board and its tasks deleted successfully." });
  } catch (error) {
    console.error("Error deleting board and tasks:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Fetch tasks from board
export const fetchTasksFromBoard = async (req, res) => {
  try {
    const { boardId } = req.params;
    const { status } = req.query;

    const board = await Board.findById(boardId).populate({
      path: "tasks",
      match: status && status !== "All" ? { status } : {},
      populate: {
        path: "assignedTo",
        select: "profileImageUrl name",
      },
    });

    if (!board) {
      return res.status(404).json({ message: "Board not found." });
    }

    res.status(200).json({
      tasks: board.tasks,
      count: board.tasks.length,
    });
  } catch (error) {
    console.error("Error fetching tasks from board:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};