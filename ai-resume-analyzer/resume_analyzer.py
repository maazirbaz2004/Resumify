
# ── Standard library 
import os
import re
import json
import hashlib
from datetime import datetime
from typing import Dict, List, Optional, Tuple

# ── Third-party 
import streamlit as st
import pandas as pd
import numpy as np
import nltk
import joblib
import plotly.graph_objects as go
from collections import Counter
from sentence_transformers import SentenceTransformer, util
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    accuracy_score,
    precision_recall_fscore_support,
    confusion_matrix,
)
from sklearn.model_selection import train_test_split
from nltk.corpus import stopwords


# PAGE CONFIG  (must be first Streamlit call)
st.set_page_config(
    page_title="AI Resume Analyzer",
    page_icon="📋",
    layout="wide",
    initial_sidebar_state="expanded",
)


# CONFIGURATION
class Config:
    """All system-wide constants in one place — edit here to change behaviour."""

    # ── Data files 
    RESUME_FILE = "datasets/resumes.csv"
    JOB_FILE = "datasets/jobs.csv"

    # ── Disk cache (avoids recomputing embeddings on every restart) 
    CACHE_DIR = "model_cache"
    CACHE_CLASSIFIER = f"{CACHE_DIR}/classifier.pkl"
    CACHE_LABEL_ENC  = f"{CACHE_DIR}/label_enc.pkl"
    CACHE_EMBEDDINGS = f"{CACHE_DIR}/train_embeddings.npz"
    CACHE_JOB_EMB    = f"{CACHE_DIR}/job_embeddings.npy"
    CACHE_META       = f"{CACHE_DIR}/meta.json"   # stores data hash + split params

    # ── Model settings 
    EMBED_MODEL = "all-MiniLM-L6-v2"  # 384-dimensional sentence embeddings
    TEST_SPLIT = 0.20  # 20 % held out for evaluation
    RANDOM_SEED = 42
    MIN_JOB_SCORE = 0.30  # Similarity threshold for job matches
    TOP_K_JOBS = 5  # Number of job results to return

    # ── Class balancing 
    # BALANCE_CAP  : roles with MORE than this are undersampled
    #                Set high enough that Data Science / Python Dev keep enough data
    BALANCE_CAP   = 400
    # BALANCE_FLOOR: roles with FEWER than this are oversampled (with replacement)
    #                New synthetic roles (ML Eng, CV Eng etc.) will be brought up to this
    BALANCE_FLOOR = 150

    # ── Technical skills  (skill_name → list of text patterns) 
    TECH_SKILLS: Dict[str, List[str]] = {
        # ================= PROGRAMMING =================
        "Python": ["python", "py", "python3"],
        "Java": ["java", "jdk"],
        "JavaScript": ["javascript", "js", "es6"],
        "TypeScript": ["typescript", "ts"],
        "C++": ["c++", "cpp"],
        "C": ["c programming"],
        "C#": ["c#", "csharp", ".net", "dotnet"],
        "Go": ["go", "golang"],
        "Rust": ["rust"],
        "Ruby": ["ruby", "ruby on rails"],
        "PHP": ["php"],
        "Swift": ["swift"],
        "Kotlin": ["kotlin"],
        "R": ["r programming"],
        "Dart": ["dart"],
        "MATLAB": ["matlab"],
        "Shell": ["bash", "shell", "sh"],
        # ================= FRAMEWORKS =================
        "Django": ["django"],
        "Flask": ["flask"],
        "FastAPI": ["fastapi"],
        "Spring Boot": ["spring boot"],
        "ASP.NET": ["asp.net"],
        "Express.js": ["express", "expressjs"],
        "React": ["react", "reactjs"],
        "Next.js": ["nextjs", "next.js"],
        "Angular": ["angular"],
        "Vue.js": ["vue", "vuejs"],
        "Laravel": ["laravel"],
        "Ruby on Rails": ["rails"],
        "Bootstrap": ["bootstrap"],
        "Tailwind CSS": ["tailwind", "tailwindcss"],
        # ================= WEB =================
        "HTML": ["html"],
        "CSS": ["css"],
        "REST API": ["rest api", "restful"],
        "GraphQL": ["graphql"],
        # ================= DATA / AI =================
        "Machine Learning": ["machine learning", "ml"],
        "Deep Learning": ["deep learning", "dl"],
        "NLP": ["nlp", "natural language processing"],
        "Computer Vision": ["computer vision"],
        "Data Analysis": ["data analysis"],
        "Data Engineering": ["data engineering", "etl"],
        "Big Data": ["big data"],
        "Statistics": ["statistics"],
        "Time Series": ["time series"],
        "Reinforcement Learning": ["reinforcement learning"],
        # Libraries
        "TensorFlow": ["tensorflow", "tf"],
        "PyTorch": ["pytorch"],
        "Keras": ["keras"],
        "Scikit-learn": ["sklearn"],
        "Pandas": ["pandas"],
        "NumPy": ["numpy"],
        "Matplotlib": ["matplotlib"],
        "Seaborn": ["seaborn"],
        "Plotly": ["plotly"],
        "OpenCV": ["opencv"],
        "Hugging Face": ["huggingface", "transformers"],
        # ================= DATABASES =================
        "MySQL": ["mysql"],
        "PostgreSQL": ["postgresql", "postgres"],
        "SQLite": ["sqlite"],
        "MongoDB": ["mongodb"],
        "Redis": ["redis"],
        "Elasticsearch": ["elasticsearch"],
        "Cassandra": ["cassandra"],
        "DynamoDB": ["dynamodb"],
        # ================= CLOUD / DEVOPS =================
        "AWS": ["aws", "ec2", "s3", "lambda"],
        "Azure": ["azure"],
        "GCP": ["gcp", "google cloud"],
        "Docker": ["docker"],
        "Kubernetes": ["kubernetes", "k8s"],
        "CI/CD": ["ci/cd"],
        "Jenkins": ["jenkins"],
        "Git": ["git", "github", "gitlab"],
        "Terraform": ["terraform"],
        "Ansible": ["ansible"],
        "Nginx": ["nginx"],
        # ================= SECURITY =================
        "Cybersecurity": ["cybersecurity", "security"],
        "Penetration Testing": ["penetration testing", "pentest"],
        "Network Security": ["network security"],
        "Cryptography": ["cryptography"],
        # ================= MOBILE =================
        "Android": ["android"],
        "iOS": ["ios"],
        "Flutter": ["flutter"],
        "React Native": ["react native"],
        # ================= DESIGN =================
        "Figma": ["figma"],
        "UI/UX": ["ui/ux", "user experience"],
        "Photoshop": ["photoshop"],
        "Illustrator": ["illustrator"],
        "Adobe XD": ["adobe xd"],
        # ================= BUSINESS =================
        "Project Management": ["project management", "pmp"],
        "Agile": ["agile", "scrum", "kanban"],
        "Product Management": ["product management"],
        "Digital Marketing": ["digital marketing"],
        "SEO": ["seo"],
        "Content Marketing": ["content marketing"],
        "Sales": ["sales"],
        "Business Analysis": ["business analysis"],
        "Accounting": ["accounting"],
        "Financial Analysis": ["financial analysis"],
        # ================= HR =================
        "Recruitment": ["recruitment", "talent acquisition"],
        "Payroll": ["payroll"],
        "Employee Relations": ["employee relations"],
        "Training & Development": ["training"],
        "HR Management": ["hrm"],
        # ================= ENGINEERING =================
        "AutoCAD": ["autocad"],
        "SolidWorks": ["solidworks"],
        "Embedded Systems": ["embedded systems"],
        "PLC": ["plc"],
        # ================= TOOLS =================
        "Excel": ["excel", "ms excel"],
        "Power BI": ["power bi"],
        "Tableau": ["tableau"],
        "MS Office": ["ms office"],
        "Jira": ["jira"],
        "Slack": ["slack"],
        "Postman": ["postman"],
        "Notion": ["notion"],
    }

    # ── Soft skills  (skill_name → list of text patterns / variants) 
    # Dictionary format enables variant matching — fixes HR/management CV detection
    SOFT_SKILLS: Dict[str, List[str]] = {
        "Communication": [
            "communication", "communicating", "communicated", "communicates",
            "verbal communication", "written communication", "presentation skills",
            "presenting", "presented", "articulate", "articulating",
            "conveying", "conveyed ideas", "interpersonal communication",
        ],
        "Leadership": [
            "leadership", "lead", "led", "leading", "leader",
            "managed team", "team lead", "managed staff", "managed employees",
            "oversaw", "directed", "guided team", "mentored team",
            "supervised", "supervised team", "head of",
        ],
        "Teamwork": [
            "teamwork", "team player", "team work", "collaborated", "collaboration",
            "worked with team", "cross-functional", "cross functional",
            "worked alongside", "partnered with", "joint effort",
            "cooperative", "coordinated with team",
        ],
        "Problem Solving": [
            "problem solving", "problem-solving", "solved", "resolved issues",
            "troubleshooting", "troubleshot", "root cause", "diagnosed",
            "identified solutions", "analytical problem", "tackled challenges",
        ],
        "Time Management": [
            "time management", "deadline", "deadlines", "on time", "prioritized",
            "prioritization", "multitasking", "multi-tasking", "time-sensitive",
            "met deadlines", "managed time", "efficient use of time",
        ],
        "Critical Thinking": [
            "critical thinking", "analytical thinking", "analytical skills",
            "logical reasoning", "logical thinking", "evaluated", "assessed",
            "data-driven", "evidence-based", "systematic thinking",
        ],
        "Adaptability": [
            "adaptability", "adaptable", "flexible", "flexibility",
            "adapted", "adapt", "dynamic environment", "fast-paced environment",
            "embraced change", "adjusted to", "versatile", "versatility",
        ],
        "Creativity": [
            "creativity", "creative", "innovative", "innovation",
            "creative thinking", "ideation", "brainstorming", "brainstormed",
            "out of the box", "novel solutions", "designed new",
        ],
        "Decision Making": [
            "decision making", "decision-making", "strategic decisions",
            "made decisions", "critical decisions", "sound judgment",
            "evaluated options", "weighing options",
        ],
        "Project Management": [
            "project management", "project manager", "managed projects",
            "delivered projects", "project planning", "project coordination",
            "project lifecycle", "end-to-end delivery",
        ],
        "Strategic Planning": [
            "strategic planning", "strategic plan", "strategy",
            "long-term planning", "business strategy", "roadmap",
            "developed strategy", "formulated strategy",
        ],
        "Work Ethic": [
            "work ethic", "hardworking", "dedicated", "dedication",
            "diligent", "committed", "commitment", "persistent",
            "perseverance", "reliable", "dependable",
        ],
        "Public Speaking": [
            "public speaking", "presentations", "presented to",
            "spoke at", "keynote", "conference talk", "workshop facilitation",
            "facilitated", "delivered presentations",
        ],
        "Mentoring": [
            "mentoring", "mentored", "mentor", "coaching", "coached",
            "trained staff", "onboarded", "guided junior", "knowledge transfer",
        ],
        "Conflict Resolution": [
            "conflict resolution", "conflict management", "resolved conflict",
            "resolved disputes", "handled disputes", "mediated",
            "de-escalated", "handled difficult situations",
        ],
        "Emotional Intelligence": [
            "emotional intelligence", "empathy", "empathetic",
            "self-awareness", "compassionate", "understanding others",
        ],
        "Active Listening": [
            "active listening", "attentive", "listened", "receptive to feedback",
        ],
        "Attention to Detail": [
            "attention to detail", "detail-oriented", "detail oriented",
            "meticulous", "precise", "accuracy", "thorough",
        ],
        "Negotiation": [
            "negotiation", "negotiated", "negotiating", "deal-making",
            "contract negotiation", "procurement negotiation",
        ],
        "Stress Management": [
            "stress management", "calm under pressure", "pressure",
            "high-pressure", "stress tolerance", "works well under pressure",
        ],
        "Accountability": [
            "accountability", "accountable", "ownership", "took ownership",
            "responsible for results", "self-accountable",
        ],
        "Delegation": [
            "delegation", "delegated", "delegating", "assigned tasks",
            "task allocation", "distributed work",
        ],
        "Cultural Awareness": [
            "cultural awareness", "cross-cultural", "multicultural",
            "diverse teams", "global teams", "cultural sensitivity",
        ],
        "Professionalism": [
            "professionalism", "professional", "professional conduct",
            "workplace etiquette", "corporate environment",
        ],
        "Resilience": [
            "resilience", "resilient", "bounce back", "overcame challenges",
            "persisted through", "persistence",
        ],
        "Relationship Building": [
            "relationship building", "built relationships", "stakeholder management",
            "client relationships", "rapport", "networking",
        ],
        "Initiative": [
            "initiative", "proactive", "proactively", "self-starter",
            "took initiative", "independently identified",
        ],
        "Organizational Skills": [
            "organizational skills", "organized", "organisation",
            "structured approach", "systematic", "planning and organizing",
        ],
        "Customer Service": [
            "customer service", "client service", "customer satisfaction",
            "client satisfaction", "customer support", "client support",
        ],
        "Persuasion": [
            "persuasion", "persuasive", "influenced", "influencing",
            "convinced", "stakeholder buy-in",
        ],
        "Coaching": [
            "coaching", "coach", "performance coaching",
            "career development", "talent development",
        ],
        "Integrity": [
            "integrity", "ethics", "ethical", "honest", "honesty",
            "transparency", "transparent",
        ],
        "Analytical Skills": [
            "analytical", "analysis", "analysed", "analyzed",
            "data analysis", "quantitative analysis", "qualitative analysis",
        ],
        "Goal Setting": [
            "goal setting", "set goals", "kpi", "kpis", "objectives",
            "okr", "targets", "performance targets",
        ],
        "Innovation": [
            "innovation", "innovated", "process improvement", "improved processes",
            "optimized", "optimised", "streamlined",
        ],
        "People Management": [
            "people management", "managing people", "team management",
            "hr management", "talent management", "workforce management",
        ],
        "Training & Development": [
            "training", "trained staff", "developed training",
            "learning and development", "employee development", "upskilling",
        ],
        "Recruitment": [
            "recruitment", "recruiting", "talent acquisition",
            "hiring", "interviewed candidates", "shortlisting",
        ],
        "Collaboration": [
            "collaboration", "collaboratively", "worked collaboratively",
            "joint projects", "interdepartmental", "cross-team",
        ],
        "Self-Motivation": [
            "self-motivated", "self motivation", "self-driven",
            "autonomous", "independently driven",
        ],
        "Focus": [
            "focused", "concentrated", "results-focused", "goal-oriented",
            "outcome-focused",
        ],
    }

    # ── Action-to-skill map  (verb in resume → inferred soft skill) 
    # This catches HR/management CVs that describe skills through actions, not labels
    ACTION_TO_SKILL: Dict[str, str] = {
        "managed": "Leadership",
        "led": "Leadership",
        "supervised": "Leadership",
        "oversaw": "Leadership",
        "directed": "Leadership",
        "coordinated": "Teamwork",
        "collaborated": "Teamwork",
        "partnered": "Teamwork",
        "negotiated": "Negotiation",
        "resolved": "Conflict Resolution",
        "mediated": "Conflict Resolution",
        "communicated": "Communication",
        "presented": "Communication",
        "facilitated": "Public Speaking",
        "mentored": "Mentoring",
        "coached": "Coaching",
        "trained": "Training & Development",
        "recruited": "Recruitment",
        "hired": "Recruitment",
        "analysed": "Analytical Skills",
        "analyzed": "Analytical Skills",
        "optimised": "Innovation",
        "optimized": "Innovation",
        "streamlined": "Innovation",
        "improved": "Innovation",
        "delegated": "Delegation",
        "prioritized": "Time Management",
        "organised": "Organizational Skills",
        "organized": "Organizational Skills",
        "influenced": "Persuasion",
        "convinced": "Persuasion",
        "adapted": "Adaptability",
    }

    # ── Skill learning recommendations  (skill → suggested learning path) 
    # Shown when a skill is missing from a job match — gives actionable next steps
    SKILL_RECOMMENDATIONS: Dict[str, str] = {
        # Programming
        "Python":          "Python.org docs → Kaggle free courses → Build a data project",
        "Java":            "Oracle Java tutorials → Spring Boot guide → LeetCode practice",
        "JavaScript":      "javascript.info → freeCodeCamp → Build a small React app",
        "TypeScript":      "TypeScript Handbook → Migrate a JS project to TS",
        "C++":             "learncpp.com → Competitive programming on Codeforces",
        "C#":              "Microsoft C# docs → Build a .NET console or web app",
        "Go":              "tour.golang.org → Build a REST API with Gin framework",
        "R":               "R for Data Science (book) → Tidyverse tutorials on RStudio",
        "SQL":             "SQLZoo → Mode Analytics tutorials → Practice on real datasets",
        # Frameworks & Web
        "React":           "React official docs → Build a To-Do app → Scrimba React course",
        "Django":          "Django official tutorial → Build a CRUD web app",
        "Flask":           "Flask mega-tutorial by Miguel Grinberg → Build a REST API",
        "FastAPI":         "FastAPI official docs → Build and deploy an API on Railway",
        "Node.js":         "Node.js official guides → The Odin Project backend path",
        "Next.js":         "Next.js official docs → Vercel deployment guide",
        "Angular":         "Angular Tour of Heroes tutorial → Udemy Angular course",
        "Vue.js":          "Vue.js official guide → Vuex state management tutorial",
        "Spring Boot":     "Spring.io guides → Build a REST service with Spring Boot",
        # Data & AI
        "Machine Learning":    "Andrew Ng ML course (Coursera) → fast.ai → Kaggle competitions",
        "Deep Learning":       "fast.ai course → PyTorch tutorials → Build a CNN classifier",
        "NLP":                 "Hugging Face course → spaCy tutorials → Fine-tune a BERT model",
        "TensorFlow":          "TensorFlow.org tutorials → Keras guide → Deploy with TF Serving",
        "PyTorch":             "PyTorch official tutorials → fast.ai → Build a custom model",
        "Scikit-learn":        "Scikit-learn user guide → Kaggle notebooks → Andrew Ng course",
        "Pandas":              "10 minutes to Pandas → Kaggle Pandas course → Real datasets",
        "Data Analysis":       "Kaggle Data Analysis course → Tableau Public free training",
        "Computer Vision":     "OpenCV tutorials → PyTorch vision → Build an image classifier",
        "Data Engineering":    "DataTalks.Club DE Zoomcamp (free) → Apache Airflow tutorial",
        # Cloud & DevOps
        "AWS":             "AWS free tier → Cloud Practitioner cert → A Cloud Guru",
        "Azure":           "Microsoft Learn Azure path → AZ-900 certification",
        "GCP":             "Google Cloud Skills Boost → Associate Cloud Engineer cert",
        "Docker":          "Docker official get-started → Build and ship a containerized app",
        "Kubernetes":      "Kubernetes.io tutorials → KodeKloud free K8s course",
        "CI/CD":           "GitHub Actions docs → Build a pipeline for a personal project",
        "Git":             "Pro Git book (free) → GitHub Skills → Contribute to open source",
        "Terraform":       "HashiCorp Terraform tutorials → Deploy infra on AWS free tier",
        # Databases
        "MySQL":           "MySQL tutorial on w3schools → Joins & indexes deep dive",
        "PostgreSQL":      "PostgreSQL tutorial → pgAdmin → Use with Django or FastAPI",
        "MongoDB":         "MongoDB University free courses → Build a Node.js CRUD app",
        "Redis":           "Redis University free courses → Use as cache in a web app",
        # Mobile
        "Flutter":         "Flutter.dev codelabs → Build a cross-platform mobile app",
        "React Native":    "React Native docs → Expo getting started guide",
        "Android":         "Android developer guides → Build a simple Kotlin app",
        "iOS":             "Apple Swift tutorials → Hacking with Swift (free)",
        # Design & Tools
        "Figma":           "Figma.com tutorials → Redesign an existing app for practice",
        "UI/UX":           "Google UX Design cert (Coursera) → Design a portfolio project",
        "Power BI":        "Microsoft Power BI learning path → Build a sales dashboard",
        "Tableau":         "Tableau Public free training → Viz of the Week challenge",
        # Business & Management
        "Project Management": "Google PM cert (Coursera) → PMP exam prep → Agile study",
        "Agile":           "Scrum.org free resources → Take a Scrum Master cert",
        "Business Analysis":"IIBA ECBA certification → Business Analysis Body of Knowledge",
        "Digital Marketing":"Google Digital Garage (free) → Meta Blueprint → Google Ads cert",
        "SEO":             "Moz Beginner's Guide to SEO → Ahrefs Academy (free)",
        # Security
        "Cybersecurity":   "CompTIA Security+ study guide → TryHackMe free rooms",
        "Penetration Testing": "TryHackMe → HackTheBox → OSCP certification path",
        # Soft skills
        "Leadership":      "The 21 Irrefutable Laws of Leadership (book) → Lead a volunteer project",
        "Communication":   "Toastmasters club → Public speaking courses on Udemy",
        "Project Management": "PMP or PRINCE2 certification → Manage a small real project",
        "Negotiation":     "Never Split the Difference (book) → Harvard negotiation course",
        "Public Speaking": "Toastmasters → TED Masterclass → Record and review yourself",
    }

    # ── Design tokens (used in Plotly charts) 
    CYAN = "#22D3EE"
    VIOLET = "#A78BFA"
    EMERALD = "#34D399"
    AMBER = "#FBBF24"
    ROSE = "#FB7185"
    BG2 = "#111827"
    BG3 = "#151E30"
    T1 = "#F0F6FF"
    T2 = "#8899B4"
    T3 = "#3D5070"


