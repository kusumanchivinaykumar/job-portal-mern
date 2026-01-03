import Job from "../models/Job.js"
import { v2 as cloudinary } from "cloudinary";
import User from "../models/User.js"
import path from "path";
import generateToken from "../utils/generateToken.js";

// Get all jobs
export const getJobs = async (req, res) => {

    try {
        const jobs = await Job.find({ visible: true })
            .populate({ path: 'companyId', select: '-password' })

        res.json({ success: true, jobs })

    } catch (error) {
        res.json({ success: false, message: error.message })

    }


}

// Get a single job by ID
export const getJobById = async (req, res) => {

    try {

        const { id } = req.params

        const job = await Job.findById(id)
            .populate({
                path: 'companyId',
                select: '-password'
            })

        if (!job) {

            return res.json({
                success: false,
                message: "Job not found"
            })
        }

        res.json({
            success: true,
            job
        })

    } catch (error) {

        res.json({
            success: false,
            message: error.message
        })

    }

}

// Get applied jobs for a user
export const getAppliedJobs = async (req, res) => {
  try {
    const jobs = await Job.find({
      "applicants.user": req.user._id
    }).populate({
      path: "companyId",
      select: "name image"
    });

    const result = jobs.map(job => {
      const applicant = job.applicants.find(app => app.user.toString() === req.user._id.toString());
      return {
        _id: job._id,
        title: job.title,
        location: job.location,
        companyId: job.companyId,
        status: applicant?.status || "Pending",
        createdAt: applicant?.appliedAt || job.createdAt,
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



export const applyJob = async (req, res) => {
  try {
    const jobId = req.params.id;

    let resumeUrl = null;

    // If a new resume file is provided, upload it; otherwise use saved user resume
    if (req.file) {
      try {
        const uploadRes = await cloudinary.uploader.upload(req.file.path, {
          resource_type: "raw",
          folder: "resumes",
          use_filename: true,
          unique_filename: true,
          access_mode: 'public',
          type: 'upload'
        });
        resumeUrl = uploadRes.secure_url;
      } catch (err) {
        throw new Error("Failed to upload resume");
      }
    } else if (req.user?.resume) {
      resumeUrl = req.user.resume;
    } else {
      return res.status(400).json({ message: "Resume required" });
    }

    // Atomic apply to avoid race condition duplicates
    const updateResult = await Job.updateOne(
      { _id: jobId, "applicants.user": { $ne: req.user._id.toString() } },
      {
        $push: {
          applicants: {
            user: req.user._id.toString(),
            resume: resumeUrl,
            status: "Pending",
            appliedAt: new Date()
          }
        }
      }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(400).json({ message: "Already applied to this job" });
    }

    return res.status(200).json({ message: "Job applied successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Resume file required" });
    }

    let resumeUrl = null;
    try {
      const uploadRes = await cloudinary.uploader.upload(req.file.path, {
        resource_type: "raw",
        folder: "resumes"
      });
      resumeUrl = uploadRes.secure_url;
    } catch (err) {
      throw new Error("Failed to upload resume");
    }

    await User.findByIdAndUpdate(req.user._id, { resume: resumeUrl });
    res.json({ success: true, resume: resumeUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export const getUserProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" })
    }
    res.json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      image: req.user.image,
      resume: req.user.resume || null
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Auth user for frontend
export const authUser = async (req, res) => {
    try {
        const { userId, name, email, image } = req.body;
        
        // Find or update user
        const user = await User.findByIdAndUpdate(
            userId,
            { _id: userId, name, email, image },
            { upsert: true, new: true }
        );

        res.json({ success: true, token: generateToken(userId), user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
