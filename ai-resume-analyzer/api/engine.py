"""
Core AI Engine — extracted from resume_analyzer.py (no Streamlit dependency).
Loads cached model from model_cache/ and provides all analysis methods.
"""

import os, re, json, hashlib
import numpy as np
import joblib
import nltk
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from sentence_transformers import SentenceTransformer, util
from sklearn.preprocessing import LabelEncoder
from nltk.corpus import stopwords
from . import config as C


class DataProcessor:
    def __init__(self):
        try:
            nltk.data.find("corpora/stopwords")
        except LookupError:
            nltk.download("stopwords", quiet=True)
        self.stopwords = set(stopwords.words("english"))

    def clean_text(self, raw: str) -> str:
        if not isinstance(raw, str) or not raw.strip():
            return ""
        text = raw.lower()
        for p in ["company name","course details","more text","location","email@email.com","resumekraft.com"]:
            text = text.replace(p, "")
        for h in ["education","summary","experience","skills","work experience","profile","achievements"]:
            text = re.sub(r"\b" + re.escape(h) + r"\b", "", text)
        text = re.sub(r"http\S+|www\S+", "", text)
        text = re.sub(r"\S+@\S+", "", text)
        text = re.sub(r"\d{3}[-.]?\d{3}[-.]?\d{4}", "", text)
        text = re.sub(r"[•■★○◆▪►]", "", text)
        text = re.sub(r"[^\w\s]", " ", text)
        text = re.sub(r"\b\d{4}\s*[-–]\s*(\d{4}|present)\b", "", text)
        text = re.sub(r"\s+", " ", text).strip()
        return " ".join(w for w in text.split() if len(w) > 2)