# ICON HELPER  (inline Lucide SVGs — no emoji, no font dependency)
_SVG_PATHS: Dict[str, str] = {
    "file-text": "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z|M14 2v6h6|M16 13H8|M16 17H8|M10 9H8",
    "scan-search": "M3 7V5a2 2 0 0 1 2-2h2|M17 3h2a2 2 0 0 1 2 2v2|M21 17v2a2 2 0 0 1-2 2h-2|M7 21H5a2 2 0 0 1-2-2v-2|M11 14a3 3 0 1 0 0-6 3 3 0 0 0 0 6|M13.5 13.5l2 2",
    "cpu": "M9 3H5a2 2 0 0 0-2 2v4|M13 3h6a2 2 0 0 1 2 2v4|M9 21H5a2 2 0 0 1-2-2v-4|M13 21h6a2 2 0 0 0 2-2v-4|M3 9h18|M3 15h18",
    "database": "M12 2C7.58 2 4 3.79 4 6s3.58 4 8 4 8-1.79 8-4-3.58-4-8-4|M4 6v6c0 2.21 3.58 4 8 4s8-1.79 8-4V6|M4 12v6c0 2.21 3.58 4 8 4s8-1.79 8-4v-6",
    "briefcase": "M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z|M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2",
    "target": "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20|M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12|M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4",
    "award": "M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12|M8.21 13.89L7 23l5-3 5 3-1.21-9.12",
    "code-2": "M7 10l-3 2 3 2|M17 10l3 2-3 2|M14 6l-4 12",
    "users": "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2|M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8|M23 21v-2a4 4 0 0 0-3-3.87|M16 3.13a4 4 0 0 1 0 7.75",
    "trending-up": "M23 6l-9.5 9.5-5-5L1 18|M17 6h6v6",
    "bar-chart-2": "M18 20V10|M12 20V4|M6 20v-6",
    "activity": "M22 12h-4l-3 9L9 3l-3 9H2",
    "search": "M21 21l-4.35-4.35|M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0",
    "zap": "M13 2L3 14h9l-1 8 10-12h-9l1-8",
    "check-circle": "M22 11.08V12a10 10 0 1 1-5.93-9.14|M9 11l3 3L22 4",
    "alert-circle": "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20|M12 8v4|M12 16h.01",
    "x-circle": "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20|M15 9l-6 6|M9 9l6 6",
    "map-pin": "M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0|M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6",
    "layers": "M12 2L2 7l10 5 10-5-10-5|M2 17l10 5 10-5|M2 12l10 5 10-5",
    "grid": "M3 3h7v7H3|M14 3h7v7h-7|M3 14h7v7H3|M14 14h7v7h-7",
    "settings-2": "M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16|M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4|M12 2v2|M12 20v2|M4.93 4.93l1.41 1.41|M17.66 17.66l1.41 1.41|M2 12h2|M20 12h2|M4.93 19.07l1.41-1.41|M17.66 6.34l1.41-1.41",
    "download": "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4|M7 10l5 5 5-5|M12 15V3",
    "book": "M4 19.5A2.5 2.5 0 0 1 6.5 17H20|M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2",
    "star": "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2",
    "info": "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20|M12 8h.01|M12 12v4",
    "clipboard": "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2|M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1",
    "upload": "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4|M17 8l-5-5-5 5|M12 3v12",
}


def ic(name: str, size: int = 16, color: str = "currentColor") -> str:
    """Return a self-contained Lucide SVG string."""
    raw = _SVG_PATHS.get(name, "M0 0")
    parts = []
    for seg in raw.split("|"):
        seg = seg.strip()
        if not seg:
            continue
        d = seg if seg.startswith("M") else "M" + seg
        parts.append(f'<path d="{d}"/>')
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" '
        f'viewBox="0 0 24 24" fill="none" stroke="{color}" '
        f'stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">'
        + "\n".join(parts)
        + "</svg>"
    )


def _rgb(hex_color: str) -> str:
    """Convert #RRGGBB → 'R,G,B' string for use in rgba()."""
    h = hex_color.lstrip("#")
    return f"{int(h[0:2],16)},{int(h[2:4],16)},{int(h[4:6],16)}"


