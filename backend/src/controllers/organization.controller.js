import Organization from "../models/Organization.js";
import User from "../models/User.js";

// @desc    Get current user's organization
// @route   GET /api/organizations/my
// @access  Private
export const getMyOrganization = async (req, res) => {
  try {
    const org = await Organization.findById(req.user.orgId)
    .populate("members", "-password")
    .populate("createdBy", "name email profileImageUrl");

    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }

    res.json(org);
  } catch (error) {
    console.error("Get organization error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update organization info (admin only)
// @route   PUT /api/organizations/my
// @access  Private (Admin)
export const updateMyOrganization = async (req, res) => {
  try {
    const { name } = req.body;

    const org = await Organization.findById(req.user.orgId);

    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }

    // Only allow admin to update
    if (org.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only an admin can update the organization's details" });
    }

    org.name = name || org.name;
    const updatedOrg = await org.save();

    res.json(updatedOrg);
  } catch (error) {
    console.error("Update organization error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get all members in the same org
// @route   GET /api/organizations/members
// @access  Private
export const getOrgMembers = async (req, res) => {
  try {
    const members = await User.find({
      orgId: req.user.orgId,
    }).select("-password");

    res.json(members);
  } catch (error) {
    console.error("Get org members error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get all roles in the same org
// @route   GET /api/organizations/:orgId/roles
// @access  Private
export const getOrgRoles = async (req, res) => {
  try {
    const { orgId } = req.params;
    const organization = await Organization.findById(orgId);

    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }
    
    res.json(organization.roleName || []);
  } catch (error) {
    console.error("Get org roles error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Add a new custom role to the organization
// @route   POST /api/organizations/:orgId/add-role
// @access  Private (Admin)
export const addRole = async (req, res) => {
  try {
    const { orgId } = req.params;
    const { roleName } = req.body;

    const organization = await Organization.findById(orgId);
    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    if (organization.roleName.includes(roleName)) {
      return res.status(400).json({ message: "Role already exists" });
    }

    organization.roleName.push(roleName);
    await organization.save();

    res.status(200).json({ message: "Role added successfully", organization });
  } catch (error) {
    console.error("Add role error:", error);
    res.status(500).json({ message: "Failed to add role", error: error.message });
  }
};

// @desc    Remove role from organization
// @route   DELETE /api/organizations/:orgId/remove-role
// @access  Private (Admin)
export const removeRole = async (req, res) => {
  try {
    const { orgId } = req.params;
    const { roleName } = req.body;

    if (!roleName) {
      return res.status(400).json({ message: "Role name is required" });
    }

    const org = await Organization.findById(orgId);
    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }

    if (!org.roleName.includes(roleName)) {
      return res.status(404).json({ message: "Role not found in organization" });
    }

    org.roleName = org.roleName.filter(role => role !== roleName);
    await org.save();

    // Update users with this role to "member"
    await User.updateMany(
      { orgId: orgId, role: roleName },
      { $set: { role: "member" } }
    );

    res.status(200).json({ success: true, message: "Role deleted successfully" });
  } catch (error) {
    console.error("Remove role error:", error);
    res.status(500).json({ message: "Failed to delete role", error: error.message });
  }
};

// Departments
export const getDepartments = async (req, res) => {
  try {
    const { orgId } = req.params;
    const organization = await Organization.findById(orgId);

    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    return res.json({ departments: organization.departments });
  } catch (error) {
    console.error("Get departments error:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const addDepartment = async (req, res) => {
  try {
    const { orgId } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const organization = await Organization.findById(orgId);

    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const newDepartment = {
      name,
      createdBy: req.user._id,
    };

    organization.departments.push(newDepartment);
    await organization.save();

    return res.status(201).json({ department: newDepartment });
  } catch (error) {
    console.error("Add department error:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const { orgId, departmentId } = req.params;

    const organization = await Organization.findById(orgId);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const departmentIndex = organization.departments.findIndex(
      (dept) => dept._id.toString() === departmentId
    );

    if (departmentIndex === -1) {
      return res.status(404).json({ message: 'Department not found' });
    }

    organization.departments.splice(departmentIndex, 1);
    await organization.save();

    return res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error("Delete department error:", error);
    return res.status(500).json({ message: error.message });
  }
};