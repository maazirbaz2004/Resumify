/**
 * Recruiter routes: dashboard, jobs CRUD, candidates, ranking, analytics
 */
const express = require("express");
const axios = require("axios");
const pool = require("../config/db");
const { authMiddleware } = require("../middleware/auth");
const rbac = require("../middleware/rbac");

const router = express.Router();
const AI_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

router.use(authMiddleware);
router.use(rbac("recruiter"));

// GET /api/recruiter/dashboard
router.get("/dashboard", async (req, res) => {
  try {
    const rp = await pool.query("SELECT id, company_name FROM recruiter_profiles WHERE user_id = $1", [req.user.id]);
    if (rp.rows.length === 0) return res.status(404).json({ error: "Recruiter profile not found" });
    const recruiterId = rp.rows[0].id;

    const totalApps = await pool.query(
      "SELECT COUNT(*) FROM applications a JOIN jobs j ON j.id = a.job_id WHERE j.recruiter_id = $1", [recruiterId]
    );
    const shortlisted = await pool.query(
      "SELECT COUNT(*) FROM applications a JOIN jobs j ON j.id = a.job_id WHERE j.recruiter_id = $1 AND a.status = 'shortlisted'", [recruiterId]
    );
    const openJobs = await pool.query(
      "SELECT COUNT(*) FROM jobs WHERE recruiter_id = $1 AND status IN ('published', 'under_review')", [recruiterId]
    );
    const avgMatch = await pool.query(
      "SELECT COALESCE(AVG(a.match_score), 0) as avg FROM applications a JOIN jobs j ON j.id = a.job_id WHERE j.recruiter_id = $1", [recruiterId]
    );

    const recentApps = await pool.query(
      `SELECT a.*, u.full_name, cp.predicted_role, j.title as job_title FROM applications a
       JOIN jobs j ON j.id = a.job_id
       JOIN candidate_profiles cp ON cp.id = a.candidate_id
       JOIN users u ON u.id = cp.user_id
       WHERE j.recruiter_id = $1
       ORDER BY a.applied_at DESC LIMIT 10`, [recruiterId]
    );

    // Skill distribution across applicants
    const skillDist = await pool.query(
      `SELECT cs.skill_name, COUNT(*) as count FROM candidate_skills cs
       JOIN candidate_profiles cp ON cp.id = cs.candidate_id
       JOIN applications a ON a.candidate_id = cp.id
       JOIN jobs j ON j.id = a.job_id
       WHERE j.recruiter_id = $1 AND cs.skill_type = 'technical'
       GROUP BY cs.skill_name ORDER BY count DESC LIMIT 10`, [recruiterId]
    );

    res.json({
      kpis: {
        total_applications: parseInt(totalApps.rows[0].count),
        shortlisted: parseInt(shortlisted.rows[0].count),
        open_positions: parseInt(openJobs.rows[0].count),
        avg_match_score: Math.round(parseFloat(avgMatch.rows[0].avg)),
      },
      recent_applications: recentApps.rows,
      skill_distribution: skillDist.rows,
      company: rp.rows[0].company_name,
    });
  } catch (err) {
    console.error("[RECRUITER] Dashboard error:", err);
    res.status(500).json({ error: "Failed to load dashboard" });
  }
});

