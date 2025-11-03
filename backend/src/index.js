import express from "express";
import cors from "cors";
import "dotenv/config";
import job from "./lib/cron.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes  from "./routes/userRoutes.js";
import organizationRoutes from "./routes/organizationRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import boardRoutes from "./routes/boardRoutes.js";

import { connectDB } from "./lib/db.js";

const app = express();
const PORT = process.env.PORT || 3000;

job.start();
app.use(express.json());
app.use(cors());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/organization", organizationRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/boards", boardRoutes);

app.listen(PORT, "0.0.0.0" ,() => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});