# GLOBAL CSS + ANIMATIONS
def apply_styles():
    st.markdown(
        """
<style>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

/* ── Design tokens ─────────────────────────────────────────────────────── */
:root {
  --bg0:#07090F; --bg1:#0C1020; --bg2:#111827; --bg3:#151E30; --bg4:#1C2540;
  --line:#1E2A3F; --line2:#28374F;
  --cyan:#22D3EE;   --cyan-d:rgba(34,211,238,.12);  --cyan-b:rgba(34,211,238,.28);
  --vio:#A78BFA;    --vio-d:rgba(167,139,250,.12);   --vio-b:rgba(167,139,250,.28);
  --eme:#34D399;    --eme-d:rgba(52,211,153,.12);    --eme-b:rgba(52,211,153,.28);
  --amb:#FBBF24;    --amb-d:rgba(251,191,36,.12);    --amb-b:rgba(251,191,36,.28);
  --rose:#FB7185;   --rose-d:rgba(251,113,133,.12);  --rose-b:rgba(251,113,133,.28);
  --t1:#F0F6FF; --t2:#8899B4; --t3:#3D5070; --t4:#1E2A3F;
  --r:9px;
}

/* ── Force dark theme — overrides light mode / system preference ─────── */
html, body,
[data-testid="stAppViewContainer"],
[data-testid="stAppViewBlockContainer"],
[data-testid="stMain"],
[class*="css"],
.stApp,
.main,
.block-container,
section[data-testid="stSidebar"],
section[data-testid="stSidebar"] > div {
  background-color: var(--bg0) !important;
  color: var(--t1) !important;
}

/* Force top bar + toolbar to dark so it doesn't flash white */
header[data-testid="stHeader"] {
  background-color: var(--bg0) !important;
  border-bottom: 1px solid var(--line) !important;
}
header[data-testid="stHeader"] * { color: var(--t2) !important; }

/* Ensure all text nodes inside stApp are light coloured */
.stApp p, .stApp span, .stApp div, .stApp label,
.stApp li, .stApp h1, .stApp h2, .stApp h3 {
  color: var(--t1);
}

/* ── Keyframes ──────────────────────────────────────────────────────────── */
@keyframes fadeUp    { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
@keyframes barFill   { from{width:0} to{width:var(--w)} }
@keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
@keyframes glowPulse { 0%,100%{box-shadow:0 0 6px var(--eme-b)} 50%{box-shadow:0 0 18px var(--eme-b),0 0 32px var(--eme-d)} }
@keyframes borderFlow{ 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
@keyframes topBar    { from{width:0} to{width:100%} }
@keyframes tagIn     { from{opacity:0;transform:scale(.85)} to{opacity:1;transform:none} }

/* ── Base ───────────────────────────────────────────────────────────────── */
html,body,[class*="css"],.stApp { font-family:'Outfit',sans-serif !important; background:var(--bg0) !important; color:var(--t1) !important; }
.main,.block-container           { background:var(--bg0) !important; }
.block-container                 { padding:3.5rem 2rem 4rem !important; max-width:1420px !important; }
/* Sidebar block-container keeps its own smaller top padding */

/* ── Scrollbar ── */
::-webkit-scrollbar             { width:4px; height:4px; }
::-webkit-scrollbar-track       { background:var(--bg0); }
::-webkit-scrollbar-thumb       { background:var(--line2); border-radius:4px; }
::-webkit-scrollbar-thumb:hover { background:var(--t3); }

/* ── Sidebar ── */
section[data-testid="stSidebar"]>div { background:var(--bg1) !important; border-right:1px solid var(--line) !important; }
section[data-testid="stSidebar"] .block-container { padding:1.25rem 1rem 2rem !important; }
section[data-testid="stSidebar"] * { color: var(--t1) !important; }

/* ── Tabs ── */
.stTabs [data-baseweb="tab-list"]  { background:var(--bg2) !important; border-radius:var(--r) !important; padding:4px !important; gap:3px !important; border:1px solid var(--line) !important; }
.stTabs [data-baseweb="tab"]       { font-family:'Outfit',sans-serif !important; font-size:.82rem !important; font-weight:600 !important; color:var(--t2) !important; background:transparent !important; border-radius:6px !important; padding:9px 22px !important; border:none !important; transition:all .2s ease !important; }
.stTabs [data-baseweb="tab"]:hover { color:var(--t1) !important; background:var(--bg3) !important; }
.stTabs [aria-selected="true"]     { background:var(--bg4) !important; color:var(--cyan) !important; box-shadow:0 0 0 1px var(--cyan-b),0 0 12px var(--cyan-d) !important; }

/* ── Metric cards ── */
[data-testid="stMetric"]         { background:var(--bg2) !important; border:1px solid var(--line) !important; border-radius:var(--r) !important; padding:16px 18px !important; transition:all .25s ease !important; animation:fadeUp .4s ease both !important; }
[data-testid="stMetric"]:hover   { border-color:var(--line2) !important; background:var(--bg3) !important; transform:translateY(-2px) !important; box-shadow:0 8px 24px rgba(0,0,0,.3) !important; }
[data-testid="stMetricValue"]    { font-family:'Outfit',sans-serif !important; font-size:1.55rem !important; font-weight:700 !important; color:var(--t1) !important; }
[data-testid="stMetricLabel"]    { font-family:'JetBrains Mono',monospace !important; font-size:.6rem !important; color:var(--t2) !important; text-transform:uppercase !important; letter-spacing:.1em !important; }
[data-testid="stMetricDelta"]    { font-size:.72rem !important; }

/* ── Primary button ── */
.stButton>button         { font-family:'Outfit',sans-serif !important; font-weight:700 !important; font-size:.86rem !important; background:linear-gradient(135deg,#22D3EE,#38BDF8) !important; color:#07090F !important; border:none !important; border-radius:var(--r) !important; padding:.65rem 1.8rem !important; letter-spacing:.02em !important; transition:all .2s ease !important; box-shadow:0 0 24px rgba(34,211,238,.25),0 2px 8px rgba(0,0,0,.3) !important; overflow:hidden !important; }
.stButton>button:hover   { box-shadow:0 0 36px rgba(34,211,238,.4),0 4px 16px rgba(0,0,0,.4) !important; transform:translateY(-2px) !important; filter:brightness(1.05) !important; }
.stButton>button:disabled{ background:var(--bg4) !important; color:var(--t3) !important; box-shadow:none !important; transform:none !important; }

/* ── Textarea ── */
.stTextArea textarea           { background:var(--bg2) !important; color:var(--t1) !important; border:1px solid var(--line2) !important; border-radius:var(--r) !important; font-family:'JetBrains Mono',monospace !important; font-size:.77rem !important; line-height:1.85 !important; padding:14px !important; caret-color:var(--cyan) !important; transition:border-color .2s,box-shadow .2s !important; }
.stTextArea textarea::placeholder { color:var(--t3) !important; }
.stTextArea textarea:focus     { border-color:var(--cyan) !important; box-shadow:0 0 0 3px var(--cyan-d),0 0 20px var(--cyan-d) !important; }

/* ── File uploader ── */
[data-testid="stFileUploader"]       { background:var(--bg2) !important; border:1.5px dashed var(--line2) !important; border-radius:var(--r) !important; transition:all .2s !important; }
[data-testid="stFileUploader"]:hover { border-color:var(--cyan) !important; box-shadow:0 0 16px var(--cyan-d) !important; }
[data-testid="stFileUploader"] *     { color:var(--t2) !important; }

/* ── Expander ── */
details          { background:var(--bg2) !important; border:1px solid var(--line) !important; border-radius:var(--r) !important; margin-bottom:9px !important; transition:all .2s ease !important; overflow:hidden !important; }
details:hover    { border-color:var(--line2) !important; }
details[open]    { border-color:var(--cyan-b) !important; box-shadow:0 0 16px var(--cyan-d) !important; }
summary          { font-family:'Outfit',sans-serif !important; font-size:.85rem !important; font-weight:600 !important; color:var(--t1) !important; padding:13px 16px !important; cursor:pointer !important; transition:color .15s !important; background:var(--bg2) !important; }
summary:hover    { color:var(--cyan) !important; background:var(--bg3) !important; }
details>div      { padding:0 16px 14px !important; background:var(--bg2) !important; }

/* Fix Streamlit expander inner wrappers that flash white */
[data-testid="stExpander"]                          { background:var(--bg2) !important; border:1px solid var(--line) !important; border-radius:var(--r) !important; overflow:hidden !important; }
[data-testid="stExpander"]:hover                    { border-color:var(--line2) !important; }
[data-testid="stExpander"] > details               { border:none !important; margin-bottom:0 !important; box-shadow:none !important; }
[data-testid="stExpander"] > details > summary     { background:var(--bg2) !important; color:var(--t1) !important; }
[data-testid="stExpander"] > details[open]         { border:none !important; box-shadow:none !important; }
[data-testid="stExpander"] > details > summary:hover { background:var(--bg3) !important; color:var(--cyan) !important; }
[data-testid="stExpanderDetails"]                  { background:var(--bg2) !important; }
/* The inner div Streamlit injects */
.streamlit-expanderContent                         { background:var(--bg2) !important; }
.streamlit-expanderHeader                          { background:var(--bg2) !important; color:var(--t1) !important; border-radius:var(--r) !important; }

/* ── Alerts ── */
.stSuccess,.stInfo,.stWarning,.stError { border-radius:var(--r) !important; font-family:'Outfit',sans-serif !important; font-size:.82rem !important; }

/* ── Caption / HR / Download ── */
.stCaption { font-family:'JetBrains Mono',monospace !important; font-size:.67rem !important; color:var(--t2) !important; }
hr { border-color:var(--line) !important; margin:22px 0 !important; }
[data-testid="stDownloadButton"]>button       { background:var(--bg3) !important; color:var(--cyan) !important; border:1px solid var(--cyan-b) !important; box-shadow:none !important; font-weight:600 !important; transition:all .2s !important; }
[data-testid="stDownloadButton"]>button:hover { background:var(--cyan-d) !important; box-shadow:0 0 20px var(--cyan-d) !important; transform:translateY(-1px) !important; }

/* ── Plotly charts dark background ── */
.js-plotly-plot .plotly { background:transparent !important; }

/* ── Hover lift utility ── */
.lift { transition:transform .22s ease,box-shadow .22s ease,border-color .22s ease !important; }
.lift:hover { transform:translateY(-3px) !important; box-shadow:0 12px 32px rgba(0,0,0,.4) !important; }

/* ── Skill tag ── */
.stag { display:inline-flex; align-items:center; padding:4px 12px; border-radius:5px; margin:3px; font-size:.74rem; font-weight:500; line-height:1.4; font-family:'Outfit',sans-serif; transition:transform .18s ease,box-shadow .18s ease; animation:tagIn .3s ease both; cursor:default; }
.stag:hover { transform:translateY(-2px) scale(1.04); }

/* ── Spinner ── */
.stSpinner>div { border-top-color:var(--cyan) !important; }
</style>
""",
        unsafe_allow_html=True,
    )

    # Animated rainbow top bar
    st.markdown(
        """
<div style="position:fixed;top:0;left:0;right:0;z-index:9999;height:3px;
     background:linear-gradient(90deg,#22D3EE,#A78BFA,#34D399,#FBBF24,#22D3EE);
     background-size:300% 100%;animation:borderFlow 3s ease infinite,topBar 1.2s ease-out;">
</div>
<div style="height:3px;"></div>
""",
        unsafe_allow_html=True,
    )


# UI COMPONENT HELPERS


def section_hdr(ico: str, label: str, accent: str = "#22D3EE", delay: float = 0):
    r = _rgb(accent)
    st.markdown(
        f'<div style="display:flex;align-items:center;gap:9px;margin:24px 0 14px;'
        f'animation:fadeUp .4s ease {delay}s both;">'
        f'<div style="width:30px;height:30px;border-radius:7px;'
        f"background:rgba({r},.13);border:1px solid rgba({r},.3);"
        f"display:flex;align-items:center;justify-content:center;"
        f'box-shadow:0 0 10px rgba({r},.12);">{ic(ico,14,accent)}</div>'
        f'<span style="font-size:.71rem;font-weight:700;color:{accent};'
        f'letter-spacing:.12em;text-transform:uppercase;">{label}</span>'
        f"</div>",
        unsafe_allow_html=True,
    )


def section_stripe(ico: str, label: str, accent: str, delay: float = 0):
    r = _rgb(accent)
    st.markdown(
        f'<div style="background:linear-gradient(135deg,rgba({r},.07),rgba({r},.02));'
        f"border:1px solid rgba({r},.2);border-left:3px solid {accent};"
        f"border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:14px;"
        f'display:flex;align-items:center;gap:10px;animation:fadeUp .4s ease {delay}s both;">'
        f"{ic(ico,15,accent)}"
        f'<span style="font-size:.72rem;font-weight:700;color:{accent};'
        f'text-transform:uppercase;letter-spacing:.1em;">{label}</span>'
        f"</div>",
        unsafe_allow_html=True,
    )


def sidebar_stat(ico: str, label: str, value: str, val_color: str = "#F0F6FF"):
    st.markdown(
        f'<div class="lift" style="display:flex;align-items:center;justify-content:space-between;'
        f'padding:9px 0;border-bottom:1px solid #1E2A3F;">'
        f'<div style="display:flex;align-items:center;gap:9px;">'
        f'{ic(ico,13,"#3D5070")}'
        f'<span style="font-size:.79rem;color:#8899B4;">{label}</span>'
        f"</div>"
        f"<span style=\"font-family:'JetBrains Mono',monospace;font-size:.74rem;"
        f'font-weight:600;color:{val_color};">{value}</span>'
        f"</div>",
        unsafe_allow_html=True,
    )


def animated_bar(label: str, val: int, total: int, color: str, delay: float = 0):
    pct = (val / total) * 100
    r = _rgb(color)
    st.markdown(
        f'<div style="margin-bottom:12px;animation:fadeUp .35s ease {delay}s both;">'
        f'<div style="display:flex;justify-content:space-between;margin-bottom:6px;">'
        f'<span style="font-size:.8rem;color:#8899B4;">{label}</span>'
        f"<span style=\"font-family:'JetBrains Mono',monospace;font-size:.72rem;"
        f'color:{color};font-weight:600;">{val}/{total}</span>'
        f"</div>"
        f'<div style="background:#1C2540;border-radius:4px;height:6px;overflow:hidden;'
        f'box-shadow:inset 0 1px 3px rgba(0,0,0,.4);">'
        f'<div style="--w:{pct:.0f}%;width:0;height:100%;'
        f"background:linear-gradient(90deg,{color},{color}BB);border-radius:4px;"
        f"box-shadow:0 0 10px rgba({r},.5);"
        f'animation:barFill .9s cubic-bezier(.4,0,.2,1) {delay+.1}s both;"></div>'
        f"</div></div>",
        unsafe_allow_html=True,
    )


