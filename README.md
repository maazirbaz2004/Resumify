# Resumify AI — Smart Recruitment Platform

Resumify is a full-stack, AI-powered recruitment platform designed to bridge the gap between candidates and recruiters. It uses NLP and Machine Learning to parse resumes, analyze skill gaps, and rank candidates against job descriptions automatically.

## 🚀 Features

### For Candidates
- **Resume Parsing & Analysis:** Upload a PDF/DOCX resume to instantly get an AI breakdown of your skills, weaknesses, and predicted roles.
- **ATS Compatibility Check:** See how well your resume scores against Applicant Tracking Systems.
- **Skill Gap Analysis:** Compare your current skills against your desired career path.
- **Career Trajectory:** Visualize the steps needed to reach senior roles.
- **Smart Job Matching:** Automatically get matched and scored against real jobs posted by recruiters.

### For Recruiters
- **AI Job Description Parser:** Paste a job description and let AI extract the core requirements and skills.
- **Automated Candidate Ranking:** Instantly rank all applicants for a specific job based on a deep semantic match with the JD.
- **Candidate Match Profiles:** View detailed breakdowns of why a candidate matches, their missing skills, and auto-generated interview questions.
- **Blind Mode:** Toggle names off during ranking to reduce unconscious bias.
- **Analytics Dashboard:** Visualize the hiring funnel and most demanded skills across all applicants.

### For Admins
- **User Management:** Activate, suspend, or delete users (both candidates and recruiters).
- **Job Moderation:** Approve, reject, or close job postings to maintain platform quality.
- **Audit Logging:** Every administrative action is automatically logged with timestamps and details.

---

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, Vite, Framer Motion, Recharts
- **Backend:** Node.js, Express, PostgreSQL
- **AI Engine:** Python, FastAPI, SpaCy, Scikit-Learn, PyPDF2
- **Authentication:** JWT, bcryptjs

---

## 📦 Project Structure

```
├── ai-resume-analyzer/   # Python FastAPI service for AI processing
├── backend/              # Node.js/Express server & PostgreSQL queries
├── frontend/             # React (Vite) client
└── README.md
```

---

## ⚙️ Local Setup Instructions

### 1. Database Setup (PostgreSQL)
Ensure you have PostgreSQL installed and running. Create a database named `resumify`.
Default credentials used in `.env`: user `postgres`, password `postgres`.

### 2. AI Engine Setup (Terminal 1)
```bash
cd ai-resume-analyzer
python -m venv .venv
# Activate venv:
# Windows: .venv\Scripts\activate
# Mac/Linux: source .venv/bin/activate

pip install -r requirements.txt
python -m spacy download en_core_web_md
uvicorn api.main:app --reload
```
*Runs on `http://localhost:8000`*

### 3. Backend Setup (Terminal 2)
```bash
cd backend
npm install

# Create the .env file
echo "PORT=5000" > .env
echo "DB_USER=postgres" >> .env
echo "DB_PASSWORD=postgres" >> .env
echo "DB_HOST=localhost" >> .env
echo "DB_PORT=5432" >> .env
echo "DB_NAME=resumify" >> .env
echo "JWT_SECRET=supersecret123" >> .env
echo "AI_SERVICE_URL=http://localhost:8000" >> .env

# Run database migrations (This creates tables and the default Admin account)
npm run db:migrate

npm run dev
```
*Runs on `http://localhost:5000`*

### 4. Frontend Setup (Terminal 3)
```bash
cd frontend
npm install
npm run dev
```
*Runs on `http://localhost:5173`*

---

## 🔑 Default Credentials

After running `npm run db:migrate` in the backend, the following admin account is automatically created:
- **Email:** `admin@resumify.com`
- **Password:** `admin123`
- **Login URL:** `http://localhost:5173/admin/login`

To create Candidate or Recruiter accounts, simply use the Sign Up pages on the platform.
