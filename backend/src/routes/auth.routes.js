/**
 * Authentication routes: register, login, me
 */
const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const { generateToken, authMiddleware } = require("../middleware/auth");

const router = express.Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { email, password, full_name, role } = req.body;

    if (!email || !password || !full_name || !role) {
      return res.status(400).json({ error: "All fields required: email, password, full_name, role" });
    }
    if (!["candidate", "recruiter"].includes(role)) {
      return res.status(400).json({ error: "Role must be 'candidate' or 'recruiter'" });
    }

    // Check if email exists
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role) 
       VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, role, created_at`,
      [email, password_hash, full_name, role]
    );

    const user = result.rows[0];

    // Create role-specific profile
    if (role === "candidate") {
      await pool.query("INSERT INTO candidate_profiles (user_id) VALUES ($1)", [user.id]);
    } else if (role === "recruiter") {
      const company = req.body.company_name || "";
      await pool.query(
        "INSERT INTO recruiter_profiles (user_id, company_name) VALUES ($1, $2)",
        [user.id, company]
      );
    }

    const token = generateToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    console.error("[AUTH] Register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const result = await pool.query(
      "SELECT id, email, password_hash, full_name, role, is_active FROM users WHERE email = $1",
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0];
    if (!user.is_active) {
      return res.status(403).json({ error: "Account is suspended" });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = generateToken(user);
    const { password_hash, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (err) {
    console.error("[AUTH] Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// GET /api/auth/me
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, email, full_name, role, avatar_url, is_active, created_at FROM users WHERE id = $1",
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("[AUTH] Me error:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

module.exports = router;
