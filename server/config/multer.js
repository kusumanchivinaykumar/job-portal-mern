import multer from "multer";
import path from "path";
import os from "os";
import fs from "fs";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// storage (Cloudinary will read from temp file)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, os.tmpdir());
  },
  filename: (req, file, cb) => {
    // Sanitize filename: remove spaces and special chars, keep extension
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitizedName}`);
  }
});

// file filter — allow images for company "image" field and documents for "resume" field
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (file.fieldname === "image") {
    const allowedImageExts = [".png", ".jpg", ".jpeg", ".svg", ".webp"];
    if (!allowedImageExts.includes(ext)) {
      return cb(new Error("Image must be PNG/JPG/SVG/WEBP"), false);
    }
  } else if (file.fieldname === "resume") {
    const allowedDocExts = [".pdf", ".doc", ".docx"];
    if (!allowedDocExts.includes(ext)) {
      return cb(new Error("Resume must be PDF or DOC"), false);
    }
  }

  cb(null, true);
};

// multer upload
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB to accommodate resumes
  fileFilter
});

export default upload;
