"""
FastAPI entry point for the AI Resume Analyzer service.
Run: uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
"""

import io
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List

from .engine import AIEngine
from .schemas import (
    AnalyzeResumeRequest, AnalyzeResumeResponse,
    SkillGapRequest,
    ATSCheckRequest, ATSCheckResponse,
    CareerPathRequest, CareerPathResponse,
    ParseJDRequest, ParseJDResponse,
    RankCandidatesRequest, RankedCandidate,
    CandidateMatchRequest, CandidateMatchResponse,
    InterviewQuestionsRequest, InterviewQuestion,
    HealthResponse,
)

# ── Global engine (loaded once at startup) ──
engine: AIEngine = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load AI engine on startup, cleanup on shutdown."""
    global engine
    print("[STARTUP] Loading AI engine...")
    engine = AIEngine()
    print("[STARTUP] AI engine ready.")
    yield
    print("[SHUTDOWN] Cleaning up.")


app = FastAPI(
    title="Resumify AI Service",
    description="AI-powered resume analysis, job matching, and recruiter tools",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health Check ──

@app.get("/api/ai/health", response_model=HealthResponse)
async def health():
    return HealthResponse(
        status="ok",
        classifier_loaded=engine.is_trained,
        job_db_loaded=engine.has_job_db,
        model="all-MiniLM-L6-v2",
    )


# ══════════════════════════════════════════════════════════
#  CANDIDATE ENDPOINTS
# ══════════════════════════════════════════════════════════

@app.post("/api/ai/analyze-resume", response_model=AnalyzeResumeResponse)
async def analyze_resume(req: AnalyzeResumeRequest):
    """Full resume analysis: role prediction, skills, quality, job matches."""
    result = engine.analyse(req.resume_text)
    if result is None:
        raise HTTPException(status_code=500, detail="Analysis failed — model may not be loaded")
    return result


@app.post("/api/ai/parse-resume")
async def parse_resume(file: UploadFile = File(...)):
    """Upload a PDF or DOCX resume file → extract text."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    ext = file.filename.lower().rsplit(".", 1)[-1] if "." in file.filename else ""
    content = await file.read()

    if ext == "pdf":
        try:
            import PyPDF2
            reader = PyPDF2.PdfReader(io.BytesIO(content))
            text = "\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"PDF parsing failed: {e}")
    elif ext in ("docx", "doc"):
        try:
            import docx
            doc = docx.Document(io.BytesIO(content))
            text = "\n".join(p.text for p in doc.paragraphs)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"DOCX parsing failed: {e}")
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}. Use PDF or DOCX.")

    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from file")

    return {"filename": file.filename, "text": text.strip(), "word_count": len(text.split())}


@app.post("/api/ai/skill-gap")
async def skill_gap(req: SkillGapRequest):
    """Compare candidate skills against required skills for a role."""
    result = engine.skill_gap(req.candidate_skills, req.required_skills)
    return result


@app.post("/api/ai/ats-check", response_model=ATSCheckResponse)
async def ats_check(req: ATSCheckRequest):
    """ATS compatibility check with optional JD keyword comparison."""
    return engine.ats_check(req.resume_text, req.jd_text)


@app.post("/api/ai/career-path", response_model=CareerPathResponse)
async def career_path(req: CareerPathRequest):
    """Career path simulation based on predicted role and current skills."""
    return engine.career_path(req.predicted_role, req.current_skills)


# ══════════════════════════════════════════════════════════
#  RECRUITER ENDPOINTS
# ══════════════════════════════════════════════════════════

@app.post("/api/ai/parse-jd", response_model=ParseJDResponse)
async def parse_jd(req: ParseJDRequest):
    """Parse a job description → extract skills, experience, education, seniority."""
    return engine.parse_jd(req.jd_text)


@app.post("/api/ai/rank-candidates", response_model=List[RankedCandidate])
async def rank_candidates(req: RankCandidatesRequest):
    """Rank multiple candidates against a job description."""
    if not req.resumes:
        raise HTTPException(status_code=400, detail="No resumes provided")
    return engine.rank_candidates(req.jd_text, req.resumes)


@app.post("/api/ai/candidate-match", response_model=CandidateMatchResponse)
async def candidate_match(req: CandidateMatchRequest):
    """Detailed match breakdown: one candidate vs one JD."""
    return engine.candidate_match(req.resume_text, req.jd_text)


@app.post("/api/ai/interview-questions", response_model=List[InterviewQuestion])
async def interview_questions(req: InterviewQuestionsRequest):
    """Generate AI-powered interview questions based on resume-JD gaps."""
    return engine.interview_questions(req.resume_text, req.jd_text)
