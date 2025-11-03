import mongoose from "mongoose";

const todoSchema = new mongoose.Schema({
    text: { type: String, required: true },
    completed: { type: Boolean, default: false },
});

const commentSchema = new mongoose.Schema(
    {
        text: { type: String, required: true},
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User"},
        timestamp: { type: Date, default: Date.now },
    },
    { _id: false }
);

const taskSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        description: { type: String },
        priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
        status: { type: String, enum: ["Pending", "In Progress", "Completed"], default: "Pending" },
        startDate: { type: Date, required: true},
        dueDate: { type: Date, required: true },
        assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        attachments: [{ type: String }],
        todoChecklist: [todoSchema], 
        progress: { type: Number, default: 0 },
        orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true},
        comments: [commentSchema],
        category: { type: String },
        boardId: { type: mongoose.Schema.Types.ObjectId, ref: "Board" },
        order: { type: Number, default: 0},
    },
    { timestamps: true }
);

export default mongoose.model("Task", taskSchema);