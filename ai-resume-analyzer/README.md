# AI CV Analyzer Pro

A resume analysis web app built with Streamlit and Sentence Transformers. Upload any CV and get role prediction, job matching, skill extraction, gap analysis, and quality scoring in one place.

## Features

- **Role Classification** predicts the most suitable job role using sentence embeddings and a Support Vector Machine
- **Semantic Job Matching** searches through 27,000+ job listings using cosine similarity
- **Skill Extraction** detects technical and soft skills with variant-based and action-based pattern matching
- **Skill Gap Analysis** shows which required skills you already have and which ones are missing per job
- **Learning Recommendations** suggests a learning path for each missing skill
- **Resume Quality Scoring** scores the CV out of 100 based on content, skills, achievements, and formatting
- **Prediction Explanation** shows the keywords that drove the role prediction
- **Model Evaluation Dashboard** includes accuracy, F1 score, confusion matrix, and a per-class report
- **Disk Caching** saves embeddings after the first run, cutting startup time from ~15 minutes to ~30 seconds

## Project Structure

```
AI-Resume-Analyzer/
│
├── app.py            # Main Streamlit application
├── requirements.txt
├── README.md
│
├── datasets/
│   ├── resumes.csv   # Training data
│   └── jobs.csv      # Job listings
│
├── model_cache/      # Auto-generated after first run
└── venv/             # Ignored
```

## Getting Started

**1. Clone the repo**
```bash
git clone https://github.com/haris-fayyaz/ai-resume-analyzer.git
cd ai-resume-analyzer
```

**2. Install dependencies**
```bash
pip install -r requirements.txt
```

**3. Add your data files**

Both files go in the project root:

| File | Required Columns |
|---|---|
| `resumes.csv` | `job_role`, `resume_text` |
| `jobs.csv` | `title`, `description`, `skills_list` |

The `skills_list` column should use pipe separators, for example `Python|Docker|AWS`.

**4. Run**
```bash
streamlit run app.py
```

The first startup trains the model and caches everything to disk. Every restart after that loads from cache in about 30 seconds.


## Model

| Component | Details |
|---|---|
| Embeddings | `all-MiniLM-L6-v2` (384 dimensions) |
| Classifier | `LinearSVC` wrapped with `CalibratedClassifierCV` |
| Class balancing | Cap at 400, floor at 150 samples per role |
| Split | 80% train / 20% test, stratified |

Metrics after augmentation:

| Metric | Value |
|---|---|
| Train Accuracy | 86.3% |
| Test Accuracy | 80.3% |
| F1 Score | 79.9% |

## Supported Roles

`Accountant` `Advocate` `AI Engineer` `Architecture` `Aviation` `Banking` `Business Analyst` `Civil Engineer` `Computer Vision Engineer` `Consultant` `Data Science` `DevOps` `Digital Media` `DotNet Developer` `Electrical Engineering` `ETL Developer` `Finance` `Graphic Designer` `Human Resources` `Java Developer` `Machine Learning Engineer` `Mechanical Engineer` `MLOps Engineer` `Network Security Engineer` `NLP Engineer` `Operations Manager` `PMO` `Python Developer` `React Developer` `SAP Developer` `SQL Developer` `Testing` `UI/UX Designer` `Web Designing`

## Clearing the Cache

Delete `model_cache/` whenever you change the dataset or adjust `BALANCE_CAP` and `BALANCE_FLOOR` in `Config` to force a full retrain.

```bash
rm -rf model_cache/
```

## Requirements

Python 3.9 or higher. Full package list is in `requirements.txt`.

## Built With

- [Streamlit](https://streamlit.io)
- [Sentence Transformers](https://www.sbert.net)
- [Scikit-learn](https://scikit-learn.org)
- [Plotly](https://plotly.com)
- [NLTK](https://www.nltk.org)