class AIEngine:
    """Core ML pipeline — loads from cache, no training needed."""

    def __init__(self):
        self.processor = DataProcessor()
        self.is_trained = False
        self.has_job_db = False
        self.encoder = SentenceTransformer(C.EMBED_MODEL)
        self._load_from_cache()

    def _load_from_cache(self):
        """Load classifier, label encoder, and job embeddings from model_cache/."""
        needed = [C.CACHE_CLASSIFIER, C.CACHE_LABEL_ENC, C.CACHE_EMBEDDINGS, C.CACHE_META]
        if not all(os.path.exists(f) for f in needed):
            print("[WARN] Model cache not found — classifier unavailable")
            return

        self.classifier = joblib.load(C.CACHE_CLASSIFIER)
        self.label_enc = joblib.load(C.CACHE_LABEL_ENC)
        self.class_labels = self.label_enc.classes_
        self.label_embeddings = self.encoder.encode(self.class_labels, convert_to_tensor=True)
        self.is_trained = True
        print(f"[OK] Classifier loaded — {len(self.class_labels)} roles")

        if os.path.exists(C.CACHE_JOB_EMB):
            import torch
            arr = np.load(C.CACHE_JOB_EMB)
            self.job_embeddings = torch.tensor(arr)
            self.has_job_db = True
            print(f"[OK] Job embeddings loaded — {arr.shape[0]} jobs")

    # ── Skill extraction ──
    def extract_skills(self, text: str) -> Dict[str, List[str]]:
        lower = text.lower()
        tech, soft = [], []
        for skill, patterns in C.TECH_SKILLS.items():
            if any(re.search(r"\b" + re.escape(p) + r"\b", lower) for p in patterns):
                tech.append(skill)
        for skill_name, variants in C.SOFT_SKILLS.items():
            for variant in variants:
                if re.search(r"\b" + re.escape(variant.lower()) + r"\b", lower):
                    soft.append(skill_name)
                    break
        for action, skill_name in C.ACTION_TO_SKILL.items():
            if re.search(r"\b" + re.escape(action) + r"\b", lower):
                soft.append(skill_name)
        return {"technical": sorted(set(tech)), "soft": sorted(set(soft))}

    # ── Quality scoring ──
    def score_quality(self, text: str, skills: Dict) -> Dict:
        score, tips = 0, []
        length = len(text)
        if length > 3000: score += 20
        elif length > 2000: score += 18
        elif length > 1000: score += 15; tips.append("Expand descriptions with more detail")
        else: score += 10; tips.append("Resume is short — add experience & projects")

        n_tech = len(skills["technical"])
        if n_tech >= 8: score += 20
        elif n_tech >= 5: score += 15; tips.append("Add more technical skills relevant to your role")
        else: score += 10; tips.append("Limited technical skills detected")

        n_soft = len(skills["soft"])
        if n_soft >= 5: score += 10
        elif n_soft >= 3: score += 7
        else: score += 5; tips.append("Include soft skills like leadership & communication")

        keywords = ["experience","project","developed","managed","led","achieved","implemented"]
        hit = sum(1 for k in keywords if k in text.lower())
        if hit >= 6: score += 20
        elif hit >= 4: score += 15
        else: score += 10; tips.append("Use action verbs: developed, managed, led, achieved")

        nums = len(re.findall(r"\b\d+\b", text)) + len(re.findall(r"\d+%", text))
        if nums >= 5: score += 15
        elif nums >= 3: score += 10
        else: score += 5; tips.append("Add numbers/percentages to quantify achievements")

        has_sections = any(s in text.lower() for s in ["education","experience","skills","projects","work history","employment"])
        score += 15 if has_sections else 10
        if not has_sections: tips.append("Add clear section headers: Education, Experience, Skills")

        grade = "Excellent" if score >= 85 else ("Good" if score >= 70 else "Average" if score >= 50 else "Needs Improvement")
        return {"score": score, "max": 100, "grade": grade, "tips": tips}

    # ── Skill gap ──
    def skill_gap(self, candidate: Dict, required: List[str]) -> Dict:
        have_lower = {s.lower() for s in candidate["technical"] + candidate["soft"]}
        need_original = [s.strip() for s in required if s.strip()]
        need_lower = {s.lower() for s in need_original}
        matched_lower = have_lower & need_lower
        missing_lower = need_lower - have_lower
        matched = sorted(s for s in need_original if s.lower() in matched_lower)
        missing = sorted(s for s in need_original if s.lower() in missing_lower)
        pct = (len(matched) / len(need_original) * 100) if need_original else 0
        recommendations = []
        for skill in missing:
            if skill in C.SKILL_RECOMMENDATIONS:
                recommendations.append({"skill": skill, "path": C.SKILL_RECOMMENDATIONS[skill]})
        return {"matched": matched, "missing": missing, "pct": pct,
                "n_required": len(need_original), "n_matched": len(matched),
                "recommendations": recommendations}

    # ── Full analysis pipeline ──
    def analyse(self, cv_text: str) -> Optional[Dict]:
        if not self.is_trained:
            return None
        cleaned = self.processor.clean_text(cv_text)
        if not cleaned:
            return None

        emb = self.encoder.encode(cleaned, convert_to_tensor=True)
        emb_np = emb.cpu().numpy().reshape(1, -1)

        pred_id = self.classifier.predict(emb_np)[0]
        pred_role = self.label_enc.inverse_transform([pred_id])[0]
        probs = self.classifier.predict_proba(emb_np)[0]
        confidence = float(np.max(probs))

        top3 = [{"role": self.label_enc.inverse_transform([i])[0], "confidence": float(probs[i])}
                for i in np.argsort(probs)[-3:][::-1]]

        skills = self.extract_skills(cv_text)
        quality = self.score_quality(cv_text, skills)

        matches = []
        if self.has_job_db:
            import pandas as pd
            try:
                job_df = pd.read_csv(C.JOB_FILE)
                cols = {c: c.lower() for c in job_df.columns}
                col_map = {}
                for c, cl in cols.items():
                    if "title" in cl: col_map[c] = "title"; break
                for c, cl in cols.items():
                    if any(k in cl for k in ["desc","summary","content"]): col_map[c] = "description"; break
                for c, cl in cols.items():
                    if "company" in cl: col_map[c] = "company"; break
                job_df = job_df.rename(columns=col_map)
                if "company" not in job_df.columns:
                    job_df["company"] = "Not Specified"

                results = util.semantic_search(emb, self.job_embeddings, top_k=C.TOP_K_JOBS)[0]
                for r in results:
                    if r["score"] < C.MIN_JOB_SCORE:
                        continue
                    row = job_df.iloc[r["corpus_id"]]
                    reqs = [s.strip() for s in str(row.get("skills_list", "")).split("|")
                            if s.strip() and s.strip() != "nan"]
                    gap = self.skill_gap(skills, reqs)
                    matches.append({"title": row["title"], "company": row.get("company",""),
                                    "description": str(row.get("description",""))[:500],
                                    "score": round(r["score"] * 100, 1), "gap": gap})
            except Exception as e:
                print(f"[WARN] Job matching failed: {e}")

        return {"role": pred_role, "confidence": confidence, "alt_roles": top3,
                "skills": skills, "quality": quality, "matches": matches,
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

    # ── ATS Compatibility Check (NEW) ──
    def ats_check(self, cv_text: str, jd_text: str = "") -> Dict:
        checklist = []
        lower = cv_text.lower()

        # Contact info
        has_email = bool(re.search(r"\S+@\S+\.\S+", cv_text))
        has_phone = bool(re.search(r"\d{3}[-.\s]?\d{3}[-.\s]?\d{4}|\+\d{1,3}\s?\d{6,}", cv_text))
        checklist.append({"item": "Contact Information", "status": "pass" if (has_email and has_phone) else ("warning" if has_email or has_phone else "fail")})

        # Section headers
        sections = ["education","experience","skills","work experience","projects"]
        found_sections = sum(1 for s in sections if s in lower)
        checklist.append({"item": "Section Headers", "status": "pass" if found_sections >= 3 else ("warning" if found_sections >= 2 else "fail")})

        # Work experience format
        has_dates = bool(re.search(r"\d{4}\s*[-–]\s*(\d{4}|present)", lower))
        checklist.append({"item": "Work Experience Format", "status": "pass" if has_dates else "warning"})

        # Special characters
        special = len(re.findall(r"[•■★○◆▪►🔥⭐📌💡🎯]", cv_text))
        checklist.append({"item": "Special Characters", "status": "pass" if special == 0 else ("warning" if special < 5 else "fail")})

        # File format check (text-based = good)
        checklist.append({"item": "File Format (Text-Based)", "status": "pass"})

        # Length check
        word_count = len(cv_text.split())
        checklist.append({"item": "Resume Length", "status": "pass" if 300 <= word_count <= 1000 else ("warning" if word_count < 300 else "warning")})

        # Date formatting consistency
        checklist.append({"item": "Date Formatting", "status": "pass" if has_dates else "warning"})

        # Keyword analysis vs JD
        keyword_density = []
        quick_fixes = []
        if jd_text:
            jd_lower = jd_text.lower()
            jd_skills = self.extract_skills(jd_text)
            cv_skills = self.extract_skills(cv_text)
            all_jd_skills = jd_skills["technical"] + jd_skills["soft"]

            for skill in all_jd_skills[:10]:
                s_lower = skill.lower()
                resume_count = lower.count(s_lower)
                jd_count = jd_lower.count(s_lower)
                keyword_density.append({"keyword": skill, "resume_count": resume_count, "jd_count": jd_count})
                if resume_count < jd_count:
                    quick_fixes.append({"issue": f"Add '{skill}' keyword ({jd_count - resume_count} more times)",
                                        "fix": f"Include {skill} in project descriptions and skills section"})

            missing_kw = set(s.lower() for s in all_jd_skills) - set(s.lower() for s in cv_skills["technical"] + cv_skills["soft"])
            checklist.append({"item": "Keyword Optimization", "status": "pass" if len(missing_kw) < 3 else ("warning" if len(missing_kw) < 6 else "fail")})
        else:
            checklist.append({"item": "Keyword Optimization", "status": "warning"})

        if special > 0:
            quick_fixes.append({"issue": "Remove special characters from section headers",
                                "fix": "Replace decorative symbols with plain text headers"})
        if word_count < 300:
            quick_fixes.append({"issue": "Resume is too short for ATS parsing",
                                "fix": "Expand to at least 300-500 words with detailed experience"})

        # Score
        pass_count = sum(1 for c in checklist if c["status"] == "pass")
        warn_count = sum(1 for c in checklist if c["status"] == "warning")
        total = len(checklist)
        ats_score = int((pass_count * 100 + warn_count * 60) / total) if total else 0

        return {"ats_score": ats_score, "checklist": checklist,
                "keyword_density": keyword_density, "quick_fixes": quick_fixes}

    # ── Career Path Simulation (NEW) ──
    def career_path(self, predicted_role: str, current_skills: List[str]) -> Dict:
        paths_config = C.CAREER_PATHS.get(predicted_role, C.CAREER_PATHS["default"])
        paths = []
        for i, path_option in enumerate(paths_config):
            target = path_option["target"].replace("{role}", predicted_role)
            steps = [
                {"role": predicted_role, "current": True, "duration": "Current", "skills": current_skills[:5]},
                {"role": target, "current": False, "duration": path_option["years"] + " years",
                 "skills": path_option["skills"]}
            ]
            name = f"Path {i+1}: → {target}"
            paths.append({"name": name, "steps": steps})
        return {"current_role": predicted_role, "paths": paths}

    # ── JD Parser (NEW) ──
    def parse_jd(self, jd_text: str) -> Dict:
        skills = self.extract_skills(jd_text)
        lower = jd_text.lower()

        # Experience extraction
        exp_match = re.search(r"(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience)?", lower)
        if exp_match:
            exp_years = int(exp_match.group(1))
            experience_level = f"{exp_years}+ years"
        elif any(w in lower for w in ["fresh graduate", "newly graduate", "fresh", "no experience", "entry level", "recent graduate"]):
            exp_years = 0
            experience_level = "0-1 years (Fresh)"
        else:
            exp_years = -1
            experience_level = "Not specified"

        # Education extraction
        edu = "Not specified"
        if any(w in lower for w in ["phd", "doctorate"]): edu = "PhD or Doctorate"
        elif any(w in lower for w in ["master", "m.s.", "m.sc", "mba"]): edu = "Master's degree"
        elif any(w in lower for w in ["bachelor", "b.s.", "b.sc", "b.a."]): edu = "Bachelor's degree"

        # Seniority
        seniority = "Mid"
        if any(w in lower for w in ["principal", "staff", "distinguished"]): 
            seniority = "Principal"
        elif any(w in lower for w in ["senior", "sr.", "lead"]): 
            seniority = "Senior"
        elif any(w in lower for w in ["junior", "jr.", "entry", "intern", "graduate"]): 
            seniority = "Junior"
        elif exp_years != -1:
            if exp_years >= 7:
                seniority = "Senior"
            elif exp_years >= 3:
                seniority = "Mid"
            else:
                seniority = "Junior"

        # Role title
        role_title = "Unknown Role"
        lines = [l.strip() for l in jd_text.strip().split("\n") if l.strip()]
        first_line = lines[0] if lines else ""

        if self.is_trained:
            # 1. Exact substring match against known labels
            matched_roles = [label for label in self.class_labels if label.lower() in lower]
            if matched_roles:
                role_title = max(matched_roles, key=len)
            elif hasattr(self, 'label_embeddings') and first_line:
                # 2. Semantic similarity
                emb_full = self.encoder.encode(jd_text, convert_to_tensor=True)
                emb_line = self.encoder.encode(first_line, convert_to_tensor=True)
                
                sims_full = util.cos_sim(emb_full, self.label_embeddings)[0]
                sims_line = util.cos_sim(emb_line, self.label_embeddings)[0]
                
                best_idx_full = int(sims_full.argmax())
                best_idx_line = int(sims_line.argmax())
                
                max_sim = max(float(sims_full[best_idx_full]), float(sims_line[best_idx_line]))
                
                if max_sim > 0.35:
                    if sims_line[best_idx_line] >= sims_full[best_idx_full]:
                        role_title = str(self.class_labels[best_idx_line])
                    else:
                        role_title = str(self.class_labels[best_idx_full])
        
        if role_title == "Unknown Role" and first_line:
            role_title = first_line[:100]

        # Location
        location = "Not specified"
        loc_match = re.search(r"(?:location|based in|located in)[:\s]+([^\n,]+)", lower)
        
        if loc_match:
            location = loc_match.group(1).strip().title()
        else:
            in_match = re.search(r"\bin\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)", jd_text)
            if in_match:
                extracted = in_match.group(1).strip()
                if len(extracted) > 2 and extracted.lower() not in ["english", "computer science", "it", "cs"]:
                    location = extracted

        if "remote" in lower:
            if location != "Not specified":
                location = f"{location} / Remote"
            else:
                location = "Remote"

        return {"role_title": role_title, "required_skills": skills["technical"],
                "soft_skills": skills["soft"], "experience_level": experience_level,
                "education": edu, "seniority": seniority, "location": location}

    # ── Candidate Ranking (NEW) ──
    def rank_candidates(self, jd_text: str, resumes: List[Dict]) -> List[Dict]:
        jd_cleaned = self.processor.clean_text(jd_text)
        jd_emb = self.encoder.encode(jd_cleaned, convert_to_tensor=True)
        jd_skills = self.extract_skills(jd_text)
        jd_all_skills = jd_skills["technical"] + jd_skills["soft"]

        ranked = []
        for i, resume in enumerate(resumes):
            text = resume.get("resume_text", "")
            cleaned = self.processor.clean_text(text)
            if not cleaned:
                continue
            emb = self.encoder.encode(cleaned, convert_to_tensor=True)
            sim_score = float(util.cos_sim(jd_emb, emb)[0][0]) * 100

            cv_skills = self.extract_skills(text)
            gap = self.skill_gap(cv_skills, jd_all_skills)
            composite = sim_score * 0.6 + gap["pct"] * 0.4

            ranked.append({
                "candidate_id": resume.get("id", i + 1),
                "name": resume.get("name", f"Candidate {i+1}"),
                "match_score": round(composite, 1),
                "similarity_score": round(sim_score, 1),
                "skill_match_pct": round(gap["pct"], 1),
                "matched_skills": gap["matched"],
                "missing_skills": gap["missing"],
                "top_skills": cv_skills["technical"][:5],
            })
        ranked.sort(key=lambda x: x["match_score"], reverse=True)
        for i, r in enumerate(ranked):
            r["rank"] = i + 1
        return ranked

    # ── Detailed Match Breakdown (NEW) ──
    def candidate_match(self, resume_text: str, jd_text: str) -> Dict:
        cv_skills = self.extract_skills(resume_text)
        jd_skills = self.extract_skills(jd_text)
        all_jd = jd_skills["technical"] + jd_skills["soft"]
        gap = self.skill_gap(cv_skills, all_jd)

        cleaned_cv = self.processor.clean_text(resume_text)
        cleaned_jd = self.processor.clean_text(jd_text)
        emb_cv = self.encoder.encode(cleaned_cv, convert_to_tensor=True)
        emb_jd = self.encoder.encode(cleaned_jd, convert_to_tensor=True)
        sim = float(util.cos_sim(emb_cv, emb_jd)[0][0]) * 100

        tech_match = len(set(s.lower() for s in cv_skills["technical"]) & set(s.lower() for s in jd_skills["technical"]))
        tech_total = max(len(jd_skills["technical"]), 1)
        soft_match = len(set(s.lower() for s in cv_skills["soft"]) & set(s.lower() for s in jd_skills["soft"]))
        soft_total = max(len(jd_skills["soft"]), 1)

        breakdown = {
            "technical_skills": round(tech_match / tech_total * 100),
            "soft_skills": round(soft_match / soft_total * 100),
            "experience": min(round(sim * 1.1), 100),
            "education": 85,  # Placeholder — would need structured parsing
            "overall": round(sim * 0.5 + gap["pct"] * 0.5),
        }

        explanation = (f"This candidate matches {gap['pct']:.0f}% of the required skills. "
                       f"Strong in: {', '.join(gap['matched'][:5]) or 'N/A'}. "
                       f"Gaps in: {', '.join(gap['missing'][:5]) or 'none'}. "
                       f"Semantic similarity to JD: {sim:.0f}%.")

        return {"overall_score": breakdown["overall"], "breakdown": breakdown,
                "explanation": explanation, "matched_skills": gap["matched"],
                "missing_skills": gap["missing"], "recommendations": gap["recommendations"]}

    # ── Interview Question Generator (NEW) ──
    def interview_questions(self, resume_text: str, jd_text: str) -> List[Dict]:
        cv_skills = self.extract_skills(resume_text)
        jd_skills = self.extract_skills(jd_text)
        all_jd = jd_skills["technical"] + jd_skills["soft"]
        gap = self.skill_gap(cv_skills, all_jd)
        questions = []

        # Technical questions based on matched skills
        for skill in gap["matched"][:2]:
            questions.append({
                "question": f"Can you describe a project where you used {skill}? What challenges did you face and how did you overcome them?",
                "category": "Technical"
            })

        # Gap-based questions
        for skill in gap["missing"][:2]:
            questions.append({
                "question": f"This role requires {skill}, which isn't on your resume. How would you approach learning it for this position?",
                "category": "Gap-Based"
            })

        # Behavioral questions based on soft skills
        soft = cv_skills["soft"][:2] if cv_skills["soft"] else ["teamwork"]
        for s in soft:
            questions.append({
                "question": f"Tell me about a time you demonstrated {s.lower()} in a professional setting. What was the outcome?",
                "category": "Behavioral"
            })

        return questions[:5]
