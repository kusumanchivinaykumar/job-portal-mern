import express from "express"
import upload from "../config/multer.js"
import {
  applyJob,
  getAppliedJobs,
  getJobs,
  getJobById,
  updateUserResume,
  getUserProfile,
  authUser
} from "../controllers/jobController.js"
import { protectUser } from "../middleware/authMiddleware.js"

const router = express.Router()

// ==========================
// PUBLIC ROUTES
// ==========================

// Auth user
router.post("/auth", authUser)

// Get all jobs
router.get("/", getJobs)

// ==========================
// PROTECTED ROUTES (USER)
// ==========================

// Get jobs applied by logged-in user
router.get(
  "/applied",
  protectUser,
  getAppliedJobs
)

// Save/update user resume
router.post(
  "/resume",
  protectUser,
  upload.single("resume"),
  updateUserResume
)

// Apply for a job (resume upload)
router.post(
  "/apply/:id",
  protectUser,
  upload.single("resume"),
  applyJob
)

// Get user profile
router.get(
  "/profile",
  protectUser,
  getUserProfile
)

// Get single job by ID
router.get("/:id", getJobById)

export default router
