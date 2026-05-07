"""
Configuration constants for the AI engine.
Extracted from resume_analyzer.py — all system-wide constants in one place.
"""

import os
from typing import Dict, List

# ── Paths (relative to project root)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

RESUME_FILE   = os.path.join(BASE_DIR, "datasets", "resumes.csv")
JOB_FILE      = os.path.join(BASE_DIR, "datasets", "jobs.csv")

CACHE_DIR        = os.path.join(BASE_DIR, "model_cache")
CACHE_CLASSIFIER = os.path.join(CACHE_DIR, "classifier.pkl")
CACHE_LABEL_ENC  = os.path.join(CACHE_DIR, "label_enc.pkl")
CACHE_EMBEDDINGS = os.path.join(CACHE_DIR, "train_embeddings.npz")
CACHE_JOB_EMB    = os.path.join(CACHE_DIR, "job_embeddings.npy")
CACHE_META       = os.path.join(CACHE_DIR, "meta.json")

# ── Model settings
EMBED_MODEL  = "all-MiniLM-L6-v2"
TEST_SPLIT   = 0.20
RANDOM_SEED  = 42
MIN_JOB_SCORE = 0.30
TOP_K_JOBS    = 5

# ── Class balancing
BALANCE_CAP   = 400
BALANCE_FLOOR = 150

# ── Technical skills (skill_name → list of text patterns)
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

# ── Soft skills (skill_name → list of text patterns / variants)
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

# ── Action-to-skill map (verb in resume → inferred soft skill)
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

# ── Skill learning recommendations
SKILL_RECOMMENDATIONS: Dict[str, str] = {
    "Python":          "Python.org docs → Kaggle free courses → Build a data project",
    "Java":            "Oracle Java tutorials → Spring Boot guide → LeetCode practice",
    "JavaScript":      "javascript.info → freeCodeCamp → Build a small React app",
    "TypeScript":      "TypeScript Handbook → Migrate a JS project to TS",
    "C++":             "learncpp.com → Competitive programming on Codeforces",
    "C#":              "Microsoft C# docs → Build a .NET console or web app",
    "Go":              "tour.golang.org → Build a REST API with Gin framework",
    "R":               "R for Data Science (book) → Tidyverse tutorials on RStudio",
    "SQL":             "SQLZoo → Mode Analytics tutorials → Practice on real datasets",
    "React":           "React official docs → Build a To-Do app → Scrimba React course",
    "Django":          "Django official tutorial → Build a CRUD web app",
    "Flask":           "Flask mega-tutorial by Miguel Grinberg → Build a REST API",
    "FastAPI":         "FastAPI official docs → Build and deploy an API on Railway",
    "Node.js":         "Node.js official guides → The Odin Project backend path",
    "Next.js":         "Next.js official docs → Vercel deployment guide",
    "Angular":         "Angular Tour of Heroes tutorial → Udemy Angular course",
    "Vue.js":          "Vue.js official guide → Vuex state management tutorial",
    "Spring Boot":     "Spring.io guides → Build a REST service with Spring Boot",
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
    "AWS":             "AWS free tier → Cloud Practitioner cert → A Cloud Guru",
    "Azure":           "Microsoft Learn Azure path → AZ-900 certification",
    "GCP":             "Google Cloud Skills Boost → Associate Cloud Engineer cert",
    "Docker":          "Docker official get-started → Build and ship a containerized app",
    "Kubernetes":      "Kubernetes.io tutorials → KodeKloud free K8s course",
    "CI/CD":           "GitHub Actions docs → Build a pipeline for a personal project",
    "Git":             "Pro Git book (free) → GitHub Skills → Contribute to open source",
    "Terraform":       "HashiCorp Terraform tutorials → Deploy infra on AWS free tier",
    "MySQL":           "MySQL tutorial on w3schools → Joins & indexes deep dive",
    "PostgreSQL":      "PostgreSQL tutorial → pgAdmin → Use with Django or FastAPI",
    "MongoDB":         "MongoDB University free courses → Build a Node.js CRUD app",
    "Redis":           "Redis University free courses → Use as cache in a web app",
    "Flutter":         "Flutter.dev codelabs → Build a cross-platform mobile app",
    "React Native":    "React Native docs → Expo getting started guide",
    "Android":         "Android developer guides → Build a simple Kotlin app",
    "iOS":             "Apple Swift tutorials → Hacking with Swift (free)",
    "Figma":           "Figma.com tutorials → Redesign an existing app for practice",
    "UI/UX":           "Google UX Design cert (Coursera) → Design a portfolio project",
    "Power BI":        "Microsoft Power BI learning path → Build a sales dashboard",
    "Tableau":         "Tableau Public free training → Viz of the Week challenge",
    "Project Management": "Google PM cert (Coursera) → PMP exam prep → Agile study",
    "Agile":           "Scrum.org free resources → Take a Scrum Master cert",
    "Business Analysis": "IIBA ECBA certification → Business Analysis Body of Knowledge",
    "Digital Marketing": "Google Digital Garage (free) → Meta Blueprint → Google Ads cert",
    "SEO":             "Moz Beginner's Guide to SEO → Ahrefs Academy (free)",
    "Cybersecurity":   "CompTIA Security+ study guide → TryHackMe free rooms",
    "Penetration Testing": "TryHackMe → HackTheBox → OSCP certification path",
    "Leadership":      "The 21 Irrefutable Laws of Leadership (book) → Lead a volunteer project",
    "Communication":   "Toastmasters club → Public speaking courses on Udemy",
    "Negotiation":     "Never Split the Difference (book) → Harvard negotiation course",
    "Public Speaking":  "Toastmasters → TED Masterclass → Record and review yourself",
}

