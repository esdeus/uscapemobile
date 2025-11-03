// controllers/taskController.js
import Task from "../models/Task.js";
import mongoose from "mongoose";
import Board from "../models/Board.js";

// @desc    Get tasks by board
// @route   GET /api/tasks/board/:boardId
// @access  Private
export const getTasksByBoard = async (req, res) => {
  try {
    const { boardId } = req.params;
    const { status } = req.query;

    if (!boardId) {
      return res.status(400).json({ message: "boardId is required" });
    }

    const filter = {
      boardId: new mongoose.Types.ObjectId(boardId),
      orgId: new mongoose.Types.ObjectId(req.user.orgId),
    };

    if (status && status !== "All") {
      filter.status = status;
    }

    const tasks = await Task.find(filter)
      .populate("assignedTo", "name email profileImageUrl")
      .populate({
        path: "comments.user",
        select: "name email profileImageUrl",
      })
      .sort({ order: 1 });

    // Add completed todoChecklist count to each task
    const tasksWithCompletedCount = tasks.map((task) => {
      const completedCount = task.todoChecklist.filter(
        (item) => item.completed
      ).length;
      return {
        ...task.toObject(),
        completedTodoCount: completedCount,
      };
    });

    res.status(200).json({ tasks: tasksWithCompletedCount });
  } catch (error) {
    console.error("Error fetching tasks by board:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
export const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      startDate,
      dueDate,
      assignedTo,
      attachments,
      todoChecklist,
      category,
      boardId,
    } = req.body;

    if (!Array.isArray(assignedTo)) {
      return res
        .status(400)
        .json({ message: "assignedTo must be an array of user IDs" });
    }

    // Count existing tasks in the board to determine order
    const existingTaskCount = await Task.countDocuments({
      boardId,
      orgId: req.user.orgId,
    });

    const task = await Task.create({
      title,
      description,
      priority,
      startDate,
      dueDate,
      assignedTo,
      createdBy: req.user._id,
      todoChecklist,
      attachments,
      orgId: req.user.orgId,
      category,
      boardId,
      order: existingTaskCount + 1,
    });

    const populatedTask = await Task.findById(task._id)
      .populate("assignedTo", "name email profileImageUrl");

    res.status(201).json({ message: "Task created successfully", task: populatedTask });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update task status
// @route   PATCH /api/tasks/:id/status
// @access  Private
export const updateTaskStatus = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    task.status = req.body.status || task.status;

    if (task.status === "Completed") {
      task.todoChecklist.forEach((item) => (item.completed = true));
      task.progress = 100;
    }

    await task.save();
    
    const updatedTask = await Task.findById(req.params.id)
      .populate("assignedTo", "name email profileImageUrl");

    res.json({ message: "Task status updated", task: updatedTask });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update task checklist
// @route   PUT /api/tasks/:id/todo
// @access  Private
export const updateTaskChecklist = async (req, res) => {
  try {
    const { todoChecklist } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ message: "Task not found" });

    // Check if user belongs to same organization
    if (task.orgId.toString() !== req.user.orgId.toString()) {
      return res.status(403).json({ message: "Not authorized to update checklist" });
    }

    task.todoChecklist = todoChecklist;

    // Auto-update progress based on checklist completion
    const completedCount = task.todoChecklist.filter(
      (item) => item.completed
    ).length;
    const totalItems = task.todoChecklist.length;
    task.progress =
      totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

    // Auto-mark task as completed if all items are checked
    if (task.progress === 100) {
      task.status = "Completed";
    } else if (task.progress > 0) {
      task.status = "In Progress";
    } else {
      task.status = "Pending";
    }

    await task.save();
    const updatedTask = await Task.findById(req.params.id)
      .populate("assignedTo", "name email profileImageUrl");

    res.json({ message: "Task checklist updated", task: updatedTask });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get task by ID
// @route   GET /api/tasks/:id
// @access  Private
export const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id)
      .populate("assignedTo", "name profileImageUrl")
      .populate("createdBy", "name profileImageUrl");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: "Error fetching task", error: error.message });
  }
};

// @desc    Update task details
// @route   PUT /api/tasks/:id
// @access  Private
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ message: "Task not found" });

    task.title = req.body.title || task.title;
    task.category = req.body.category || task.category;
    task.description = req.body.description || task.description;
    task.priority = req.body.priority || task.priority;
    task.startDate = req.body.startDate || task.startDate;
    task.dueDate = req.body.dueDate || task.dueDate;
    task.todoChecklist = req.body.todoChecklist || task.todoChecklist;
    task.attachments = req.body.attachments || task.attachments;
    task.boardId = req.body.boardId || task.boardId;

    if (req.body.assignedTo) {
      if (!Array.isArray(req.body.assignedTo)) {
        return res
          .status(400)
          .json({ message: "assignedTo must be an array of user IDs" });
      }
      task.assignedTo = req.body.assignedTo;
    }

    const updatedTask = await task.save();
    
    const populatedTask = await Task.findById(updatedTask._id)
      .populate("assignedTo", "name email profileImageUrl");

    res.json({ message: "Task updated successfully", task: populatedTask });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ message: "Task not found" });

    await task.deleteOne();
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Add a comment to a task
// @route   POST /api/tasks/:id/comments
// @access  Private
export const addCommentToTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: "Comment text is required"});
    }

    const task = await Task.findById(taskId);

    if (!task) return res.status(404).json({ message: "Task not found"});

    // Check organization access
    if (task.orgId.toString() !== req.user.orgId.toString()) {
      return res.status(403).json({ message: "You are not allowed to comment here "});
    };

    // Add a new comment
    const newComment = {
      text,
      user: req.user._id,
      timestamp: new Date(),
    };

    task.comments.push(newComment);
    await task.save();

    const updatedTask = await Task.findById(taskId).populate({
      path: "comments.user",
      select: "name email profileImageUrl",
    });

    res.status(201).json({
      message: "Comment added successfully",
      comments: updatedTask.comments,
    });
  } catch(error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
};

// @desc    Get comments for a task
// @route   GET /api/tasks/:id/comments
// @access  Private
export const getTaskComments = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate({
      path: "comments.user",
      select: "name email profileImageUrl",
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (task.orgId.toString() !== req.user.orgId.toString()) {
      return res.status(403).json({ message: "Not authorized to view comments" });
    }

    res.json({ comments: task.comments });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};