import User from "../models/User.js";
import Organization from "../models/Organization.js";
import Task from "../models/Task.js";

// Get all users (Admin only)
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "member", orgId: req.user.orgId }).select("-password");

    // Add task counts to each user
    const usersWithTaskCounts = await Promise.all(
      users.map(async (user) => {
        const pendingTasks = await Task.countDocuments({
          assignedTo: user._id,
          status: "Pending",
        });
        const inProgressTasks = await Task.countDocuments({
          assignedTo: user._id,
          status: "In Progress",
        });
        const completedTasks = await Task.countDocuments({
          assignedTo: user._id,
          status: "Completed",
        });

        return {
          ...user._doc,
          pendingTasks,
          inProgressTasks,
          completedTasks,
        };
      })
    );

    res.json(usersWithTaskCounts);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update user role (admin only)
export const updateUserRole = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { role } = req.body;

    const fixedRoles = ['admin', 'Engineering', 'Management', 'Warehouse', 'member'];

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!fixedRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid Role",
        fixedRoles: fixedRoles
      });
    }

    user.role = role;
    await user.save();

    res.json({ message: "Role updated successfully", user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Update current user
export const updateMyUser = async (req, res) => {
  try {
    const { name, username, notificationSettings } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found"});
    }

    user.name = name || user.name;
    user.username = username || user.username;
    
    if (notificationSettings) {
      user.notificationSettings = {
        ...user.notificationSettings,
        ...notificationSettings,
      };
    }
    
    const updatedUser = await user.save();

    res.json(updatedUser);
  } catch(error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Upload profile picture
export const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ message: "No image file uploaded" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.profileImageUrl = req.file.path;
    const updatedUser = await user.save();

    res.json({ message: "Profile image updated", user: updatedUser });
  } catch (error) {
    console.error("Upload profile image error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Assign user to department
export const assignUserToDepartment = async (req, res) => {
  try {
    const { userId, departmentId } = req.body;
    const { orgId } = req.params;

    if (!userId || !departmentId) {
      return res.status(400).json({ message: "User ID and Department ID are required" });
    }

    const org = await Organization.findById(orgId);
    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }

    const department = org.departments.id(departmentId);
    if (!department) {
      return res.status(404).json({ message: "Department not found in this organization" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { departmentId },
      { new: true }
    );

    return res.status(200).json({
      message: `User assigned to department: ${department.name}`,
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error assigning department:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};