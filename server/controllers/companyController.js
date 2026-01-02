import Company from "../models/Company.js";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";
import generateToken from "../utils/generateToken.js";
import Job from "../models/Job.js";

/* =========================
   REGISTER COMPANY
========================= */
export const registerCompany = async (req, res) => {
  const { name, email, password } = req.body;
  const imageFile = req.file;
  const isDev = process.env.NODE_ENV !== "production";

  if (!name || !email || !password || (!imageFile && !isDev)) {
    return res.json({ success: false, message: "All fields are required" });
  }

  try {
    const companyExists = await Company.findOne({ email });
    if (companyExists) {
      return res.json({
        success: false,
        message: "Company already registered",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    let imageUrl;
    if (imageFile) {
      try {
        const uploadRes = await cloudinary.uploader.upload(imageFile.path);
        imageUrl = uploadRes.secure_url;
      } catch (err) {
        throw new Error("Failed to upload company logo");
      }
    } else if (isDev) {
      imageUrl = "https://via.placeholder.com/128";
    } else {
      throw new Error("Image required");
    }

    const company = await Company.create({
      name,
      email,
      password: hashPassword,
      image: imageUrl,
    });

    res.json({
      success: true,
      company: {
        _id: company._id,
        name: company.name,
        email: company.email,
        image: company.image,
      },
      token: generateToken(company._id),
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

/* =========================
   COMPANY LOGIN (FIXED)
========================= */
export const loginCompany = async (req, res) => {
  const { email, password } = req.body;

  try {
    const company = await Company.findOne({ email });
    if (!company) {
      return res.json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, company.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid email or password" });
    }

    res.json({
      success: true,
      company: {
        _id: company._id,
        name: company.name,
        email: company.email,
        image: company.image,
      },
      token: generateToken(company._id),
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

/* =========================
   GET COMPANY DATA
========================= */
export const getCompanyData = async (req, res) => {
  try {
    const company = req.company;
    res.json({ success: true, company });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

/* =========================
   POST A JOB
========================= */
export const postJob = async (req, res) => {
  const { title, description, location, salary, level, category } = req.body;
  const companyId = req.company._id;

  try {
    const newJob = new Job({
      title,
      description,
      location,
      salary,
      companyId,
      level,
      category,
      visible: true,
      date: Date.now(),
      applicants: [],
    });

    await newJob.save();
    res.json({ success: true, job: newJob });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

/* =========================
   GET COMPANY JOB APPLICANTS
========================= */
export const getCompanyJobApplicants = async (req, res) => {
  try {
    const { jobId } = req.params;
    const companyId = req.company._id;

    if (jobId) {
      const job = await Job.findById(jobId)
        .populate("applicants.user", "name email");

      if (!job) {
        return res.json({ success: false, message: "Job not found" });
      }

      if (job.companyId.toString() !== companyId.toString()) {
        return res.json({ success: false, message: "Unauthorized access" });
      }

      const applicants = job.applicants.map(app => ({
        _id: app._id,
        user: app.user,
        resume: app.resume,
        status: app.status,
        appliedAt: app.appliedAt,
        jobTitle: job.title,
        jobId: job._id
      }));

      res.json({
        success: true,
        applicants
      });
    } else {
      // Fetch all applicants for all jobs of this company
      const jobs = await Job.find({ companyId })
        .populate("applicants.user", "name email");

      // Flatten applicants
      let applicants = [];
      jobs.forEach(job => {
        const jobApplicants = job.applicants.map(app => ({
          _id: app._id,
          user: app.user,
          resume: app.resume,
          status: app.status,
          appliedAt: app.appliedAt,
          jobTitle: job.title,
          jobId: job._id
        }));
        applicants = [...applicants, ...jobApplicants];
      });

      // Sort by date
      applicants.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));

      res.json({
        success: true,
        applicants
      })
    }

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

/* =========================
   GET COMPANY POSTED JOBS
========================= */
export const getCompanyPostedJobs = async (req, res) => {
  try {
    const companyId = req.company._id;

    const jobs = await Job.find({ companyId });

    const jobsWithCount = jobs.map((job) => ({
      ...job._doc,
      applicantsCount: job.applicants.length,
    }));

    res.json({ success: true, jobsData: jobsWithCount });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

/* =========================
   CHANGE JOB APPLICATION STATUS
========================= */
export const changeJobApplicationStatus = async (req, res) => {
  try {
    const { jobId, applicantId, status } = req.body;
    const companyId = req.company._id;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.json({ success: false, message: "Job not found" });
    }

    if (job.companyId.toString() !== companyId.toString()) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    const applicant = job.applicants.find(
      (app) => app._id.toString() === applicantId
    );

    if (!applicant) {
      return res.json({ success: false, message: "Applicant not found" });
    }

    applicant.status = status;
    await job.save();

    res.json({ success: true, message: "Status updated successfully" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

/* =========================
   CHANGE JOB VISIBILITY
========================= */
export const changeVisibility = async (req, res) => {
  try {
    const { id } = req.body;
    const companyId = req.company._id;

    const job = await Job.findById(id);
    if (!job) {
      return res.json({ success: false, message: "Job not found" });
    }

    if (companyId.toString() !== job.companyId.toString()) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    job.visible = !job.visible;
    await job.save();

    res.json({ success: true, job });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

/* =========================
   DELETE JOB
========================= */
export const deleteJob = async (req, res) => {
  try {
    const { id } = req.body;
    const companyId = req.company._id;

    const job = await Job.findById(id);
    if (!job) {
      return res.json({ success: false, message: "Job not found" });
    }

    if (companyId.toString() !== job.companyId.toString()) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    await Job.findByIdAndDelete(id);

    res.json({ success: true, message: "Job deleted successfully" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
