// controllers/authController.js
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import Organization from "../models/Organization.js";

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

export const registerUser = async (req, res) => {
  try {
    const { name, username, email, password, profileImageUrl, orgId } = req.body;

    // Validation
    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password should be at least 6 characters long" });
    }

    if (username.length < 3) {
      return res.status(400).json({ message: "Username should be at least 3 characters long" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: "Email already exists" });
      }
      if (existingUser.username === username) {
        return res.status(400).json({ message: "Username already exists" });
      }
    }

    let role = "admin";
    let finalOrgId = null;

    // Create user first
    const user = await User.create({
      name,
      username,
      email,
      password,
      profileImageUrl: profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      role,
    });

    if (orgId) {
      // Join existing organization
      const existingOrg = await Organization.findById(orgId);
      if (!existingOrg) {
        return res.status(400).json({ message: "Invalid organization ID." });
      }

      role = "member";
      finalOrgId = existingOrg._id;

      await Organization.findByIdAndUpdate(orgId, {
        $addToSet: { members: user._id },
      });

      user.role = role;
      user.orgId = finalOrgId;
      await user.save();
    } else {
      // Create new organization
      const newOrg = await Organization.create({
        name: `${name}'s Organization`,
        createdBy: user._id,
        members: [user._id],
      });

      finalOrgId = newOrg._id;
      user.orgId = finalOrgId;
      await user.save();
    }

    // Send response
    res.status(201).json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      orgId: user.orgId,
      profileImageUrl: user.profileImageUrl,
      notificationSettings: user.notificationSettings || {
        email: "",
        isEnabled: false,
        features: {
          taskManagement: true,
          documentManagement: true,
          messaging: true,
          projectManagement: true,
          inventoryManagement: true
        }
      },
      token: generateToken(user._id),
    });

  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user by email (handle both old and new user structures)
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Compare password - handle both bcrypt methods
    let isMatch;
    try {
      // First try the method from your existing users (web app)
      const bcrypt = await import("bcryptjs");
      isMatch = await bcrypt.compare(password, user.password);
    } catch (compareError) {
      console.error("Password compare error:", compareError);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate response that works for both old and new users
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      orgId: user.orgId,
      profileImageUrl: user.profileImageUrl,
      notificationSettings: user.notificationSettings || {
        email: "",
        isEnabled: false,
        features: {
          taskManagement: true,
          documentManagement: true,
          messaging: true,
          projectManagement: true,
          inventoryManagement: true
        }
      },
      token: generateToken(user._id),
    };

    // Add username field for compatibility (generate from email if missing)
    if (user.username) {
      userResponse.username = user.username;
    } else {
      // Generate username from email for existing users
      userResponse.username = user.email.split('@')[0];
    }

    res.json(userResponse);
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message 
    });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImageUrl: user.profileImageUrl,
      orgId: user.orgId,
      notificationSettings: user.notificationSettings || {
        email: "",
        isEnabled: false,
        features: {
          taskManagement: true,
          documentManagement: true,
          messaging: true,
          projectManagement: true,
          inventoryManagement: true
        }
      }
    };

    // Add username field for compatibility
    if (user.username) {
      userResponse.username = user.username;
    } else {
      userResponse.username = user.email.split('@')[0];
    }

    res.json(userResponse);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.username = req.body.username || user.username;

    if (req.body.password) {
      user.password = req.body.password; // Will be hashed by pre-save middleware
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      profileImageUrl: updatedUser.profileImageUrl,
      token: generateToken(updatedUser._id),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const testConnection = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    res.json({ 
      message: "Backend is working", 
      userCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ message: "Database connection failed", error: error.message });
  }
};