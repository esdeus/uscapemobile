// models/User.js
import mongoose from "mongoose";

const notificationSettingsSchema = new mongoose.Schema({
  email: {
    type: String,
    default: null,
    validate: {
      validator: function(email) {
        if (!email) return true;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: "Please provide a valid email address."
    }
  },
  features: {
    taskManagement: {type: Boolean, default: true},
    documentManagement: {type: Boolean, default: true},
    messaging: {type: Boolean, default: true},
    projectManagement: {type: Boolean, default: true},
    inventoryManagement: {type: Boolean, default: true},
  },
  isEnabled: { type: Boolean, default: false }
});

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profileImageUrl: { type: String, default: null },
    role: { 
      type: String, 
      enum: ["admin", "Engineering", "Management", "Warehouse", "member"],
      default: "member" 
    },
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', default: null },
    departmentId: { type: mongoose.Schema.Types.ObjectId, default: null },
    projectIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
    notificationSettings: {
      type: notificationSettingsSchema,
      default: () => ({})
    }
  },
  { timestamps: true }
);

// Hash password before saving - only for new/modified passwords
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  
  const bcrypt = await import("bcryptjs");
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Virtual for getting username from email if missing
UserSchema.virtual('displayUsername').get(function() {
  return this.username || this.email.split('@')[0];
});

export default mongoose.model("User", UserSchema);