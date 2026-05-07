/**
 * Admin routes: dashboard, user management, job moderation, stats, audit
 */
const express = require("express");
const pool = require("../config/db");
const { authMiddleware } = require("../middleware/auth");
const rbac = require("../middleware/rbac");

const router = express.Router();

router.use(authMiddleware);
router.use(rbac("admin"));
//improved error logging and response handling in admin dashboard
// -------------------- GET APIS ----------------------------
//get /api/admin/dashboard
router.get("/dashboard", async (req, res) => {
  try {
    const users = await pool.query("SELECT COUNT(*) FROM users");
    const candidates = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'candidate'");
    const recruiters = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'recruiter'");
    const jobs = await pool.query("SELECT COUNT(*) FROM jobs WHERE status IN ('published', 'under_review')");
    const matches = await pool.query("SELECT COUNT(*) FROM applications");

    res.json({
      total_users: parseInt(users.rows[0].count),
      candidates: parseInt(candidates.rows[0].count),
      recruiters: parseInt(recruiters.rows[0].count),
      active_jobs: parseInt(jobs.rows[0].count),
      total_matches: parseInt(matches.rows[0].count),
    });
  } catch (err) {
    console.error("[ADMIN] Dashboard error:", err);
    res.status(500).json({ error: "Failed to load dashboard" });
  }
});

// GET /api/admin/users
router.get("/users", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, email, full_name, role, is_active, created_at FROM users ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// PUT /api/admin/users/:id/status
router.put("/users/:id/status", async (req, res) => {
  try {
    const { action } = req.body; // 'activate', 'suspend', 'delete'
    const userId = req.params.id;

    if (action === "activate") {
      await pool.query("UPDATE users SET is_active = true WHERE id = $1", [userId]);
    } else if (action === "suspend") {
      await pool.query("UPDATE users SET is_active = false WHERE id = $1", [userId]);
    } else if (action === "delete") {
      await pool.query("DELETE FROM users WHERE id = $1", [userId]);
    } else {
      return res.status(400).json({ error: "Invalid action. Use: activate, suspend, delete" });
    }

    // Audit log
    await pool.query(
      "INSERT INTO admin_audit_log (admin_user_id, action, target_type, target_id) VALUES ($1, $2, 'user', $3)",
      [req.user.id, action, userId]
    );

    res.json({ message: `User ${action}d successfully` });
  } catch (err) {
    console.error("[ADMIN] User status error:", err);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// GET /api/admin/jobs
router.get("/jobs", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT j.*, rp.company_name FROM jobs j
       LEFT JOIN recruiter_profiles rp ON rp.id = j.recruiter_id
       ORDER BY j.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

// PUT /api/admin/jobs/:id/status
router.put("/jobs/:id/status", async (req, res) => {
  try {
    const { status } = req.body; // 'published', 'rejected', 'closed'
    await pool.query("UPDATE jobs SET status = $1, updated_at = NOW() WHERE id = $2", [status, req.params.id]);

    await pool.query(
      "INSERT INTO admin_audit_log (admin_user_id, action, target_type, target_id, details) VALUES ($1, $2, 'job', $3, $4)",
      [req.user.id, `job_${status}`, req.params.id, JSON.stringify({ status })]
    );

    res.json({ message: `Job ${status} successfully` });
  } catch (err) {
    res.status(500).json({ error: "Failed to update job" });
  }
});

// GET /api/admin/stats
router.get("/stats", async (req, res) => {
  try {
    const avgResponse = await pool.query(
      "SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (reviewed_at - applied_at)) / 3600), 0) as avg_hours FROM applications WHERE reviewed_at IS NOT NULL"
    );
    const pendingUsers = await pool.query("SELECT COUNT(*) FROM users WHERE is_active = false");

    res.json({
      avg_response_time_hours: Math.round(parseFloat(avgResponse.rows[0].avg_hours) * 10) / 10,
      pending_users: parseInt(pendingUsers.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load stats" });
  }
});

// GET /api/admin/audit-log
router.get("/audit-log", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT al.*, u.full_name as admin_name FROM admin_audit_log al
       JOIN users u ON u.id = al.admin_user_id
       ORDER BY al.created_at DESC LIMIT 50`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch audit log" });
  }
});

module.exports = router;
