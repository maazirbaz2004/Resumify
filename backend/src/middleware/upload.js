/**
 * Multer file upload middleware for resume uploads.
 * This middleware handles the physical storage and validation of resume files
 * before they are processed by the AI parsing engine.
 */
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure the storage directory exists to prevent upload failures
const uploadDir = process.env.UPLOAD_DIR || "./uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Defines where and how files are saved on the server.
const storage = multer.diskStorage({
  // Destination: Files are stored in the local 'uploads' directory
  destination: (req, file, cb) => cb(null, uploadDir),
  // Filename: Generates a unique string to prevent naming collisions
  // logic: timestamp + random number + original extension
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// Ensures that only valid document types are accepted for the 
// "Parse CV" and "Check Resume quality" use cases.
const fileFilter = (req, file, cb) => {
  const allowed = [".pdf", ".docx", ".doc"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else { // Reject files that cannot be processed by the Resume Parser
    cb(new Error("Only PDF and DOCX files are allowed"), false); 
  }
};

// Configures file size limits (5MB) to protect server resources
// while supporting the Candidate's "Upload CV" action.
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || "5242880") },
});

module.exports = upload;