# ── Career path role adjacency (role → reachable roles with estimated years)
# Used for career path simulation
CAREER_PATHS: Dict[str, List[Dict]] = {
    "Data Science": [
        {"target": "Senior Data Scientist", "years": "2-3", "skills": ["Advanced ML", "Leadership", "Business Strategy"]},
        {"target": "ML Engineer", "years": "1-2", "skills": ["MLOps", "Docker", "Kubernetes", "CI/CD"]},
        {"target": "AI Researcher", "years": "2-4", "skills": ["Deep Learning", "Research", "Publications"]},
    ],
    "Python Developer": [
        {"target": "Senior Python Developer", "years": "2-3", "skills": ["System Design", "Architecture", "Leadership"]},
        {"target": "Data Engineer", "years": "1-2", "skills": ["ETL", "Big Data", "Spark", "Airflow"]},
        {"target": "ML Engineer", "years": "2-3", "skills": ["Machine Learning", "TensorFlow", "MLOps"]},
    ],
    "Java Developer": [
        {"target": "Senior Java Developer", "years": "2-3", "skills": ["Microservices", "Spring Boot", "Architecture"]},
        {"target": "Solution Architect", "years": "3-5", "skills": ["System Design", "Cloud", "Leadership"]},
        {"target": "Engineering Manager", "years": "3-5", "skills": ["People Management", "Strategic Planning", "Hiring"]},
    ],
    "Web Designing": [
        {"target": "Senior UI/UX Designer", "years": "2-3", "skills": ["User Research", "Design Systems", "Prototyping"]},
        {"target": "Frontend Developer", "years": "1-2", "skills": ["React", "JavaScript", "TypeScript"]},
        {"target": "Product Designer", "years": "2-3", "skills": ["Product Strategy", "Analytics", "Leadership"]},
    ],
    "DevOps Engineer": [
        {"target": "Senior DevOps Engineer", "years": "2-3", "skills": ["Architecture", "Security", "Leadership"]},
        {"target": "Site Reliability Engineer", "years": "1-2", "skills": ["Observability", "Incident Management"]},
        {"target": "Cloud Architect", "years": "3-4", "skills": ["Multi-cloud", "Terraform", "Cost Optimization"]},
    ],
    "Network Security Engineer": [
        {"target": "Senior Security Engineer", "years": "2-3", "skills": ["Threat Modeling", "SIEM", "Incident Response"]},
        {"target": "Security Architect", "years": "3-5", "skills": ["Zero Trust", "Compliance", "Risk Assessment"]},
        {"target": "CISO", "years": "5-8", "skills": ["Strategic Planning", "Governance", "Executive Communication"]},
    ],
    "HR": [
        {"target": "Senior HR Manager", "years": "2-3", "skills": ["Strategic HR", "Employment Law", "Analytics"]},
        {"target": "HR Business Partner", "years": "2-4", "skills": ["Business Strategy", "Change Management"]},
        {"target": "Chief People Officer", "years": "5-8", "skills": ["Executive Leadership", "Culture Design"]},
    ],
    "default": [
        {"target": "Senior {role}", "years": "2-3", "skills": ["Advanced Domain Knowledge", "Leadership", "Mentoring"]},
        {"target": "Team Lead", "years": "3-4", "skills": ["Team Management", "Project Planning", "Stakeholder Management"]},
        {"target": "Manager", "years": "4-6", "skills": ["Strategic Planning", "Hiring", "Budget Management"]},
    ],
}
