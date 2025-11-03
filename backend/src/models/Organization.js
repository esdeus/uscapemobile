import mongoose from "mongoose";

const departmentSubSchema = new mongoose.Schema({
  name: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  roleName: [{ type: String }],
  taskCategories: [{ type: String }],
  boards: [{ type: String }],
  roleLayout: [
    {
      label: String,
      position: {
        x: Number,
        y: Number
      },
      connections: [Number],
    }
  ],
  departments: [departmentSubSchema],
}, { timestamps: true });

export default mongoose.model("Organization", organizationSchema);