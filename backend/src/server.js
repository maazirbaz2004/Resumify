/**
 * Resumify Backend — Express server entry point.
 * Run: npm run dev
 */
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ── Routes ──
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/candidate", require("./routes/candidate.routes"));
app.use("/api/recruiter", require("./routes/recruiter.routes"));
app.use("/api/admin", require("./routes/admin.routes"));

// ── Health check ──
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "resumify-backend", port: PORT });
});

// ── 404 handler ──
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ── Global error handler ──
app.use((err, req, res, next) => {
  console.error("[ERROR]", err.message);
  if (err.name === "MulterError") {
    return res.status(400).json({ error: `File upload error: ${err.message}` });
  }
  res.status(500).json({ error: "Internal server error" });
});

// ── Start ──
app.listen(PORT, () => {
  console.log(`\n  🚀 Resumify Backend running on http://localhost:${PORT}`);
  console.log(`  📡 AI Service expected at ${process.env.AI_SERVICE_URL || "http://localhost:8000"}`);
  console.log(`  🗄️  Database: ${process.env.DB_NAME || "resumify"}@${process.env.DB_HOST || "localhost"}\n`);
});
