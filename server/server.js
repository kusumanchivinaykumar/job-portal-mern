// MUST BE FIRST — before anything else
import "./config/instrument.js";
import companyRoutes from "./routes/companyRoutes.js";
import jobRoutes from './routes/jobRoutes.js';

import express from "express";
import cors from "cors";
import "dotenv/config";
import * as Sentry from "@sentry/node";
import connectDB from "./config/db.js";
import { clerkWebhooks } from "./controllers/webhooks.js";
import connectCloudinary from "./config/cloudinary.js";
import Company from "./models/Company.js"
import User from "./models/User.js"
import Job from "./models/Job.js"
import generateToken from "./utils/generateToken.js"
import bcrypt from "bcryptjs"
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express
const app = express();

// Connect to database
await connectDB();
await connectCloudinary();

// Middlewares
app.use(cors());
app.use(express.json()); // parse JSON
app.use(express.urlencoded({ extended: true })); // parse form data

// Root Route
app.get("/", (req, res) => {
  res.json({ message: "API Working" });
});

// Test Sentry
app.get("/debug-sentry", (req, res) => {
  throw new Error("My first Sentry error!");
});

// Clerk Webhook
app.post('/webhooks', clerkWebhooks);

// Routes
app.use('/api/company', companyRoutes);
app.use('/api/jobs', jobRoutes);

// Dev-only helper routes to seed data and issue a test user token
if (process.env.NODE_ENV !== "production") {
  // Issue a test user token and ensure the user exists
  app.get("/dev/user-token", async (req, res) => {
    try {
      const id = req.query.userId || "test_user_1";
      const name = req.query.name || "Dev User";
      const email = req.query.email || `${id}@dev.local`;
      const image = req.query.image || "https://via.placeholder.com/128";

      await User.findByIdAndUpdate(
        id,
        { _id: id, name, email, image },
        { upsert: true, new: true }
      );

      res.json({ success: true, token: generateToken(id), userId: id });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Seed a sample job under a seed company
  app.get("/dev/seed-job", async (req, res) => {
    try {
      let company = await Company.findOne({ email: "seed@company.com" });
      if (!company) {
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash("dev", salt);
        company = await Company.create({
          name: "Seed Co",
          email: "seed@company.com",
          image: "https://via.placeholder.com/128",
          password: hashPassword
        });
      } else {
        // Ensure the dev password is hashed for predictable login during testing
        if (!company.password || !company.password.startsWith("$2")) {
          const salt = await bcrypt.genSalt(10);
          const hashPassword = await bcrypt.hash("dev", salt);
          company.password = hashPassword;
          await company.save();
        }
      }
      const job = await Job.create({
        title: "Frontend Developer",
        description: "<p>Build delightful UIs.</p>",
        location: "Remote",
        category: "IT",
        level: "Junior",
        salary: 60000,
        visible: true,
        companyId: company._id,
        date: Date.now(),
        applicants: []
      });
      res.json({ success: true, job });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Apply programmatically for testing without file upload
  app.post("/dev/apply/:jobId", async (req, res) => {
    try {
      const { jobId } = req.params;
      const { userId } = req.query;
      if (!userId) {
        return res.status(400).json({ success: false, message: "userId required" });
      }
      const job = await Job.findById(jobId);
      if (!job) {
        return res.status(404).json({ success: false, message: "Job not found" });
      }
      const exists = job.applicants.find(a => a.user.toString() === userId.toString());
      if (exists) {
        return res.json({ success: true, message: "Already applied" });
      }
      job.applicants.push({ user: userId, status: "Pending", appliedAt: new Date(), resume: "" });
      await job.save();
      res.json({ success: true, message: "Applied" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
}

// 404 handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found" });
});

// Sentry error handler (MUST be after routes)
Sentry.setupExpressErrorHandler(app);

// Fallback error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal Server Error" });
});

// Port
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
