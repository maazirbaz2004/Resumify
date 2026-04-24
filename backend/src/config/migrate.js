/**
 * Database migration script — creates all tables.
 * Run: node src/config/migrate.js
 */
const pool = require("./db");

const migration = `
-- ══════════════════════════════════════════
--  RESUMIFY DATABASE SCHEMA
-- ══════════════════════════════════════════

-- Users & Authentication
CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  full_name       VARCHAR(255) NOT NULL,
  role            VARCHAR(20) NOT NULL CHECK (role IN ('candidate', 'recruiter', 'admin')),
  avatar_url      TEXT,
  is_active       BOOLEAN DEFAULT true,
  email_verified  BOOLEAN DEFAULT false,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- Candidate-specific profile
CREATE TABLE IF NOT EXISTS candidate_profiles (
  id              SERIAL PRIMARY KEY,
  user_id         INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  phone           VARCHAR(20),
  location        VARCHAR(255),
  resume_text     TEXT,
  resume_file_url TEXT,
  resume_parsed_at TIMESTAMP,
  predicted_role  VARCHAR(255),
  confidence      FLOAT,
  quality_score   INT,
  ats_score       INT,
  skill_coverage  INT,
  job_match_score INT
);

-- Recruiter-specific profile
CREATE TABLE IF NOT EXISTS recruiter_profiles (
  id              SERIAL PRIMARY KEY,
  user_id         INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  company_name    VARCHAR(255),
  company_logo    TEXT,
  industry        VARCHAR(255),
  phone           VARCHAR(20)
);

-- Skills extracted per candidate
CREATE TABLE IF NOT EXISTS candidate_skills (
  id              SERIAL PRIMARY KEY,
  candidate_id    INT REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  skill_name      VARCHAR(255) NOT NULL,
  skill_type      VARCHAR(20) CHECK (skill_type IN ('technical', 'soft')),
  proficiency     INT DEFAULT 0
);

-- Job postings by recruiters
CREATE TABLE IF NOT EXISTS jobs (
  id              SERIAL PRIMARY KEY,
  recruiter_id    INT REFERENCES recruiter_profiles(id) ON DELETE CASCADE,
  title           VARCHAR(255) NOT NULL,
  description     TEXT NOT NULL,
  company         VARCHAR(255),
  location        VARCHAR(255),
  job_type        VARCHAR(50),
  experience_level VARCHAR(50),
  education       VARCHAR(255),
  seniority       VARCHAR(50),
  salary_range    VARCHAR(100),
  required_skills TEXT[],
  soft_skills     TEXT[],
  status          VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'under_review', 'closed', 'rejected')),
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- Applications / candidate-job matches
CREATE TABLE IF NOT EXISTS applications (
  id              SERIAL PRIMARY KEY,
  candidate_id    INT REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  job_id          INT REFERENCES jobs(id) ON DELETE CASCADE,
  match_score     FLOAT,
  skill_match_pct FLOAT,
  matched_skills  TEXT[],
  missing_skills  TEXT[],
  status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'shortlisted', 'rejected', 'interviewed', 'offered', 'hired')),
  applied_at      TIMESTAMP DEFAULT NOW(),
  reviewed_at     TIMESTAMP,
  UNIQUE(candidate_id, job_id)
);

-- Analysis history
CREATE TABLE IF NOT EXISTS analysis_history (
  id              SERIAL PRIMARY KEY,
  candidate_id    INT REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  analysis_type   VARCHAR(50),
  input_data      JSONB,
  result_data     JSONB,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- Admin audit log
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id              SERIAL PRIMARY KEY,
  admin_user_id   INT REFERENCES users(id),
  action          VARCHAR(100),
  target_type     VARCHAR(50),
  target_id       INT,
  details         JSONB,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id              SERIAL PRIMARY KEY,
  user_id         INT REFERENCES users(id) ON DELETE CASCADE,
  title           VARCHAR(255),
  message         TEXT,
  type            VARCHAR(50) DEFAULT 'info',
  is_read         BOOLEAN DEFAULT false,
  link            VARCHAR(255),
  created_at      TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_candidate_skills_candidate ON candidate_skills(candidate_id);
CREATE INDEX IF NOT EXISTS idx_jobs_recruiter ON jobs(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_applications_candidate ON applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password_hash, full_name, role, is_active, email_verified)
VALUES ('admin@resumify.com', '$2a$10$8K1p/a0dL1LXMIgoEDFrwOfMQEBJPzGnUQ1G5p5Y5Y5Y5Y5Y5Y5Y5', 'System Admin', 'admin', true, true)
ON CONFLICT (email) DO NOTHING;
`;

async function migrate() {
  const bcrypt = require("bcryptjs");
  try {
    console.log("[MIGRATE] Running database migration...");
    await pool.query(migration);

    // Create admin user with real bcrypt hash
    const adminHash = await bcrypt.hash("admin123", 10);
    await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role, is_active, email_verified)
       VALUES ('admin@resumify.com', $1, 'System Admin', 'admin', true, true)
       ON CONFLICT (email) DO UPDATE SET password_hash = $1`,
      [adminHash]
    );

    console.log("[MIGRATE] ✅ All tables created successfully!");
    console.log("[MIGRATE] 🔑 Admin: admin@resumify.com / admin123");
  } catch (err) {
    console.error("[MIGRATE] ❌ Migration failed:", err.message);
  } finally {
    await pool.end();
  }
}

migrate();