def conf_bar(role: str, pct: float, color: str, delay: float = 0):
    r = _rgb(color)
    st.markdown(
        f'<div style="display:flex;align-items:center;gap:13px;margin-bottom:10px;'
        f'animation:fadeUp .35s ease {delay}s both;">'
        f'<span style="font-size:.8rem;color:#8899B4;width:150px;white-space:nowrap;'
        f'overflow:hidden;text-overflow:ellipsis;">{role}</span>'
        f'<div style="flex:1;background:#1C2540;border-radius:4px;height:7px;overflow:hidden;">'
        f'<div style="--w:{pct:.0f}%;width:0;height:100%;'
        f"background:linear-gradient(90deg,{color},{color}99);border-radius:4px;"
        f"box-shadow:0 0 12px rgba({r},.55);"
        f'animation:barFill .8s cubic-bezier(.4,0,.2,1) {delay}s both;"></div></div>'
        f"<span style=\"font-family:'JetBrains Mono',monospace;font-size:.73rem;"
        f'color:{color};font-weight:600;width:42px;text-align:right;">{pct:.1f}%</span>'
        f"</div>",
        unsafe_allow_html=True,
    )


def dist_bar(role: str, count: int, total: int, color: str, delay: float = 0):
    pct = count / total * 100
    r = _rgb(color)
    st.markdown(
        f'<div style="margin-bottom:10px;animation:fadeUp .3s ease {delay}s both;">'
        f'<div style="display:flex;justify-content:space-between;margin-bottom:4px;">'
        f'<span style="font-size:.77rem;color:#8899B4;">{role}</span>'
        f"<span style=\"font-family:'JetBrains Mono',monospace;font-size:.68rem;"
        f'color:{color};font-weight:600;">{count}</span>'
        f"</div>"
        f'<div style="background:#1C2540;border-radius:3px;height:4px;overflow:hidden;">'
        f'<div style="--w:{pct:.0f}%;width:0;height:100%;background:{color};border-radius:3px;'
        f'box-shadow:0 0 6px rgba({r},.5);animation:barFill .8s ease {delay}s both;"></div>'
        f"</div></div>",
        unsafe_allow_html=True,
    )


def skill_tag(
    text: str, bg: str, fg: str, border: str, glow: str, delay: float = 0
) -> str:
    return (
        f'<span class="stag" style="background:{bg};border:1px solid {border};color:{fg};'
        f'animation-delay:{delay}s;" '
        f"onmouseover=\"this.style.boxShadow='0 4px 16px {glow}'\" "
        f"onmouseout=\"this.style.boxShadow='none'\">{text}</span>"
    )


def badge_pill(ico: str, text: str, bg: str, fg: str, bd: str) -> str:
    r = _rgb(fg)
    return (
        f'<span style="display:inline-flex;align-items:center;gap:6px;'
        f"background:{bg};border:1px solid {bd};color:{fg};"
        f"font-size:.7rem;font-weight:600;padding:5px 13px;border-radius:7px;"
        f'transition:all .2s ease;cursor:default;" '
        f"onmouseover=\"this.style.boxShadow='0 0 16px rgba({r},.35)';this.style.borderColor='{fg}'\" "
        f"onmouseout=\"this.style.boxShadow='none';this.style.borderColor='{bd}'\">"
        f"{ic(ico,12,fg)}&nbsp;{text}</span>"
    )


# DATA PROCESSOR
class DataProcessor:
    """Loads, validates, and cleans CSV data for the ML pipeline."""

    def __init__(self):
        try:
            nltk.data.find("corpora/stopwords")
        except LookupError:
            nltk.download("stopwords", quiet=True)
        self.stopwords = set(stopwords.words("english"))

    # ── Text cleaning 
    def clean_text(self, raw: str) -> str:
        """Normalize resume/job text: lowercase, remove noise, strip shorts."""
        if not isinstance(raw, str) or not raw.strip():
            return ""
        text = raw.lower()

        # Remove common template placeholders
        for p in [
            "company name",
            "course details",
            "more text",
            "location",
            "email@email.com",
            "resumekraft.com",
        ]:
            text = text.replace(p, "")

        # Remove generic section headers
        for h in [
            "education",
            "summary",
            "experience",
            "skills",
            "work experience",
            "profile",
            "achievements",
        ]:
            text = re.sub(r"\b" + re.escape(h) + r"\b", "", text)

        text = re.sub(r"http\S+|www\S+", "", text)  # URLs
        text = re.sub(r"\S+@\S+", "", text)  # Emails
        text = re.sub(r"\d{3}[-.]?\d{3}[-.]?\d{4}", "", text)  # Phones
        text = re.sub(r"[•■★○◆▪►]", "", text)  # Bullets
        text = re.sub(r"[^\w\s]", " ", text)  # Special chars
        text = re.sub(r"\b\d{4}\s*[-–]\s*(\d{4}|present)\b", "", text)  # Date ranges
        text = re.sub(r"\s+", " ", text).strip()

        return " ".join(w for w in text.split() if len(w) > 2)

    # ── Column auto-detection 
    def _standardise_columns(self, df: pd.DataFrame, kind: str) -> pd.DataFrame:
        """Rename columns to expected names based on keyword matching."""
        mapping = {}
        cols = {c: c.lower() for c in df.columns}

        if kind == "resume":
            for c, cl in cols.items():
                if any(k in cl for k in ["resume", "text", "content", "description"]):
                    mapping[c] = "resume_text"
                    break
            for c, cl in cols.items():
                if any(k in cl for k in ["category", "role", "label", "job"]):
                    mapping[c] = "job_role"
                    break

        elif kind == "job":
            for c, cl in cols.items():
                if "title" in cl:
                    mapping[c] = "title"
                    break
            for c, cl in cols.items():
                if any(k in cl for k in ["desc", "summary", "content"]):
                    mapping[c] = "description"
                    break
            for c, cl in cols.items():
                if "company" in cl:
                    mapping[c] = "company"
                    break

        return df.rename(columns=mapping) if mapping else df

    # ── Validation 
    def _validate(self, df: pd.DataFrame, kind: str) -> Tuple[bool, str]:
        if kind == "resume":
            if "resume_text" not in df.columns:
                return False, "Missing 'resume_text' column in resumes.csv"
            if "job_role" not in df.columns:
                return False, "Missing 'job_role' column in resumes.csv"
            if len(df) < 10:
                return False, f"Too few resumes ({len(df)}). Need at least 10."
            if df["resume_text"].astype(str).str.len().mean() < 200:
                return False, "Resumes too short on average — check your data."
        elif kind == "job":
            if "title" not in df.columns:
                return False, "Missing 'title' column in jobs.csv"
            if "description" not in df.columns:
                return False, "Missing 'description' column in jobs.csv"
            if len(df) < 3:
                return False, f"Too few jobs ({len(df)}). Need at least 3."
        return True, "OK"

    # ── Public loader 
    def load(self) -> Tuple[Optional[pd.DataFrame], Optional[pd.DataFrame]]:
        """Load and return (resumes_df, jobs_df).  Displays status messages."""
        resumes_df = jobs_df = None

        # Resumes
        if os.path.exists(Config.RESUME_FILE):
            try:
                df = pd.read_csv(Config.RESUME_FILE)
                df = self._standardise_columns(df, "resume")
                ok, msg = self._validate(df, "resume")
                if not ok:
                    st.error(f"resumes.csv — {msg}")
                else:
                    df["cleaned_text"] = df["resume_text"].apply(self.clean_text)
                    resumes_df = df
                    st.success(f"Loaded {len(df):,} training resumes")
            except Exception as e:
                st.error(f"Error reading resumes.csv: {e}")
        else:
            st.error(f"File not found: {Config.RESUME_FILE}")

        # Jobs
        if os.path.exists(Config.JOB_FILE):
            try:
                df = pd.read_csv(Config.JOB_FILE)
                df = self._standardise_columns(df, "job")
                if "company" not in df.columns:
                    df["company"] = "Not Specified"
                ok, msg = self._validate(df, "job")
                if not ok:
                    st.error(f"jobs.csv — {msg}")
                else:
                    df["cleaned_description"] = df["description"].apply(self.clean_text)
                    jobs_df = df
                    st.success(f"Loaded {len(df):,} job listings")
            except Exception as e:
                st.error(f"Error reading jobs.csv: {e}")
        else:
            st.warning(
                f"Optional file not found: {Config.JOB_FILE} (job matching disabled)"
            )

        return resumes_df, jobs_df