// POST /api/recruiter/jobs — Create job
router.post("/jobs", async (req, res) => {
  try {
    const rp = await pool.query("SELECT id FROM recruiter_profiles WHERE user_id = $1", [req.user.id]);
    const recruiterId = rp.rows[0].id;
    const { title, description, company, location, job_type, experience_level, education, seniority, salary_range, required_skills, soft_skills } = req.body;

    const result = await pool.query(
      `INSERT INTO jobs (recruiter_id, title, description, company, location, job_type, experience_level, education, seniority, salary_range, required_skills, soft_skills, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'published') RETURNING *`,
      [recruiterId, title, description, company || "", location || "", job_type || "Full-time",
       experience_level || "", education || "", seniority || "Mid", salary_range || "",
       required_skills || [], soft_skills || []]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("[RECRUITER] Create job error:", err);
    res.status(500).json({ error: "Failed to create job" });
  }
});

// GET /api/recruiter/jobs — List recruiter's jobs
router.get("/jobs", async (req, res) => {
  try {
    const rp = await pool.query("SELECT id FROM recruiter_profiles WHERE user_id = $1", [req.user.id]);
    const result = await pool.query(
      "SELECT * FROM jobs WHERE recruiter_id = $1 ORDER BY created_at DESC", [rp.rows[0].id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("[RECRUITER] List jobs error:", err);
    res.status(500).json({ error: "Failed to list jobs" });
  }
});

// POST /api/recruiter/jobs/:id/parse-jd — AI parse job description
router.post("/jobs/:id/parse-jd", async (req, res) => {
  try {
    const job = await pool.query("SELECT description FROM jobs WHERE id = $1", [req.params.id]);
    if (job.rows.length === 0) return res.status(404).json({ error: "Job not found" });

    const parseRes = await axios.post(`${AI_URL}/api/ai/parse-jd`, {
      jd_text: job.rows[0].description,
    });

    // Update job with parsed data
    const parsed = parseRes.data;
    await pool.query(
      `UPDATE jobs SET required_skills = $1, soft_skills = $2, experience_level = $3, education = $4, seniority = $5
       WHERE id = $6`,
      [parsed.required_skills, parsed.soft_skills, parsed.experience_level, parsed.education, parsed.seniority, req.params.id]
    );

    res.json(parsed);
  } catch (err) {
    console.error("[RECRUITER] Parse JD error:", err.message);
    res.status(500).json({ error: "JD parsing failed" });
  }
});

// GET /api/recruiter/jobs/:id/candidates — Ranked applicants for a job
router.get("/jobs/:id/candidates", async (req, res) => {
  try {
    const job = await pool.query("SELECT * FROM jobs WHERE id = $1", [req.params.id]);
    if (job.rows.length === 0) return res.status(404).json({ error: "Job not found" });

    // Get only candidates who have APPLIED to this job
    const applicants = await pool.query(
      `SELECT cp.id, u.full_name as name, cp.resume_text, a.status, a.match_score, 
              a.skill_match_pct, a.matched_skills, a.missing_skills, a.applied_at
       FROM applications a
       JOIN candidate_profiles cp ON cp.id = a.candidate_id
       JOIN users u ON u.id = cp.user_id
       WHERE a.job_id = $1
       ORDER BY a.match_score DESC NULLS LAST`,
      [req.params.id]
    );

    if (applicants.rows.length === 0) return res.json([]);

    // If we have applicants with resumes, re-rank them with AI for fresh scores
    const withResumes = applicants.rows.filter(a => a.resume_text);
    if (withResumes.length > 0) {
      try {
        const resumes = withResumes.map(c => ({
          id: c.id, name: c.name, resume_text: c.resume_text,
        }));

        const rankRes = await axios.post(`${AI_URL}/api/ai/rank-candidates`, {
          jd_text: job.rows[0].description,
          resumes,
        });

        // Update application records with fresh AI scores
        for (const ranked of rankRes.data) {
          await pool.query(
            `UPDATE applications SET match_score = $1, skill_match_pct = $2, matched_skills = $3, missing_skills = $4
             WHERE candidate_id = $5 AND job_id = $6`,
            [ranked.match_score, ranked.skill_match_pct,
             ranked.matched_skills || [], ranked.missing_skills || [],
             ranked.candidate_id, req.params.id]
          );
        }

        // Return AI-ranked results with DB status
        const result = rankRes.data.map(r => {
          const app = applicants.rows.find(a => a.id === r.candidate_id);
          return { ...r, status: app?.status || "pending", applied_at: app?.applied_at };
        });
        return res.json(result);
      } catch (aiErr) {
        console.error("[RECRUITER] AI ranking failed, using DB scores:", aiErr.message);
      }
    }

    // Fallback: return DB-stored scores if AI fails
    const result = applicants.rows.map((a, i) => ({
      candidate_id: a.id,
      name: a.name,
      rank: i + 1,
      match_score: Math.round(a.match_score || 0),
      skill_match_pct: Math.round(a.skill_match_pct || 0),
      matched_skills: a.matched_skills || [],
      missing_skills: a.missing_skills || [],
      status: a.status,
      applied_at: a.applied_at,
    }));
    res.json(result);
  } catch (err) {
    console.error("[RECRUITER] Rank candidates error:", err.message);
    res.status(500).json({ error: "Candidate ranking failed" });
  }
});

// GET /api/recruiter/candidates/:id — Full candidate profile + match
router.get("/candidates/:id", async (req, res) => {
  try {
    const { job_id } = req.query;
    const candidate = await pool.query(
      `SELECT cp.*, u.full_name, u.email FROM candidate_profiles cp
       JOIN users u ON u.id = cp.user_id WHERE cp.id = $1`, [req.params.id]
    );
    if (candidate.rows.length === 0) return res.status(404).json({ error: "Candidate not found" });
    const c = candidate.rows[0];

    const skills = await pool.query(
      "SELECT skill_name, skill_type FROM candidate_skills WHERE candidate_id = $1", [c.id]
    );

    let matchData = null, questions = null;
    if (job_id && c.resume_text) {
      const job = await pool.query("SELECT description FROM jobs WHERE id = $1", [job_id]);
      if (job.rows.length > 0) {
        const [matchRes, questionsRes] = await Promise.all([
          axios.post(`${AI_URL}/api/ai/candidate-match`, {
            resume_text: c.resume_text, jd_text: job.rows[0].description,
          }),
          axios.post(`${AI_URL}/api/ai/interview-questions`, {
            resume_text: c.resume_text, jd_text: job.rows[0].description,
          }),
        ]);
        matchData = matchRes.data;
        questions = questionsRes.data;
      }
    }

    res.json({
      profile: { name: c.full_name, email: c.email, phone: c.phone, location: c.location,
                 predicted_role: c.predicted_role, quality_score: c.quality_score },
      skills: {
        technical: skills.rows.filter(s => s.skill_type === "technical").map(s => s.skill_name),
        soft: skills.rows.filter(s => s.skill_type === "soft").map(s => s.skill_name),
      },
      match: matchData,
      interview_questions: questions,
    });
  } catch (err) {
    console.error("[RECRUITER] Candidate profile error:", err.message);
    res.status(500).json({ error: "Failed to load candidate" });
  }
});

// POST /api/recruiter/candidates/:id/shortlist
router.post("/candidates/:id/shortlist", async (req, res) => {
  try {
    const { job_id } = req.body;
    // Upsert: create application if not exists, then update status
    await pool.query(
      `INSERT INTO applications (candidate_id, job_id, status, reviewed_at)
       VALUES ($1, $2, 'shortlisted', NOW())
       ON CONFLICT (candidate_id, job_id) DO UPDATE SET status = 'shortlisted', reviewed_at = NOW()`,
      [req.params.id, job_id]
    );
    res.json({ message: "Candidate shortlisted" });
  } catch (err) {
    console.error("[RECRUITER] Shortlist error:", err.message);
    res.status(500).json({ error: "Failed to shortlist" });
  }
});

// POST /api/recruiter/candidates/:id/reject
router.post("/candidates/:id/reject", async (req, res) => {
  try {
    const { job_id } = req.body;
    await pool.query(
      `INSERT INTO applications (candidate_id, job_id, status, reviewed_at)
       VALUES ($1, $2, 'rejected', NOW())
       ON CONFLICT (candidate_id, job_id) DO UPDATE SET status = 'rejected', reviewed_at = NOW()`,
      [req.params.id, job_id]
    );
    res.json({ message: "Candidate rejected" });
  } catch (err) {
    console.error("[RECRUITER] Reject error:", err.message);
    res.status(500).json({ error: "Failed to reject" });
  }
});

// GET /api/recruiter/analytics
router.get("/analytics", async (req, res) => {
  try {
    const rp = await pool.query("SELECT id FROM recruiter_profiles WHERE user_id = $1", [req.user.id]);
    const recruiterId = rp.rows[0].id;

    const funnel = await pool.query(
      `SELECT a.status, COUNT(*) as count FROM applications a
       JOIN jobs j ON j.id = a.job_id WHERE j.recruiter_id = $1 GROUP BY a.status`, [recruiterId]
    );

    const skillDemand = await pool.query(
      `SELECT unnest(required_skills) as skill, COUNT(*) as count
       FROM jobs WHERE recruiter_id = $1 GROUP BY skill ORDER BY count DESC LIMIT 10`, [recruiterId]
    );

    res.json({ hiring_funnel: funnel.rows, skill_demand: skillDemand.rows });
  } catch (err) {
    console.error("[RECRUITER] Analytics error:", err);
    res.status(500).json({ error: "Failed to load analytics" });
  }
});

module.exports = router;
