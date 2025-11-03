import express from "express";
import {
  getMyOrganization,
  updateMyOrganization,
  getOrgMembers,
  addRole,
  getOrgRoles,
  removeRole,
  getDepartments,
  addDepartment,
  deleteDepartment,
} from "../controllers/organization.controller.js";
import { protect, adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

// Organization management
router.get("/my", protect, getMyOrganization);
router.put("/my", protect, adminOnly, updateMyOrganization);
router.get("/members", protect, getOrgMembers);

// Role management
router.post("/:orgId/add-role", protect, adminOnly, addRole);
router.get("/:orgId/roles", protect, getOrgRoles);
router.delete("/:orgId/remove-role", protect, adminOnly, removeRole);

// Department management
router.get("/:orgId/departments", protect, getDepartments);
router.post("/:orgId/departments", protect, adminOnly, addDepartment);
router.delete("/:orgId/departments/:departmentId", protect, adminOnly, deleteDepartment);

export default router;