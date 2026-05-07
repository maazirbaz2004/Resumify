"""
Pydantic request/response schemas for the FastAPI AI service.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict


# ── Request Models ──

class AnalyzeResumeRequest(BaseModel):
    resume_text: str = Field(..., min_length=50, description="Raw resume text")

class SkillGapRequest(BaseModel):
    candidate_skills: Dict[str, List[str]] = Field(..., description="{'technical': [...], 'soft': [...]}")
    required_skills: List[str] = Field(..., description="List of required skill names")

class ATSCheckRequest(BaseModel):
    resume_text: str = Field(..., min_length=50)
    jd_text: str = Field("", description="Optional JD for keyword comparison")

class CareerPathRequest(BaseModel):
    predicted_role: str
    current_skills: List[str] = Field(default_factory=list)

class ParseJDRequest(BaseModel):
    jd_text: str = Field(..., min_length=20)

class RankCandidatesRequest(BaseModel):
    jd_text: str = Field(..., min_length=20)
    resumes: List[Dict] = Field(..., description="[{'id': 1, 'name': '...', 'resume_text': '...'}, ...]")

class CandidateMatchRequest(BaseModel):
    resume_text: str = Field(..., min_length=50)
    jd_text: str = Field(..., min_length=20)

class InterviewQuestionsRequest(BaseModel):
    resume_text: str = Field(..., min_length=50)
    jd_text: str = Field(..., min_length=20)


# ── Response Models ──

class SkillsResponse(BaseModel):
    technical: List[str]
    soft: List[str]

class QualityResponse(BaseModel):
    score: int
    max: int
    grade: str
    tips: List[str]

class JobMatchResponse(BaseModel):
    title: str
    company: str
    description: str
    score: float
    gap: Dict

class AnalyzeResumeResponse(BaseModel):
    role: str
    confidence: float
    alt_roles: List[Dict]
    skills: SkillsResponse
    quality: QualityResponse
    matches: List[JobMatchResponse]
    timestamp: str

class ATSChecklistItem(BaseModel):
    item: str
    status: str  # pass, fail, warning

class KeywordDensityItem(BaseModel):
    keyword: str
    resume_count: int
    jd_count: int

class QuickFix(BaseModel):
    issue: str
    fix: str

class ATSCheckResponse(BaseModel):
    ats_score: int
    checklist: List[ATSChecklistItem]
    keyword_density: List[KeywordDensityItem]
    quick_fixes: List[QuickFix]

class CareerStep(BaseModel):
    role: str
    current: bool
    duration: str
    skills: List[str]

class CareerPathOption(BaseModel):
    name: str
    steps: List[CareerStep]

class CareerPathResponse(BaseModel):
    current_role: str
    paths: List[CareerPathOption]

class ParseJDResponse(BaseModel):
    role_title: str
    required_skills: List[str]
    soft_skills: List[str]
    experience_level: str
    education: str
    seniority: str
    location: str

class RankedCandidate(BaseModel):
    candidate_id: int
    name: str
    rank: int
    match_score: float
    similarity_score: float
    skill_match_pct: float
    matched_skills: List[str]
    missing_skills: List[str]
    top_skills: List[str]

class MatchBreakdown(BaseModel):
    technical_skills: int
    soft_skills: int
    experience: int
    education: int
    overall: int

class CandidateMatchResponse(BaseModel):
    overall_score: int
    breakdown: MatchBreakdown
    explanation: str
    matched_skills: List[str]
    missing_skills: List[str]
    recommendations: List[Dict]

class InterviewQuestion(BaseModel):
    question: str
    category: str  # Technical, Behavioral, Gap-Based

class HealthResponse(BaseModel):
    status: str
    classifier_loaded: bool
    job_db_loaded: bool
    model: str
