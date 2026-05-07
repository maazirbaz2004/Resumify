/**
 * Candidate routes: upload resume, dashboard, skill gap, ATS, career path
 */
const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const pool = require("../config/db");
const { authMiddleware } = require("../middleware/auth");
const rbac = require("../middleware/rbac");
const upload = require("../middleware/upload");

const router = express.Router();
const AI_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

// All candidate routes require auth + candidate role
router.use(authMiddleware);
router.use(rbac("candidate"));

// POST /api/candidate/upload-resume
router.post("/upload-resume", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("[CANDIDATE] File received:", req.file.originalname, req.file.size, "bytes");

    // Read file and send to AI service for text extraction using multipart
    const fileBuffer = fs.readFileSync(req.file.path);
    const boundary = "----FormBoundary" + Date.now();
    const filename = req.file.originalname;

    // Build multipart body manually (avoids form-data dependency)
    const header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: application/octet-stream\r\n\r\n`;
    const footer = `\r\n--${boundary}--\r\n`;
    const body = Buffer.concat([
      Buffer.from(header, "utf-8"),
      fileBuffer,
      Buffer.from(footer, "utf-8"),
    ]);

    const parseRes = await axios.post(`${AI_URL}/api/ai/parse-resume`, body, {
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": body.length,
      },
      maxContentLength: 10 * 1024 * 1024,
    });

    const resumeText = parseRes.data.text;
    console.log("[CANDIDATE] Text extracted:", resumeText.length, "chars");

    // Run full AI analysis
    const analysisRes = await axios.post(`${AI_URL}/api/ai/analyze-resume`, {
      resume_text: resumeText,
    });

    const analysis = analysisRes.data;
    console.log("[CANDIDATE] Analysis complete:", analysis.role, "confidence:", analysis.confidence);

    // Get candidate profile
    const profileRes = await pool.query(
      "SELECT id FROM candidate_profiles WHERE user_id = $1",
      [req.user.id]
    );
    const candidateId = profileRes.rows[0].id;

    // Update candidate profile with analysis results
    await pool.query(
      `UPDATE candidate_profiles SET
        resume_text = $1, resume_file_url = $2, resume_parsed_at = NOW(),
        predicted_role = $3, confidence = $4, quality_score = $5,
        skill_coverage = $6, job_match_score = $7
       WHERE id = $8`,
      [
        resumeText, req.file.path,
        analysis.role, analysis.confidence, analysis.quality.score,
        analysis.skills.technical.length + analysis.skills.soft.length,
        analysis.matches.length > 0 ? Math.round(analysis.matches[0].score) : 0,
        candidateId,
      ]
    );
//added candidate profile analysis
    // Save extracted skills
    await pool.query("DELETE FROM candidate_skills WHERE candidate_id = $1", [candidateId]);
    for (const skill of analysis.skills.technical) {
      await pool.query(
        "INSERT INTO candidate_skills (candidate_id, skill_name, skill_type) VALUES ($1, $2, 'technical')",
        [candidateId, skill]
      );
    }
    for (const skill of analysis.skills.soft) {
      await pool.query(
        "INSERT INTO candidate_skills (candidate_id, skill_name, skill_type) VALUES ($1, $2, 'soft')",
        [candidateId, skill]
      );
    }

    // Save analysis history
    await pool.query(
      "INSERT INTO analysis_history (candidate_id, analysis_type, result_data) VALUES ($1, 'full', $2)",
      [candidateId, JSON.stringify(analysis)]
    );

    res.json({ message: "Resume analyzed successfully", analysis });
  } catch (err) {
    console.error("[CANDIDATE] Upload error:", err.response?.data || err.message);
    res.status(500).json({ error: "Resume upload/analysis failed: " + (err.response?.data?.detail || err.message) });
  }
});

// DELETE /api/candidate/resume
router.delete("/resume", async (req, res) => {
  try {
    const profile = await pool.query("SELECT id FROM candidate_profiles WHERE user_id = $1", [req.user.id]);
    if (profile.rows.length === 0) return res.status(404).json({ error: "Profile not found" });
    const candidateId = profile.rows[0].id;
    
    // Clear resume details without deleting the profile or applications
    await pool.query(
      `UPDATE candidate_profiles SET 
       resume_text = NULL, resume_file_url = NULL, resume_parsed_at = NULL, 
       predicted_role = NULL, confidence = NULL, quality_score = NULL, 
       ats_score = NULL, skill_coverage = NULL, job_match_score = NULL 
       WHERE id = $1`, [candidateId]
    );
    // Clear skills and history
    await pool.query("DELETE FROM candidate_skills WHERE candidate_id = $1", [candidateId]);
    await pool.query("DELETE FROM analysis_history WHERE candidate_id = $1", [candidateId]);
    
    res.json({ message: "Resume discarded successfully" });
  } catch (err) {
    console.error("[CANDIDATE] Discard resume error:", err);
    res.status(500).json({ error: "Failed to discard resume" });
  }
});

// GET /api/candidate/dashboard
router.get("/dashboard", async (req, res) => {
  try {
    const profile = await pool.query(
      `SELECT cp.*, u.full_name, u.email FROM candidate_profiles cp
       JOIN users u ON u.id = cp.user_id WHERE cp.user_id = $1`,
      [req.user.id]
    );
    if (profile.rows.length === 0) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const p = profile.rows[0];
    const skills = await pool.query(
      "SELECT skill_name, skill_type FROM candidate_skills WHERE candidate_id = $1",
      [p.id]
    );

    // Get latest analysis
    const history = await pool.query(
      "SELECT result_data FROM analysis_history WHERE candidate_id = $1 ORDER BY created_at DESC LIMIT 1",
      [p.id]
    );

    res.json({
      profile: {
        name: p.full_name, email: p.email, phone: p.phone, location: p.location,
        predicted_role: p.predicted_role, confidence: p.confidence,
        quality_score: p.quality_score, ats_score: p.ats_score,
        skill_coverage: p.skill_coverage, job_match_score: p.job_match_score,
      },
      skills: {
        technical: skills.rows.filter(s => s.skill_type === "technical").map(s => s.skill_name),
        soft: skills.rows.filter(s => s.skill_type === "soft").map(s => s.skill_name),
      },
      latest_analysis: history.rows[0]?.result_data || null,
    });
  } catch (err) {
    console.error("[CANDIDATE] Dashboard error:", err);
    res.status(500).json({ error: "Failed to load dashboard" });
  }
});
//ATS check implemented properly 
// GET /api/candidate/ats-check
router.get("/ats-check", async (req, res) => {
  try {
    const profile = await pool.query(
      "SELECT resume_text FROM candidate_profiles WHERE user_id = $1",
      [req.user.id]
    );
    if (!profile.rows[0]?.resume_text) {
      return res.status(400).json({ error: "Upload a resume first" });
    }

    const atsRes = await axios.post(`${AI_URL}/api/ai/ats-check`, {
      resume_text: profile.rows[0].resume_text,
      jd_text: req.query.jd_text || "",
    });

    // Update ATS score in profile
    await pool.query(
      "UPDATE candidate_profiles SET ats_score = $1 WHERE user_id = $2",
      [atsRes.data.ats_score, req.user.id]
    );

    res.json(atsRes.data);
  } catch (err) {
    console.error("[CANDIDATE] ATS error:", err.message);
    res.status(500).json({ error: "ATS check failed" });
  }
});

// POST, candidate skill gap added
router.post("/skill-gap", async (req, res) => {
  try {
    const { target_role, required_skills } = req.body;
    const skills = await pool.query(
      `SELECT skill_name, skill_type FROM candidate_skills cs
       JOIN candidate_profiles cp ON cp.id = cs.candidate_id
       WHERE cp.user_id = $1`,
      [req.user.id]
    );
    const candidate_skills = {
      technical: skills.rows.filter(s => s.skill_type === "technical").map(s => s.skill_name),
      soft: skills.rows.filter(s => s.skill_type === "soft").map(s => s.skill_name),
    };

    const gapRes = await axios.post(`${AI_URL}/api/ai/skill-gap`, {
      candidate_skills,
      required_skills: required_skills || [],
    });
    res.json(gapRes.data);
  } catch (err) {
    console.error("[CANDIDATE] Skill gap error:", err.message);
    res.status(500).json({ error: "Skill gap analysis failed" });
  }
});
//fetching career path
// GET /api/candidate/career-path
router.get("/career-path", async (req, res) => {
  try {
    const profile = await pool.query(
      "SELECT predicted_role FROM candidate_profiles WHERE user_id = $1",
      [req.user.id]
    );
    const skills = await pool.query(
      `SELECT skill_name FROM candidate_skills cs
       JOIN candidate_profiles cp ON cp.id = cs.candidate_id
       WHERE cp.user_id = $1 AND cs.skill_type = 'technical'`,
      [req.user.id]
    );

    const pathRes = await axios.post(`${AI_URL}/api/ai/career-path`, {
      predicted_role: profile.rows[0]?.predicted_role || "Software Developer",
      current_skills: skills.rows.map(s => s.skill_name),
    });
    res.json(pathRes.data);
  } catch (err) {
    console.error("[CANDIDATE] Career path error:", err.message);
    res.status(500).json({ error: "Career path simulation failed" });
  }
});

// GET /api/candidate/history
router.get("/history", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ah.analysis_type, ah.result_data, ah.created_at
       FROM analysis_history ah
       JOIN candidate_profiles cp ON cp.id = ah.candidate_id
       WHERE cp.user_id = $1 ORDER BY ah.created_at DESC LIMIT 10`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("[CANDIDATE] History error:", err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

// GET /api/candidate/job-matches — Match candidate against REAL recruiter-posted jobs
router.get("/job-matches", async (req, res) => {
  try {
    // Get candidate resume
    const profile = await pool.query(
      "SELECT resume_text FROM candidate_profiles WHERE user_id = $1",
      [req.user.id]
    );
    if (!profile.rows[0]?.resume_text) {
      return res.status(400).json({ error: "Upload a resume first" });
    }
    const resumeText = profile.rows[0].resume_text;

    // Get all published jobs from DB
    const jobsRes = await pool.query(
      `SELECT j.id, j.title, j.description, j.company, j.location, j.experience_level,
              j.required_skills, j.soft_skills, rp.company_name
       FROM jobs j
       LEFT JOIN recruiter_profiles rp ON rp.id = j.recruiter_id
       WHERE j.status = 'published'
       ORDER BY j.created_at DESC LIMIT 20`
    );

    if (jobsRes.rows.length === 0) {
      return res.json([]);
    }

    // Match candidate against each real job using AI
    const matches = [];
    for (const job of jobsRes.rows) {
      try {
        const matchRes = await axios.post(`${AI_URL}/api/ai/candidate-match`, {
          resume_text: resumeText,
          jd_text: job.description,
        });

        matches.push({
          job_id: job.id,
          title: job.title,
          company: job.company_name || job.company || "Company",
          location: job.location || "Remote",
          experience_level: job.experience_level || "",
          match_score: matchRes.data.overall_score || 0,
          breakdown: matchRes.data.breakdown || {},
          matched_skills: matchRes.data.matched_skills || [],
          missing_skills: matchRes.data.missing_skills || [],
          explanation: matchRes.data.explanation || "",
          required_skills: job.required_skills || [],
        });
      } catch (aiErr) {
        console.error(`[CANDIDATE] Match failed for job ${job.id}:`, aiErr.message);
      }
    }

    // Sort by match score descending
    matches.sort((a, b) => b.match_score - a.match_score);

    res.json(matches);
  } catch (err) {
    console.error("[CANDIDATE] Job matches error:", err.message);
    res.status(500).json({ error: "Job matching failed" });
  }
});

// POST /api/candidate/apply — Apply to a real job
router.post("/apply", async (req, res) => {
  try {
    const { job_id } = req.body;
    if (!job_id) return res.status(400).json({ error: "job_id is required" });

    // Get candidate profile
    const profile = await pool.query(
      "SELECT id, resume_text FROM candidate_profiles WHERE user_id = $1",
      [req.user.id]
    );
    if (profile.rows.length === 0) return res.status(404).json({ error: "Profile not found" });
    const candidateId = profile.rows[0].id;
    const resumeText = profile.rows[0].resume_text;

    // Check if already applied
    const existing = await pool.query(
      "SELECT id FROM applications WHERE candidate_id = $1 AND job_id = $2",
      [candidateId, job_id]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Already applied to this job" });
    }

    // Get job description to compute match score
    const job = await pool.query("SELECT description FROM jobs WHERE id = $1", [job_id]);
    if (job.rows.length === 0) return res.status(404).json({ error: "Job not found" });

    let matchScore = 0, skillPct = 0, matchedSkills = [], missingSkills = [];
    if (resumeText) {
      try {
        const matchRes = await axios.post(`${AI_URL}/api/ai/candidate-match`, {
          resume_text: resumeText,
          jd_text: job.rows[0].description,
        });
        matchScore = matchRes.data.overall_score || 0;
        skillPct = matchRes.data.breakdown?.skills || 0;
        matchedSkills = matchRes.data.matched_skills || [];
        missingSkills = matchRes.data.missing_skills || [];
      } catch { /* AI failed, proceed with 0 scores */ }
    }

    await pool.query(
      `INSERT INTO applications (candidate_id, job_id, match_score, skill_match_pct, matched_skills, missing_skills, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
      [candidateId, job_id, matchScore, skillPct, matchedSkills, missingSkills]
    );

    res.status(201).json({ message: "Application submitted successfully" });
  } catch (err) {
    console.error("[CANDIDATE] Apply error:", err.message);
    res.status(500).json({ error: "Application failed" });
  }
});

// GET /api/candidate/applications — List candidate's applications
router.get("/applications", async (req, res) => {
  try {
    const profile = await pool.query(
      "SELECT id FROM candidate_profiles WHERE user_id = $1",
      [req.user.id]
    );
    if (profile.rows.length === 0) return res.json([]);

    const apps = await pool.query(
      `SELECT a.*, j.title, j.company, j.location, rp.company_name
       FROM applications a
       JOIN jobs j ON j.id = a.job_id
       LEFT JOIN recruiter_profiles rp ON rp.id = j.recruiter_id
       WHERE a.candidate_id = $1
       ORDER BY a.applied_at DESC`,
      [profile.rows[0].id]
    );
    res.json(apps.rows);
  } catch (err) {
    console.error("[CANDIDATE] Applications error:", err.message);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
});

module.exports = router;
