require("dotenv").config();
const express = require("express");
const router = express.Router();
const User = require("../models/user");
const { jwtAuthMiddleWare, generateToken } = require("../jwt");
const projectSchema = require("../models/projectSchema");
const multer = require("multer");
const { put } = require("@vercel/blob");

const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

router.post("/create-admin", async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const NewUser = {
      name: name,
      email: email,
      password: password,
      role: role,
    };

    const newAdmin = new User(NewUser);
    const response = await newAdmin.save();
    return res
      .status(201)
      .json({ message: "Admin created successfully", adminId: response._id });
  } catch (error) {
    console.error("Error creating admin:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login-admin", async (req, res) => {
  try {
    const { name, password } = req.body;
    if (!name || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const admin = await User.findOne({ name: name });
    if (admin == null || admin.role !== "admin") {
      return res.status(401).json({ error: "Invalid  user" });
    }
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const payload = {
      id: admin._id,
      name: admin.name,
      role: admin.role,
    };

    const Token = generateToken(payload);

    return res.status(200).json({ token: Token, message: "Login successful" });
  } catch (error) {
    console.error("Error during admin login:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post(
  "/create-project",
  jwtAuthMiddleWare,
  upload.array("images", 5),
  async (req, res) => {
    try {
      const { title, description, projectUrl, codeLink, languages, tools } =
        req.body;
      // 1. Log to see if Multer is getting files
      console.log("Files received by Multer:", req.files?.length || 0);
      let imageUrls = [];
      for (const file of req.files) {
        const blob = await put(file.originalname, file.buffer, {
          access: "public",
          token: process.env.BLOB_READ_WRITE_TOKEN,
          allowOverwrite: true,
        });
        console.log("Uploaded to Vercel:", blob.url);
        imageUrls.push(blob.url); // Save the actual internet URL
      }
      if (!title || !description || !projectUrl || !codeLink) {
        return res.status(400).json({ error: "All fields are required" });
      }

      const NewProject = {
        title,
        description,
        projectUrl,
        codeLink,
        tools,
        languages,
        profileImages: imageUrls,
        user: req.user.id,
      };
      const project = new projectSchema(NewProject);
      const response = await project.save();
      return res
        .status(201)
        .json({ message: "Project created successfully", response: response });
    } catch (error) {
      console.error("Error creating project:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.delete(
  "/delete-project/:projectId",
  jwtAuthMiddleWare,
  async (req, res) => {
    try {
      const { projectId } = req.params;
      if (!projectId) {
        return res.status(400).json({ error: "Project ID not found" });
      }

      deleteProject = await projectSchema.findByIdAndDelete(projectId);
      if (!deleteProject) {
        return res.status(404).json({ error: "Project not found" });
      }
      return res.status(201).json({
        message: "Project deleted successfully",
        response: deleteProject,
      });
    } catch (error) {
      console.error("Error deleting project:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.put(
  "/update-project/:projectId",
  jwtAuthMiddleWare,
  async (req, res) => {
    try {
      const { projectId } = req.params;
      const updatedData = req.body;
      if (!projectId) {
        return res.status(400).json({ error: "Project ID not found" });
      }

      const updatedProject = await projectSchema.findByIdAndUpdate(
        projectId,
        { $set: updatedData },
        { new: true, runValidators: true }
      );
      if (!updatedProject) {
        return res.status(404).json({ error: "Project not found" });
      }
      return res.status(200).json({
        message: "Project updated successfully",
        response: updatedProject,
      });
    } catch (error) {
      console.error("Error updating project:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.get("/all-projects", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const totalProjects = await projectSchema.countDocuments();

    const totalPages = Math.ceil(totalProjects / limit);
    const projects = await projectSchema
      .find()
      .populate("user", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    return res.status(200).json({
      success: true,
      currentPage: page,
      totalPages: totalPages,
      totalResult: totalProjects,
      data: projects,
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
