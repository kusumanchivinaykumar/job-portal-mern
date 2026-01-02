import express from "express"
import upload from "../config/multer.js"
import {
  registerCompany,
  loginCompany,
  getCompanyData,
  postJob,
  getCompanyJobApplicants,
  getCompanyPostedJobs,
  changeJobApplicationStatus,
  changeVisibility,
  deleteJob
} from "../controllers/companyController.js"
import { protectCompany } from "../middleware/authMiddleware.js"

const router = express.Router()

// ==========================
// AUTH ROUTES
// ==========================

// Register a company
router.post(
  "/register",
  upload.single("image"),
  registerCompany
)

// Company login
router.post("/login", loginCompany)

// ==========================
// PROTECTED ROUTES (COMPANY)
// ==========================

// Get logged-in company profile
router.get(
  "/company",
  protectCompany,
  getCompanyData
)

// Post a new job
router.post(
  "/post-job",
  protectCompany,
  postJob
)

// Get applicants for company jobs
router.get(
  "/applicants",
  protectCompany,
  getCompanyJobApplicants
)
router.get(
  "/applicants/:jobId",
  protectCompany,
  getCompanyJobApplicants
)

// Get jobs posted by company
router.get(
  "/list-jobs",
  protectCompany,
  getCompanyPostedJobs
)

// Change job application status
router.post(
  "/change-status",
  protectCompany,
  changeJobApplicationStatus
)

// Change job visibility (open/close)
router.post(
  "/change-visibility",
  protectCompany,
  changeVisibility
)

// Delete a job
router.post(
  "/delete-job",
  protectCompany,
  deleteJob
)

export default router