# AI ENGINE
class AIEngine:
    """
    Core ML pipeline:
      • Sentence embeddings (all-MiniLM-L6-v2)
      • Logistic regression role classifier
      • Cosine-similarity semantic job search
      • Skill extraction + gap analysis
      • Resume quality scoring
    """

    def __init__(self):
        self.processor = DataProcessor()
        self.is_trained = False
        self.has_job_db = False
        self.train_metrics = {}
        self.test_metrics = {}
        self._init()

    # ── Initialisation 
    def _init(self):
        with st.spinner("Initialising AI models and loading data…"):
            self.encoder = self._load_encoder()
            self.resume_df, self.job_df = self.processor.load()

            if self.resume_df is not None:
                self._train_classifier()
                self.is_trained = True

            if self.job_df is not None:
                self._index_jobs()
                self.has_job_db = True

    @st.cache_resource
    def _load_encoder(_self):
        return SentenceTransformer(Config.EMBED_MODEL)

    # ── Cache helpers 
    def _data_hash(self) -> str:
        """SHA-256 of the resume CSV so we retrain only when data changes."""
        try:
            raw = open(Config.RESUME_FILE, "rb").read()
            return hashlib.sha256(raw).hexdigest()[:16]
        except Exception:
            return "unknown"

    def _cache_valid(self, current_hash: str) -> bool:
        """Return True if all cache files exist and match the current data hash."""
        files = [
            Config.CACHE_CLASSIFIER, Config.CACHE_LABEL_ENC,
            Config.CACHE_EMBEDDINGS, Config.CACHE_META,
        ]
        if not all(os.path.exists(f) for f in files):
            return False
        try:
            meta = json.load(open(Config.CACHE_META))
            return (
                meta.get("data_hash") == current_hash
                and meta.get("test_split") == Config.TEST_SPLIT
                and meta.get("random_seed") == Config.RANDOM_SEED
            )
        except Exception:
            return False

    def _save_cache(self, emb_tr, emb_te, y_tr, y_te, data_hash: str):
        """Persist embeddings, model and metadata to disk."""
        os.makedirs(Config.CACHE_DIR, exist_ok=True)
        np.savez_compressed(Config.CACHE_EMBEDDINGS, emb_tr=emb_tr, emb_te=emb_te,
                            y_tr=y_tr, y_te=y_te)
        joblib.dump(self.classifier, Config.CACHE_CLASSIFIER)
        joblib.dump(self.label_enc,  Config.CACHE_LABEL_ENC)
        json.dump({
            "data_hash":   data_hash,
            "test_split":  Config.TEST_SPLIT,
            "random_seed": Config.RANDOM_SEED,
        }, open(Config.CACHE_META, "w"))

    def _load_cache(self):
        """Restore classifier, label encoder and embeddings from disk."""
        self.classifier = joblib.load(Config.CACHE_CLASSIFIER)
        self.label_enc  = joblib.load(Config.CACHE_LABEL_ENC)
        data = np.load(Config.CACHE_EMBEDDINGS, allow_pickle=False)
        return data["emb_tr"], data["emb_te"], list(data["y_tr"]), list(data["y_te"])

    # ── Smart balancing
    def _balance_dataset(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Balance classes without destroying well-represented roles.
        - Roles > BALANCE_CAP  : undersample to cap
        - Roles < BALANCE_FLOOR: oversample with replacement to floor
        - Between floor and cap: leave exactly as-is
        """
        cap   = Config.BALANCE_CAP
        floor = Config.BALANCE_FLOOR
        parts = []
        for role, cnt in df["job_role"].value_counts().items():
            role_df = df[df["job_role"] == role]
            if cnt > cap:
                role_df = role_df.sample(cap, random_state=Config.RANDOM_SEED)
            elif cnt < floor:
                role_df = role_df.sample(floor, replace=True,
                                         random_state=Config.RANDOM_SEED)
            parts.append(role_df)
        balanced = pd.concat(parts, ignore_index=True)
        return balanced.sample(frac=1, random_state=Config.RANDOM_SEED).reset_index(drop=True)

    # ── Classifier training 
    def _train_classifier(self):
        data_hash = self._data_hash()

        if self._cache_valid(data_hash):
            st.info("Loading model from cache (skipping retraining)…")
            emb_tr, emb_te, y_tr, y_te = self._load_cache()
            st.success("Model loaded from cache ✓")
        else:
            st.info("Training role classifier (first run — will be cached)…")

            # Smart balance — cap over-represented, floor under-represented
            balanced_df = self._balance_dataset(self.resume_df)
            st.info(
                f"Dataset balanced: {len(balanced_df):,} resumes across "
                f"{balanced_df['job_role'].nunique()} roles "
                f"(cap={Config.BALANCE_CAP}, floor={Config.BALANCE_FLOOR})"
            )

            texts  = balanced_df["cleaned_text"].tolist()
            labels = balanced_df["job_role"].tolist()

            X_tr, X_te, y_tr, y_te = train_test_split(
                texts, labels,
                test_size=Config.TEST_SPLIT,
                random_state=Config.RANDOM_SEED,
                stratify=labels,
            )

            st.info("Generating sentence embeddings (one-time, ~2-5 min)…")
            emb_tr = self.encoder.encode(
                X_tr, show_progress_bar=False, convert_to_numpy=True, batch_size=64,
            )
            emb_te = self.encoder.encode(
                X_te, show_progress_bar=False, convert_to_numpy=True, batch_size=64,
            )

            self.label_enc = LabelEncoder()
            y_tr_enc = self.label_enc.fit_transform(y_tr)

            # SVM outperforms LR on high-dimensional embedding spaces
            # CalibratedClassifierCV adds predict_proba() support
            from sklearn.svm import LinearSVC
            from sklearn.calibration import CalibratedClassifierCV

            base_svm = LinearSVC(
                C=0.8,                    # slight regularisation — prevents overfit
                max_iter=3000,
                class_weight="balanced",  # handles any remaining imbalance
                random_state=Config.RANDOM_SEED,
                dual=True,
            )
            self.classifier = CalibratedClassifierCV(
                base_svm, cv=3, method="sigmoid",
            )
            self.classifier.fit(emb_tr, y_tr_enc)

            st.info("Saving model to cache for future startups…")
            self._save_cache(emb_tr, emb_te, y_tr, y_te, data_hash)
            st.success("Model trained and cached ✓")

        # ── Metrics (always computed) 
        y_tr_enc = self.label_enc.transform(y_tr)
        y_te_enc = self.label_enc.transform(y_te)

        self.train_metrics = {
            "accuracy": accuracy_score(y_tr_enc, self.classifier.predict(emb_tr)),
            "samples": len(y_tr),
        }
        preds_te = self.classifier.predict(emb_te)
        prec, rec, f1, _ = precision_recall_fscore_support(
            y_te_enc, preds_te, average="weighted", zero_division=0
        )
        self.test_metrics = {
            "accuracy": accuracy_score(y_te_enc, preds_te),
            "precision": prec,
            "recall": rec,
            "f1": f1,
            "samples": len(y_te),
        }
        self.conf_matrix = confusion_matrix(y_te_enc, preds_te)
        self.class_labels = self.label_enc.classes_
        self.y_test  = y_te
        self.preds_test = [self.label_enc.inverse_transform([p])[0] for p in preds_te]

        st.success(
            f"Classifier ready — Train acc: {self.train_metrics['accuracy']:.1%} | "
            f"Test acc: {self.test_metrics['accuracy']:.1%}"
        )

    # ── Job indexing 
    def _index_jobs(self):
        # Combine title + description + skills for richer semantic matching
        self.job_df["combined_text"] = (
            self.job_df["title"].fillna("") + " "
            + self.job_df["description"].fillna("") + " "
            + self.job_df.get("skills_list", pd.Series([""] * len(self.job_df))).fillna("")
        )
        self.job_df["cleaned_combined"] = self.job_df["combined_text"].apply(
            self.processor.clean_text
        )

        job_hash = str(len(self.job_df))  # simple version: re-index if row count changes
        job_cache_valid = (
            os.path.exists(Config.CACHE_JOB_EMB)
            and os.path.exists(Config.CACHE_META)
            and json.load(open(Config.CACHE_META)).get("job_count") == job_hash
        )

        if job_cache_valid:
            st.info("Loading job index from cache…")
            arr = np.load(Config.CACHE_JOB_EMB)
            import torch
            self.job_embeddings = torch.tensor(arr)
            st.success(f"Job index loaded from cache ✓  ({len(self.job_df):,} jobs)")
        else:
            st.info(f"Indexing {len(self.job_df):,} jobs (one-time, ~2-5 min)…")
            self.job_embeddings = self.encoder.encode(
                self.job_df["cleaned_combined"].tolist(),
                show_progress_bar=False,
                convert_to_tensor=True,
            )
            os.makedirs(Config.CACHE_DIR, exist_ok=True)
            np.save(Config.CACHE_JOB_EMB, self.job_embeddings.cpu().numpy())
            # Update meta with job count
            meta_path = Config.CACHE_META
            meta = json.load(open(meta_path)) if os.path.exists(meta_path) else {}
            meta["job_count"] = job_hash
            json.dump(meta, open(meta_path, "w"))
            st.success(f"Indexed and cached {len(self.job_df):,} jobs ✓")

    # ── Skill extraction 
    def extract_skills(self, text: str) -> Dict[str, List[str]]:
        lower = text.lower()
        tech, soft = [], []

        # Technical: pattern variants
        for skill, patterns in Config.TECH_SKILLS.items():
            if any(re.search(r"\b" + re.escape(p) + r"\b", lower) for p in patterns):
                tech.append(skill)

        # Soft skills: dictionary with variants (fixes HR/management CVs)
        for skill_name, variants in Config.SOFT_SKILLS.items():
            for variant in variants:
                if re.search(r"\b" + re.escape(variant.lower()) + r"\b", lower):
                    soft.append(skill_name)
                    break  # Only add once per skill

        # Action-based soft skill detection (catches experience-described skills)
        for action, skill_name in Config.ACTION_TO_SKILL.items():
            if re.search(r"\b" + re.escape(action) + r"\b", lower):
                soft.append(skill_name)

        return {"technical": sorted(set(tech)), "soft": sorted(set(soft))}

    # ── Quality scoring 
    def score_quality(self, text: str, skills: Dict) -> Dict:
        score, tips = 0, []
        length = len(text)

        # Content length (20 pts) — larger detailed CVs score full marks
        if length > 3000:
            score += 20
        elif length > 2000:
            score += 18
        elif length > 1000:
            score += 15
            tips.append("Expand descriptions with more detail")
        else:
            score += 10
            tips.append("Resume is short — add experience & projects")

        # Technical skills (20 pts)
        n_tech = len(skills["technical"])
        if n_tech >= 8:
            score += 20
        elif n_tech >= 5:
            score += 15
            tips.append("Add more technical skills relevant to your role")
        else:
            score += 10
            tips.append("Limited technical skills detected")

        # Soft skills (10 pts)
        n_soft = len(skills["soft"])
        if n_soft >= 5:
            score += 10
        elif n_soft >= 3:
            score += 7
        else:
            score += 5
            tips.append("Include soft skills like leadership & communication")

        # Action keywords (20 pts)
        keywords = [
            "experience",
            "project",
            "developed",
            "managed",
            "led",
            "achieved",
            "implemented",
        ]
        hit = sum(1 for k in keywords if k in text.lower())
        if hit >= 6:
            score += 20
        elif hit >= 4:
            score += 15
        else:
            score += 10
            tips.append("Use action verbs: developed, managed, led, achieved")

        # Quantifiable achievements (15 pts)
        nums = len(re.findall(r"\b\d+\b", text)) + len(re.findall(r"\d+%", text))
        if nums >= 5:
            score += 15
        elif nums >= 3:
            score += 10
        else:
            score += 5
            tips.append("Add numbers/percentages to quantify achievements")

        # Structured sections (15 pts) — check raw text, headers not removed here
        has_sections = any(
            s in text.lower()
            for s in ["education", "experience", "skills", "projects", "work history", "employment"]
        )
        score += 15 if has_sections else 10
        if not has_sections:
            tips.append("Add clear section headers: Education, Experience, Skills")

        grade = (
            "Excellent"
            if score >= 85
            else (
                "Good"
                if score >= 70
                else "Average" if score >= 50 else "Needs Improvement"
            )
        )

        return {"score": score, "max": 100, "grade": grade, "tips": tips}

    # ── Skill gap analysis 
    def skill_gap(self, candidate: Dict, required: List[str]) -> Dict:
        # Normalise to lowercase for comparison — fixes "Python" vs "python" mismatch
        have_lower = {s.lower() for s in candidate["technical"] + candidate["soft"]}
        need_original = [s.strip() for s in required if s.strip()]
        need_lower = {s.lower() for s in need_original}

        matched_lower = have_lower & need_lower
        missing_lower = need_lower - have_lower

        # Restore original casing for display
        matched = sorted(
            s for s in need_original if s.lower() in matched_lower
        )
        missing = sorted(
            s for s in need_original if s.lower() in missing_lower
        )
        pct = (len(matched) / len(need_original) * 100) if need_original else 0
        return {
            "matched": matched,
            "missing": missing,
            "pct": pct,
            "n_required": len(need_original),
            "n_matched": len(matched),
        }

    # ── Full analysis pipeline 
    def analyse(self, cv_text: str) -> Optional[Dict]:
        if not self.is_trained:
            st.error("Model not trained — check resumes.csv")
            return None

        cleaned = self.processor.clean_text(cv_text)
        if not cleaned:
            st.error("Resume appears empty after cleaning")
            return None

        # Embed resume
        emb = self.encoder.encode(cleaned, convert_to_tensor=True)
        emb_np = emb.cpu().numpy().reshape(1, -1)

        # Role prediction
        pred_id = self.classifier.predict(emb_np)[0]
        pred_role = self.label_enc.inverse_transform([pred_id])[0]
        probs = self.classifier.predict_proba(emb_np)[0]
        confidence = float(np.max(probs))

        top3 = [
            {
                "role": self.label_enc.inverse_transform([i])[0],
                "confidence": float(probs[i]),
            }
            for i in np.argsort(probs)[-3:][::-1]
        ]

        # ── "Why this role" — top keywords from resume that match predicted role ──
        # Extract meaningful words (>3 chars, not stopwords), rank by how strongly
        # they appear in resumes of the predicted role using LR coefficients.
        explanation_keywords: List[str] = []
        try:
            role_idx = list(self.label_enc.classes_).index(pred_role)
            coef_row = self.classifier.coef_[role_idx]  # shape: (n_embedding_dims,)
            # Project resume embedding onto classifier weights → get per-word relevance
            words = [
                w for w in set(cleaned.split())
                if len(w) > 3 and w.isalpha()
            ]
            if words:
                word_embs = self.encoder.encode(words, convert_to_numpy=True)
                # Score each word by dot product with the role's weight vector
                scores = word_embs @ coef_row
                top_idx = np.argsort(scores)[-8:][::-1]
                explanation_keywords = [words[i].title() for i in top_idx if scores[i] > 0]
        except Exception:
            pass  # Explanation is optional — never crash on it

        # Skills and quality
        skills = self.extract_skills(cv_text)
        quality = self.score_quality(cv_text, skills)

        # Job matching
        matches = []
        if self.has_job_db:
            results = util.semantic_search(
                emb, self.job_embeddings, top_k=Config.TOP_K_JOBS
            )[0]
            for r in results:
                if r["score"] < Config.MIN_JOB_SCORE:
                    continue
                row = self.job_df.iloc[r["corpus_id"]]
                reqs = [
                    s.strip()
                    for s in str(row.get("skills_list", "")).split("|")
                    if s.strip() and s.strip() != "nan"
                ]
                gap = self.skill_gap(skills, reqs)
                matches.append(
                    {
                        "title": row["title"],
                        "company": row["company"],
                        "description": row["description"],
                        "score": round(r["score"] * 100, 1),
                        "gap": gap,
                    }
                )

        return {
            "role": pred_role,
            "confidence": confidence,
            "alt_roles": top3,
            "explanation": explanation_keywords,
            "skills": skills,
            "quality": quality,
            "matches": matches,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        }


# PLOTLY CHART HELPERS  (dark-themed)
def _dark_layout(**kwargs) -> dict:
    """Base Plotly layout for dark theme."""
    return dict(
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font=dict(family="Outfit", color="#8899B4", size=11),
        margin=dict(l=20, r=20, t=40, b=20),
        **kwargs,
    )


def chart_confusion(matrix: np.ndarray, labels: List[str]) -> go.Figure:
    fig = go.Figure(
        go.Heatmap(
            z=matrix,
            x=labels,
            y=labels,
            colorscale=[[0, "#0C1020"], [0.5, "#1C2540"], [1, "#22D3EE"]],
            text=matrix,
            texttemplate="%{text}",
            textfont=dict(size=12, color="#F0F6FF"),
            hoverongaps=False,
        )
    )
    fig.update_layout(
        **_dark_layout(
            title="Confusion Matrix",
            xaxis_title="Predicted",
            yaxis_title="Actual",
            height=400,
        ),
        xaxis=dict(tickfont=dict(size=10, color="#3D5070")),
        yaxis=dict(tickfont=dict(size=10, color="#3D5070")),
    )
    return fig


def chart_gauge(value: float, title: str) -> go.Figure:
    pct = value * 100
    color = Config.EMERALD if pct >= 80 else Config.AMBER if pct >= 60 else Config.ROSE
    fig = go.Figure(
        go.Indicator(
            mode="gauge+number",
            value=pct,
            title=dict(text=title, font=dict(size=14, color="#8899B4")),
            number=dict(suffix="%", font=dict(size=30, color=Config.T1)),
            gauge=dict(
                axis=dict(range=[0, 100], tickcolor="#3D5070"),
                bar=dict(color=color, thickness=0.7),
                bgcolor="#1C2540",
                borderwidth=0,
                steps=[
                    dict(range=[0, 60], color="rgba(251,113,133,.12)"),
                    dict(range=[60, 80], color="rgba(251,191,36,.12)"),
                    dict(range=[80, 100], color="rgba(52,211,153,.12)"),
                ],
            ),
        )
    )
    fig.update_layout(**_dark_layout(height=240))
    return fig


def chart_role_bars(alt_roles: List[Dict]) -> go.Figure:
    roles = [r["role"] for r in alt_roles]
    confs = [r["confidence"] * 100 for r in alt_roles]
    colors = [Config.CYAN, Config.VIOLET, Config.T3]

    fig = go.Figure(
        go.Bar(
            x=confs,
            y=roles,
            orientation="h",
            marker=dict(color=colors[: len(roles)], line=dict(width=0)),
            text=[f"{c:.1f}%" for c in confs],
            textposition="outside",
            textfont=dict(color="#8899B4", size=11),
        )
    )
    fig.update_layout(
        **_dark_layout(
            title="Role Confidence",
            height=220,
            xaxis=dict(range=[0, 110], showgrid=False, zeroline=False),
            yaxis=dict(showgrid=False),
        ),
    )
    return fig


def chart_quality_donut(quality: Dict) -> go.Figure:
    score = quality["score"]
    color = (
        Config.EMERALD
        if score >= 85
        else (
            Config.CYAN if score >= 70 else Config.AMBER if score >= 50 else Config.ROSE
        )
    )
    fig = go.Figure(
        go.Pie(
            labels=["Score", "Remaining"],
            values=[score, 100 - score],
            hole=0.65,
            marker=dict(colors=[color, "#1C2540"]),
            textinfo="none",
        )
    )
    fig.add_annotation(
        text=f"<b>{score}</b><br><span style='font-size:11px'>/ 100</span>",
        x=0.5,
        y=0.5,
        showarrow=False,
        font=dict(size=24, color=Config.T1),
    )
    fig.update_layout(
        **_dark_layout(title="Quality Score", height=260, showlegend=False)
    )
    return fig


# SIDEBAR
def render_sidebar(engine: AIEngine):
    with st.sidebar:
        # Brand
        st.markdown(
            f'<div style="display:flex;align-items:center;gap:11px;padding:16px 4px 18px;'
            f'border-bottom:1px solid #1E2A3F;margin-bottom:16px;">'
            f'<div style="width:40px;height:40px;border-radius:10px;flex-shrink:0;'
            f"background:linear-gradient(135deg,rgba(34,211,238,.15),rgba(167,139,250,.15));"
            f"border:1px solid rgba(34,211,238,.25);display:flex;align-items:center;"
            f"justify-content:center;box-shadow:0 0 16px rgba(34,211,238,.15);"
            f'animation:float 3s ease-in-out infinite;">'
            f'{ic("scan-search",20,"#22D3EE")}</div>'
            f'<div><div style="font-size:1rem;font-weight:800;color:#F0F6FF;">Resume Analyzer</div>'
            f"<div style=\"font-family:'JetBrains Mono',monospace;font-size:.58rem;"
            f'color:#3D5070;letter-spacing:.06em;margin-top:1px;">PRO</div></div>'
            f"</div>",
            unsafe_allow_html=True,
        )

        # ── Classifier status ─────────────────────────────────────────────────
        pulse = "animation:glowPulse 2.5s ease-in-out infinite;box-shadow:0 0 8px rgba(52,211,153,.25);"
        status_color = Config.EMERALD if engine.is_trained else Config.ROSE
        status_label = "ACTIVE" if engine.is_trained else "OFFLINE"

        st.markdown(
            f'<div class="lift" style="background:#0C1020;border:1px solid #1E2A3F;'
            f'border-radius:9px;padding:13px 14px;margin-bottom:10px;">'
            f'<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">'
            f'{ic("cpu",14,Config.CYAN)}'
            f'<span style="font-size:.69rem;font-weight:700;color:#8899B4;'
            f'text-transform:uppercase;letter-spacing:.1em;">Classifier</span>'
            f'<span style="margin-left:auto;background:rgba(52,211,153,.12);'
            f"border:1px solid rgba(52,211,153,.3);color:{status_color};font-size:.59rem;"
            f"font-weight:700;padding:2px 9px;border-radius:10px;"
            f"font-family:'JetBrains Mono',monospace;{pulse}\">{status_label}</span>"
            f"</div>",
            unsafe_allow_html=True,
        )

        if engine.is_trained:
            sidebar_stat(
                "users", "Train samples", f"{engine.train_metrics['samples']:,}"
            )
            sidebar_stat(
                "trending-up",
                "Train accuracy",
                f"{engine.train_metrics['accuracy']:.1%}",
                Config.EMERALD,
            )
            sidebar_stat(
                "activity",
                "Test accuracy",
                f"{engine.test_metrics['accuracy']:.1%}",
                Config.EMERALD,
            )
            sidebar_stat(
                "zap", "F1 score", f"{engine.test_metrics['f1']:.1%}", Config.CYAN
            )
        st.markdown("</div>", unsafe_allow_html=True)

        # ── Job DB status ─────────────────────────────────────────────────────
        db_status = "INDEXED" if engine.has_job_db else "INACTIVE"
        db_color = Config.EMERALD if engine.has_job_db else Config.AMBER
        st.markdown(
            f'<div class="lift" style="background:#0C1020;border:1px solid #1E2A3F;'
            f'border-radius:9px;padding:13px 14px;margin-bottom:10px;">'
            f'<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">'
            f'{ic("database",14,Config.VIOLET)}'
            f'<span style="font-size:.69rem;font-weight:700;color:#8899B4;'
            f'text-transform:uppercase;letter-spacing:.1em;">Job Database</span>'
            f'<span style="margin-left:auto;background:rgba(52,211,153,.12);'
            f"border:1px solid rgba(52,211,153,.3);color:{db_color};font-size:.59rem;"
            f"font-weight:700;padding:2px 9px;border-radius:10px;"
            f"font-family:'JetBrains Mono',monospace;\">{db_status}</span>"
            f"</div>",
            unsafe_allow_html=True,
        )
        if engine.has_job_db:
            sidebar_stat("briefcase", "Total positions", f"{len(engine.job_df):,}")
        sidebar_stat("layers", "Encoder model", Config.EMBED_MODEL)
        sidebar_stat("grid", "Vector dims", "384-d")
        st.markdown("</div>", unsafe_allow_html=True)

        # ── Training distribution 
        if engine.is_trained:
            st.markdown(
                f'<div style="display:flex;align-items:center;gap:8px;margin:16px 0 12px;">'
                f'{ic("bar-chart-2",13,"#3D5070")}'
                f'<span style="font-size:.69rem;font-weight:700;color:#3D5070;'
                f'text-transform:uppercase;letter-spacing:.1em;">Training Distribution</span>'
                f"</div>",
                unsafe_allow_html=True,
            )
            counts = engine.resume_df["job_role"].value_counts()
            total = len(engine.resume_df)
            palette = [
                Config.CYAN,
                Config.VIOLET,
                Config.EMERALD,
                Config.AMBER,
                Config.ROSE,
                "#64748B",
            ]
            for i, (role, cnt) in enumerate(counts.head(6).items()):
                dist_bar(role, cnt, total, palette[i % len(palette)], delay=i * 0.06)


# HEADER
def render_header(engine: AIEngine):
    model_badge = badge_pill(
        "check-circle",
        "Model Ready",
        "rgba(52,211,153,.1)",
        "#34D399",
        "rgba(52,211,153,.3)",
    )
    jobs_count = (
        f"{len(engine.job_df):,} Jobs Indexed" if engine.has_job_db else "No Job DB"
    )
    job_badge = badge_pill(
        "database", jobs_count, "rgba(34,211,238,.1)", "#22D3EE", "rgba(34,211,238,.3)"
    )

    st.markdown(
        f'<div style="background:linear-gradient(90deg,#22D3EE44,#A78BFA44,#34D39944,#22D3EE44);'
        f"background-size:300% 100%;animation:borderFlow 4s ease infinite;"
        f'border-radius:13px;padding:3px;margin-bottom:22px;margin-top:4px;overflow:hidden;">'
        f'<div style="background:linear-gradient(135deg,#111827,#151E30);'
        f'border-radius:11px;padding:18px 22px;">'
        f'<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;">'
        f'<div style="width:48px;height:48px;border-radius:12px;flex-shrink:0;'
        f"background:linear-gradient(135deg,rgba(34,211,238,.15),rgba(167,139,250,.15));"
        f"border:1px solid rgba(34,211,238,.3);display:flex;align-items:center;justify-content:center;"
        f'box-shadow:0 0 24px rgba(34,211,238,.2);animation:float 4s ease-in-out infinite;">'
        f'{ic("scan-search",22,"#22D3EE")}</div>'
        f'<div style="flex:1;min-width:180px;animation:fadeUp .5s ease .1s both;">'
        f'<h1 style="font-size:1.4rem;font-weight:800;color:#F0F6FF;margin:0;letter-spacing:-.02em;'
        f'white-space:nowrap;">AI Resume Analyzer</h1>'
        f'<p style="font-size:.75rem;color:#8899B4;margin:5px 0 0;letter-spacing:.01em;'
        f'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'
        f"Role Classification &nbsp;·&nbsp; Semantic Job Matching "
        f"&nbsp;·&nbsp; Skill Extraction &nbsp;·&nbsp; Quality Scoring</p>"
        f"</div>"
        f'<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;'
        f'animation:fadeUp .5s ease .3s both;margin-left:auto;">'
        f"{model_badge}&nbsp;{job_badge}"
        f"</div></div></div></div>",
        unsafe_allow_html=True,
    )


# TAB 1 — ANALYSE RESUME
def render_analysis_tab(engine: AIEngine):
    col_in, col_out = st.columns([1, 1], gap="large")

    # ── Left: Input 
    with col_in:
        section_hdr("file-text", "Resume Input", Config.CYAN)

        tab_paste, tab_upload = st.tabs(["  Paste Text  ", "  Upload File  "])
        cv_text = ""

        with tab_paste:
            raw = st.text_area(
                "cv_paste",
                label_visibility="collapsed",
                height=330,
                placeholder=(
                    "Paste your complete resume here…\n\n"
                    "Include:\n"
                    "  •  Work experience & achievements\n"
                    "  •  Technical & soft skills\n"
                    "  •  Education & certifications\n"
                    "  •  Projects & publications\n\n"
                    "More detail → richer analysis"
                ),
            )
            if raw:
                cv_text = raw

        with tab_upload:
            uploaded = st.file_uploader(
                "cv_file", type=["txt", "pdf"], label_visibility="collapsed"
            )
            if uploaded:
                if uploaded.type == "text/plain":
                    cv_text = uploaded.read().decode("utf-8")
                    st.success(f"Loaded: **{uploaded.name}**")
                elif uploaded.type == "application/pdf":
                    try:
                        import PyPDF2

                        reader = PyPDF2.PdfReader(uploaded)
                        cv_text = "".join(p.extract_text() or "" for p in reader.pages)
                        st.success(f"Extracted text from **{uploaded.name}**")
                    except ImportError:
                        st.error("Install PyPDF2:  pip install PyPDF2")
                    except Exception as e:
                        st.error(f"PDF read error: {e}")

        if cv_text and not cv_text.startswith("["):
            char_count = len(cv_text)
            word_count = len(cv_text.split())
            st.markdown(
                f'<div style="display:flex;align-items:center;gap:8px;margin:10px 0 4px;">'
                f'<span style="background:rgba(34,211,238,.08);border:1px solid rgba(34,211,238,.2);'
                f"color:#22D3EE;font-family:'JetBrains Mono',monospace;font-size:.7rem;"
                f'font-weight:600;padding:4px 12px;border-radius:20px;">'
                f'{ic("file-text",11,"#22D3EE")} &nbsp;{char_count:,} chars</span>'
                f'<span style="background:rgba(167,139,250,.08);border:1px solid rgba(167,139,250,.2);'
                f"color:#A78BFA;font-family:'JetBrains Mono',monospace;font-size:.7rem;"
                f'font-weight:600;padding:4px 12px;border-radius:20px;">'
                f'{ic("layers",11,"#A78BFA")} &nbsp;{word_count:,} words</span>'
                f'</div>',
                unsafe_allow_html=True,
            )

        # Feature summary panel
        features = [
            ("target", Config.CYAN, "Role classification via sentence embeddings"),
            (
                "search",
                Config.EMERALD,
                "Semantic similarity search across job database",
            ),
            ("code-2", Config.VIOLET, "Technical & soft skill extraction"),
            ("award", Config.AMBER, "Resume quality scoring (0 – 100)"),
            ("bar-chart-2", Config.ROSE, "Skill gap analysis per job match"),
        ]
        rows_html = "".join(
            f'<div style="display:flex;align-items:center;gap:11px;padding:8px 10px;'
            f"border-radius:7px;transition:background .18s;cursor:default;"
            f'animation:fadeUp .35s ease {.05*i}s both;"'
            f" onmouseover=\"this.style.background='rgba(34,211,238,.05)'\""
            f" onmouseout=\"this.style.background='transparent'\">"
            f'<div style="width:26px;height:26px;border-radius:6px;flex-shrink:0;'
            f"background:rgba({_rgb(c)},.1);border:1px solid rgba({_rgb(c)},.2);"
            f'display:flex;align-items:center;justify-content:center;">{ic(ico,13,c)}</div>'
            f'<span style="font-size:.8rem;color:#8899B4;">{txt}</span></div>'
            for i, (ico, c, txt) in enumerate(features)
        )
        st.markdown(
            f'<div style="background:#0C1020;border:1px solid #1E2A3F;border-radius:9px;'
            f'padding:12px 14px;margin-top:14px;">'
            f'<p style="font-size:.68rem;font-weight:700;color:#3D5070;text-transform:uppercase;'
            f'letter-spacing:.12em;margin:0 0 10px;">What gets analyzed</p>'
            f"{rows_html}</div>",
            unsafe_allow_html=True,
        )

        st.markdown("<div style='height:14px'></div>", unsafe_allow_html=True)
        btn = st.button(
            "Analyze CV",
            type="primary",
            use_container_width=True,
            disabled=not cv_text or not engine.is_trained,
        )

    # ── Right: Results 
    with col_out:
        section_hdr("activity", "Analysis Results", Config.VIOLET, delay=0.05)

        if btn and cv_text:
            with st.spinner("Analysing your CV with AI…"):
                results = engine.analyse(cv_text)

            if not results:
                return

            # ── Role prediction ─
            section_stripe("target", "Role Prediction", Config.CYAN)

            role_name = results["role"]
            conf_val = results["confidence"]
            conf_pct = f"{conf_val:.1%}"
            level = "High" if conf_val >= 0.8 else "Medium" if conf_val >= 0.6 else "Low"
            level_color = Config.EMERALD if conf_val >= 0.8 else Config.AMBER if conf_val >= 0.6 else Config.ROSE

            st.markdown(
                f'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:14px;">'
                # Card 1 — Predicted Role (allows text wrapping)
                f'<div style="background:#111827;border:1px solid #1E2A3F;border-radius:9px;padding:16px 18px;">'
                f'<div style="font-family:\'JetBrains Mono\',monospace;font-size:.6rem;color:#8899B4;'
                f'text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px;">Predicted Role</div>'
                f'<div style="font-size:1.1rem;font-weight:700;color:#F0F6FF;line-height:1.3;'
                f'word-break:break-word;white-space:normal;">{role_name}</div>'
                f'</div>'
                # Card 2 — Confidence
                f'<div style="background:#111827;border:1px solid #1E2A3F;border-radius:9px;padding:16px 18px;">'
                f'<div style="font-family:\'JetBrains Mono\',monospace;font-size:.6rem;color:#8899B4;'
                f'text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px;">Confidence</div>'
                f'<div style="font-size:1.55rem;font-weight:700;color:#F0F6FF;">{conf_pct}</div>'
                f'</div>'
                # Card 3 — Signal Strength
                f'<div style="background:#111827;border:1px solid #1E2A3F;border-radius:9px;padding:16px 18px;">'
                f'<div style="font-family:\'JetBrains Mono\',monospace;font-size:.6rem;color:#8899B4;'
                f'text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px;">Signal Strength</div>'
                f'<div style="font-size:1.55rem;font-weight:700;color:{level_color};">{level}</div>'
                f'</div>'
                f'</div>',
                unsafe_allow_html=True,
            )

            st.markdown("<div style='height:10px'></div>", unsafe_allow_html=True)
            colors = [Config.CYAN, Config.VIOLET, "#3D5070"]
            for i, r in enumerate(results["alt_roles"]):
                conf_bar(r["role"], r["confidence"] * 100, colors[i], delay=i * 0.08)

            # ── Why this role? — keyword explanation 
            if results.get("explanation"):
                kw_tags = "".join(
                    skill_tag(
                        kw,
                        "rgba(34,211,238,.08)",
                        "#67E8F9",
                        "rgba(34,211,238,.25)",
                        "rgba(34,211,238,.3)",
                        delay=i * 0.05,
                    )
                    for i, kw in enumerate(results["explanation"])
                )
                st.markdown(
                    f'<div style="margin-top:14px;background:#0C1020;border:1px solid #1E2A3F;'
                    f'border-left:3px solid {Config.CYAN};border-radius:0 9px 9px 0;padding:13px 16px;">'
                    f'<div style="display:flex;align-items:center;gap:7px;margin-bottom:10px;">'
                    f'{ic("zap",13,Config.CYAN)}'
                    f'<span style="font-size:.67rem;font-weight:700;color:{Config.CYAN};'
                    f'text-transform:uppercase;letter-spacing:.12em;">Why this role?</span>'
                    f'</div>'
                    f'<div style="font-size:.76rem;color:#8899B4;margin-bottom:8px;line-height:1.6;">'
                    f'Top keywords from your CV that drove this prediction:</div>'
                    f'<div>{kw_tags}</div>'
                    f'</div>',
                    unsafe_allow_html=True,
                )

            # Optionally show Plotly chart for richer viz
            with st.expander("View confidence chart"):
                st.plotly_chart(
                    chart_role_bars(results["alt_roles"]), use_container_width=True
                )

            st.markdown("<hr>", unsafe_allow_html=True)

            # ── Quality score 
            section_stripe("award", "Resume Quality", Config.AMBER)
            qa1, qa2 = st.columns([1, 2])
            q = results["quality"]
            grade_color = {
                "Excellent": Config.EMERALD,
                "Good": Config.CYAN,
                "Average": Config.AMBER,
                "Needs Improvement": Config.ROSE,
            }[q["grade"]]

            with qa1:
                st.plotly_chart(chart_quality_donut(q), use_container_width=True)

            with qa2:
                # Score breakdown bars
                breakdown = [
                    ("Content Depth", min(q["score"] // 5, 20), 20),
                    (
                        "Technical Skills",
                        min(len(results["skills"]["technical"]) * 2, 20),
                        20,
                    ),
                    ("Soft Skills", min(len(results["skills"]["soft"]) * 2, 10), 10),
                    ("Action Keywords", 15 if q["score"] > 50 else 10, 20),
                    ("Achievements", 10 if q["score"] > 60 else 5, 15),
                    ("Formatting", 15, 15),
                ]
                for i, (lbl, val, tot) in enumerate(breakdown):
                    c = (
                        Config.EMERALD
                        if val == tot
                        else Config.CYAN if val / tot >= 0.7 else Config.AMBER
                    )
                    animated_bar(lbl, val, tot, c, delay=i * 0.07)

            for tip in q["tips"]:
                st.markdown(
                    f'<div style="display:flex;align-items:flex-start;gap:10px;'
                    f"background:rgba(251,191,36,.04);border:1px solid rgba(251,191,36,.2);"
                    f"border-left:3px solid {Config.AMBER};border-radius:0 7px 7px 0;"
                    f'padding:11px 14px;margin-top:8px;transition:background .2s;" '
                    f"onmouseover=\"this.style.background='rgba(251,191,36,.07)'\" "
                    f"onmouseout=\"this.style.background='rgba(251,191,36,.04)'\">"
                    f'{ic("info",14,Config.AMBER)}'
                    f'<span style="font-size:.8rem;color:#8899B4;line-height:1.65;">{tip}</span>'
                    f"</div>",
                    unsafe_allow_html=True,
                )
            if not q["tips"]:
                st.markdown(
                    f'<div style="display:flex;align-items:center;gap:10px;'
                    f"background:rgba(52,211,153,.05);border:1px solid rgba(52,211,153,.2);"
                    f'border-radius:7px;padding:12px 14px;margin-top:8px;">'
                    f'{ic("check-circle",15,Config.EMERALD)}'
                    f'<span style="font-size:.82rem;color:{Config.EMERALD};">'
                    f"Excellent resume — no major improvements needed!</span></div>",
                    unsafe_allow_html=True,
                )

            st.markdown("<hr>", unsafe_allow_html=True)

            # ── Skills 
            section_stripe("code-2", "Extracted Skills", Config.VIOLET)
            sk1, sk2 = st.columns(2)

            with sk1:
                tech = results["skills"]["technical"]
                tags = "".join(
                    skill_tag(
                        s,
                        "rgba(34,211,238,.1)",
                        "#67E8F9",
                        "rgba(34,211,238,.3)",
                        "rgba(34,211,238,.4)",
                        delay=i * 0.04,
                    )
                    for i, s in enumerate(tech)
                )
                empty = (
                    f'<span style="font-size:.8rem;color:#3D5070;">None detected</span>'
                )
                st.markdown(
                    f'<div class="lift" style="background:#0C1020;border:1px solid #1E2A3F;'
                    f'border-radius:9px;padding:14px;">'
                    f'<div style="display:flex;align-items:center;gap:7px;margin-bottom:11px;">'
                    f'{ic("code-2",13,Config.CYAN)}'
                    f'<span style="font-size:.68rem;font-weight:700;color:{Config.CYAN};'
                    f'text-transform:uppercase;letter-spacing:.1em;">'
                    f"Technical · {len(tech)}</span></div>"
                    f"{tags if tech else empty}</div>",
                    unsafe_allow_html=True,
                )

            with sk2:
                soft = results["skills"]["soft"]
                tags2 = "".join(
                    skill_tag(
                        s,
                        "rgba(167,139,250,.1)",
                        "#C4B5FD",
                        "rgba(167,139,250,.3)",
                        "rgba(167,139,250,.4)",
                        delay=i * 0.06,
                    )
                    for i, s in enumerate(soft)
                )
                st.markdown(
                    f'<div class="lift" style="background:#0C1020;border:1px solid #1E2A3F;'
                    f'border-radius:9px;padding:14px;">'
                    f'<div style="display:flex;align-items:center;gap:7px;margin-bottom:11px;">'
                    f'{ic("users",13,Config.VIOLET)}'
                    f'<span style="font-size:.68rem;font-weight:700;color:{Config.VIOLET};'
                    f'text-transform:uppercase;letter-spacing:.1em;">'
                    f"Soft Skills · {len(soft)}</span></div>"
                    f"{tags2 if soft else empty}</div>",
                    unsafe_allow_html=True,
                )

            st.markdown("<hr>", unsafe_allow_html=True)

            # ── Job matches 
            section_stripe("briefcase", "Top Job Matches", Config.ROSE)

            if not results["matches"]:
                st.markdown(
                    f'<div style="display:flex;align-items:center;gap:10px;'
                    f"background:rgba(251,191,36,.05);border:1px solid rgba(251,191,36,.2);"
                    f'border-radius:8px;padding:14px;">'
                    f'{ic("alert-circle",16,Config.AMBER)}'
                    f'<span style="font-size:.82rem;color:#8899B4;">'
                    f"No job matches found. Ensure jobs.csv is present and loaded.</span></div>",
                    unsafe_allow_html=True,
                )
            else:
                for idx, job in enumerate(results["matches"]):
                    sc = job["score"]
                    # Match quality tier
                    if sc >= 70:
                        acc, adim, abd = Config.EMERALD, "rgba(52,211,153,.1)", "rgba(52,211,153,.3)"
                        badge_label = "🔥 Best Match"
                    elif sc >= 50:
                        acc, adim, abd = Config.AMBER, "rgba(251,191,36,.1)", "rgba(251,191,36,.3)"
                        badge_label = "⭐ Good Match"
                    else:
                        acc, adim, abd = Config.CYAN, "rgba(34,211,238,.1)", "rgba(34,211,238,.3)"
                        badge_label = "📌 Average Match"
                    ra = _rgb(acc)

                    with st.expander(
                        f"{badge_label}  ·  {job['title']}  ·  {job['company']}  ·  {sc}% match",
                        expanded=(idx == 0),
                    ):
                        # Header row
                        st.markdown(
                            f'<div style="display:flex;align-items:flex-start;'
                            f'justify-content:space-between;margin-bottom:10px;">'
                            f"<div>"
                            f'<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;">'
                            f'{ic("briefcase",15,"#8899B4")}'
                            f'<span style="font-size:.93rem;font-weight:700;color:#F0F6FF;">{job["title"]}</span>'
                            f'<span style="font-size:.8rem;color:#3D5070;">at {job["company"]}</span>'
                            f"</div></div>"
                            f'<span style="background:{adim};border:1px solid {abd};color:{acc};'
                            f"font-size:.71rem;font-weight:700;padding:4px 13px;border-radius:6px;"
                            f"font-family:'JetBrains Mono',monospace;white-space:nowrap;"
                            f'box-shadow:0 0 12px rgba({ra},.25);">{sc}%</span>'
                            f"</div>"
                            f'<div style="background:#1C2540;border-radius:4px;height:5px;'
                            f'overflow:hidden;margin-bottom:12px;">'
                            f'<div style="--w:{sc}%;width:0;height:100%;background:{acc};border-radius:4px;'
                            f"box-shadow:0 0 10px rgba({ra},.5);"
                            f'animation:barFill 1s ease .1s both;"></div></div>'
                            f'<p style="font-size:.8rem;color:#8899B4;line-height:1.75;margin-bottom:14px;">'
                            f'{str(job["description"])[:400]}{"…" if len(str(job["description"]))>400 else ""}</p>',
                            unsafe_allow_html=True,
                        )

                        gap = job["gap"]
                        if gap["n_required"] > 0:
                            j1, j2, j3 = st.columns(3)
                            with j1:
                                st.metric("Skill Match", f"{gap['pct']:.0f}%")
                            with j2:
                                st.metric(
                                    "Skills Matched",
                                    f"{gap['n_matched']}/{gap['n_required']}",
                                )
                            with j3:
                                st.metric("Skills Missing", len(gap["missing"]))

                            # ── Matched skills (green) 
                            if gap["matched"]:
                                match_tags = "".join(
                                    skill_tag(
                                        s,
                                        "rgba(52,211,153,.1)",
                                        "#6EE7B7",
                                        "rgba(52,211,153,.3)",
                                        "rgba(52,211,153,.4)",
                                        delay=i * 0.04,
                                    )
                                    for i, s in enumerate(gap["matched"])
                                )
                                st.markdown(
                                    f'<div style="background:rgba(52,211,153,.04);'
                                    f"border:1px solid rgba(52,211,153,.2);"
                                    f"border-left:3px solid {Config.EMERALD};"
                                    f'border-radius:0 7px 7px 0;padding:11px 14px;margin-top:9px;">'
                                    f'<div style="display:flex;align-items:center;gap:7px;margin-bottom:8px;">'
                                    f'{ic("check-circle",13,Config.EMERALD)}'
                                    f'<span style="font-size:.68rem;font-weight:700;color:{Config.EMERALD};'
                                    f'text-transform:uppercase;letter-spacing:.1em;">Skills You Have</span>'
                                    f"</div>{match_tags}</div>",
                                    unsafe_allow_html=True,
                                )

                            # ── Missing skills (red) + learning recommendations 
                            if gap["missing"]:
                                miss_tags = "".join(
                                    skill_tag(
                                        s,
                                        "rgba(251,113,133,.1)",
                                        "#FCA5A5",
                                        "rgba(251,113,133,.3)",
                                        "rgba(251,113,133,.4)",
                                        delay=i * 0.06,
                                    )
                                    for i, s in enumerate(gap["missing"])
                                )
                                st.markdown(
                                    f'<div style="background:rgba(251,113,133,.04);'
                                    f"border:1px solid rgba(251,113,133,.2);"
                                    f"border-left:3px solid {Config.ROSE};"
                                    f'border-radius:0 7px 7px 0;padding:11px 14px;margin-top:9px;">'
                                    f'<div style="display:flex;align-items:center;gap:7px;margin-bottom:8px;">'
                                    f'{ic("x-circle",13,Config.ROSE)}'
                                    f'<span style="font-size:.68rem;font-weight:700;color:{Config.ROSE};'
                                    f'text-transform:uppercase;letter-spacing:.1em;">Skills to Develop</span>'
                                    f"</div>{miss_tags}</div>",
                                    unsafe_allow_html=True,
                                )

                                # ── Learning recommendations 
                                recs = [
                                    (skill, Config.SKILL_RECOMMENDATIONS[skill])
                                    for skill in gap["missing"]
                                    if skill in Config.SKILL_RECOMMENDATIONS
                                ]
                                if recs:
                                    rec_rows = "".join(
                                        f'<div style="display:flex;align-items:flex-start;gap:10px;'
                                        f'padding:9px 0;border-bottom:1px solid #1E2A3F;'
                                        f'animation:fadeUp .3s ease {ri*0.06}s both;">'
                                        f'<div style="min-width:6px;height:6px;border-radius:50%;'
                                        f'background:{Config.VIOLET};margin-top:6px;flex-shrink:0;"></div>'
                                        f'<div>'
                                        f'<span style="font-size:.76rem;font-weight:700;color:#C4B5FD;">{skill}</span>'
                                        f'<span style="font-size:.74rem;color:#8899B4;"> — {path}</span>'
                                        f'</div></div>'
                                        for ri, (skill, path) in enumerate(recs)
                                    )
                                    st.markdown(
                                        f'<div style="background:#0C1020;border:1px solid #1E2A3F;'
                                        f'border-left:3px solid {Config.VIOLET};'
                                        f'border-radius:0 9px 9px 0;padding:13px 16px;margin-top:10px;">'
                                        f'<div style="display:flex;align-items:center;gap:7px;margin-bottom:10px;">'
                                        f'{ic("book",13,Config.VIOLET)}'
                                        f'<span style="font-size:.68rem;font-weight:700;color:{Config.VIOLET};'
                                        f'text-transform:uppercase;letter-spacing:.1em;">Suggested Learning Path</span>'
                                        f'</div>{rec_rows}</div>',
                                        unsafe_allow_html=True,
                                    )

            st.markdown("<div style='height:10px'></div>", unsafe_allow_html=True)

            # Export
            export = {
                "predicted_role":    results["role"],
                "confidence":        results["confidence"],
                "alternative_roles": results["alt_roles"],
                "prediction_keywords": results.get("explanation", []),
                "quality_score":     results["quality"]["score"],
                "quality_grade":     results["quality"]["grade"],
                "improvement_tips":  results["quality"]["tips"],
                "skills":            results["skills"],
                "job_matches": [
                    {
                        "title":          m["title"],
                        "company":        m["company"],
                        "score":          m["score"],
                        "matched_skills": m["gap"]["matched"],
                        "missing_skills": m["gap"]["missing"],
                        "skill_match_pct": round(m["gap"]["pct"], 1),
                    }
                    for m in results["matches"]
                ],
                "timestamp": results["timestamp"],
            }
            st.download_button(
                label="Download Analysis Report (JSON)",
                data=json.dumps(export, indent=2),
                file_name=f"cv_analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
                mime="application/json",
                use_container_width=True,
            )

        else:
            # Empty state
            msg = (
                "👈 Upload or paste a resume, then click **Analyze CV**"
                if not engine.is_trained
                else "Paste or upload a resume on the left, then click **Analyze CV**"
            )
            st.markdown(
                f'<div style="display:flex;flex-direction:column;align-items:center;'
                f"justify-content:center;height:460px;"
                f"background:radial-gradient(ellipse at center,rgba(34,211,238,.03),transparent 70%);"
                f'border:1.5px dashed #1E2A3F;border-radius:12px;gap:16px;">'
                f'<div style="opacity:.18;animation:float 4s ease-in-out infinite;">'
                f'{ic("scan-search",48,Config.CYAN)}</div>'
                f'<p style="font-size:.83rem;color:#1E2A3F;text-align:center;'
                f'line-height:2;margin:0;">{msg}</p>'
                f"</div>",
                unsafe_allow_html=True,
            )


# TAB 2 — MODEL EVALUATION
def render_evaluation_tab(engine: AIEngine):
    if not engine.is_trained:
        st.markdown(
            f'<div style="display:flex;align-items:center;gap:12px;'
            f"background:rgba(251,113,133,.06);border:1px solid rgba(251,113,133,.25);"
            f'border-radius:9px;padding:18px 20px;">'
            f'{ic("alert-circle",20,Config.ROSE)}'
            f'<span style="font-size:.88rem;color:#8899B4;">'
            f"Model not trained — check that <code>resumes.csv</code> is present.</span></div>",
            unsafe_allow_html=True,
        )
        return

    section_hdr("activity", "Performance Metrics", Config.CYAN)

    c1, c2, c3, c4 = st.columns(4)
    tm = engine.test_metrics
    with c1:
        st.metric(
            "Test Accuracy",
            f"{tm['accuracy']:.1%}",
        )
    with c2:
        st.metric("Precision", f"{tm['precision']:.1%}")
    with c3:
        st.metric("Recall", f"{tm['recall']:.1%}")
    with c4:
        st.metric("F1 Score", f"{tm['f1']:.1%}")

    st.markdown("<hr>", unsafe_allow_html=True)

    ev1, ev2 = st.columns([3, 2])

    with ev1:
        section_hdr("grid", "Confusion Matrix", Config.VIOLET, 0.05)

        # Top-15 most frequent classes — readable for examiners
        from collections import Counter as _Counter
        role_counts = _Counter(engine.y_test)
        top15_roles = [r for r, _ in role_counts.most_common(15)]
        top15_idx = [list(engine.class_labels).index(r) for r in top15_roles if r in engine.class_labels]
        top15_matrix = engine.conf_matrix[np.ix_(top15_idx, top15_idx)]
        top15_labels = [engine.class_labels[i] for i in top15_idx]

        st.caption("Showing top 15 most frequent roles for readability")
        st.plotly_chart(
            chart_confusion(top15_matrix, top15_labels),
            use_container_width=True,
        )
        with st.expander("View full confusion matrix (all classes)"):
            st.plotly_chart(
                chart_confusion(engine.conf_matrix, engine.class_labels),
                use_container_width=True,
            )

    with ev2:
        section_hdr("activity", "Accuracy Gauge", Config.EMERALD, 0.05)
        st.plotly_chart(
            chart_gauge(tm["accuracy"], "Test Accuracy"),
            use_container_width=True,
        )

        section_hdr("book", "Training Summary", Config.AMBER, 0.1)
        summary = [
            ("cpu", "Architecture", "Logistic Regression"),
            ("layers", "Encoder", Config.EMBED_MODEL),
            ("users", "Train samples", f"{engine.train_metrics['samples']:,}"),
            ("activity", "Test samples", f"{tm['samples']:,}"),
            (
                "trending-up",
                "Train accuracy",
                f"{engine.train_metrics['accuracy']:.1%}",
            ),
            ("zap", "Test accuracy", f"{tm['accuracy']:.1%}"),
            ("star", "Weighted F1", f"{tm['f1']:.1%}"),
        ]
        st.markdown(
            '<div style="background:#0C1020;border:1px solid #1E2A3F;'
            'border-radius:9px;padding:6px 14px;">',
            unsafe_allow_html=True,
        )
        for ico, lbl, val in summary:
            vc = (
                Config.EMERALD
                if any(x in lbl for x in ["accuracy", "F1"])
                else Config.CYAN if "samples" in lbl else "#8899B4"
            )
            sidebar_stat(ico, lbl, val, vc)
        st.markdown("</div>", unsafe_allow_html=True)

    st.markdown("<hr>", unsafe_allow_html=True)

    # Per-class report
    section_hdr("clipboard", "Per-Class Report", Config.EMERALD, 0.05)
    with st.expander("Classification Report", expanded=True):
        report_rows = []
        for label in engine.class_labels:
            yt = [1 if y == label else 0 for y in engine.y_test]
            yp = [1 if p == label else 0 for p in engine.preds_test]
            prec, rec, f1, _ = precision_recall_fscore_support(
                yt, yp, average="binary", zero_division=0
            )
            report_rows.append(
                {
                    "Role": label,
                    "Precision": f"{prec:.1%}",
                    "Recall": f"{rec:.1%}",
                    "F1 Score": f"{f1:.1%}",
                    "Support": sum(yt),
                }
            )

        df_report = pd.DataFrame(report_rows)
        cols_h = df_report.columns.tolist()
        hdr = "".join(
            f"<th style='font-size:.66rem;font-weight:700;color:#3D5070;"
            f"text-transform:uppercase;letter-spacing:.1em;"
            f"padding:10px 16px;text-align:{'left' if i==0 else 'center'};"
            f"border-bottom:1px solid #1E2A3F;background:#07090F;'>{c}</th>"
            for i, c in enumerate(cols_h)
        )
        body = ""
        for _, row in df_report.iterrows():
            f1v = float(row["F1 Score"].replace("%", ""))
            f1c = (
                Config.EMERALD
                if f1v >= 91
                else Config.CYAN if f1v >= 88 else Config.AMBER
            )
            cells = (
                f"<td style='padding:10px 16px;font-size:.83rem;font-weight:600;color:#F0F6FF;'>{row['Role']}</td>"
                f"<td style='padding:10px 16px;font-family:JetBrains Mono,monospace;font-size:.77rem;color:#3D5070;text-align:center;'>{row['Precision']}</td>"
                f"<td style='padding:10px 16px;font-family:JetBrains Mono,monospace;font-size:.77rem;color:#3D5070;text-align:center;'>{row['Recall']}</td>"
                f"<td style='padding:10px 16px;font-family:JetBrains Mono,monospace;font-size:.77rem;color:{f1c};font-weight:700;text-align:center;'>{row['F1 Score']}</td>"
                f"<td style='padding:10px 16px;font-family:JetBrains Mono,monospace;font-size:.77rem;color:#28374F;text-align:center;'>{row['Support']}</td>"
            )
            body += (
                f"<tr style='border-bottom:1px solid #111827;transition:background .15s;' "
                f"onmouseover=\"this.style.background='rgba(34,211,238,.04)'\" "
                f"onmouseout=\"this.style.background='transparent'\">{cells}</tr>"
            )
        st.markdown(
            f'<div style="background:#0C1020;border:1px solid #1E2A3F;border-radius:9px;overflow:hidden;">'
            f'<table style="width:100%;border-collapse:collapse;">'
            f"<thead><tr>{hdr}</tr></thead><tbody>{body}</tbody></table></div>",
            unsafe_allow_html=True,
        )


# FOOTER
def render_footer():
    st.markdown(
        f'<div style="margin-top:48px;padding:20px 0;text-align:center;'
        f'border-top:1px solid #1E2A3F;">'
        f'<div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:6px;">'
        f'{ic("file-text",13,"#1E2A3F")}'
        f'<span style="font-size:.78rem;font-weight:600;color:#1E2A3F;">Resume Analyzer  ·  2025</span>'
        f"</div>"
        f"<span style=\"font-family:'JetBrains Mono',monospace;font-size:.62rem;color:#1A2438;\">"
        f"Streamlit &nbsp;·&nbsp; Sentence Transformers &nbsp;·&nbsp; "
        f"Scikit-learn &nbsp;·&nbsp; NLTK &nbsp;·&nbsp; Plotly"
        f"</span></div>",
        unsafe_allow_html=True,
    )


# MAIN
def main():
    apply_styles()

    # Cache AI engine in session state so it only loads once
    if "engine" not in st.session_state:
        st.session_state.engine = AIEngine()
    engine = st.session_state.engine

    render_sidebar(engine)
    render_header(engine)

    tab1, tab2 = st.tabs(["  Analyze Resume  ", "  Model Evaluation  "])
    with tab1:
        render_analysis_tab(engine)
    with tab2:
        render_evaluation_tab(engine)

    render_footer()





if __name__ == "__main__":
    main()