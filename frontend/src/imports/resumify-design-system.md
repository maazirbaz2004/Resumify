Design a complete, high-fidelity UI/UX design system and screen set for "Resumify" — 
an AI-Driven Talent Intelligence & Recruitment Optimization Platform. 

DESIGN LANGUAGE:
- Style: Modern editorial SaaS — clean, professional, data-rich
- Color palette: Deep navy/dark ink (#0D0D0D) backgrounds for dashboards, warm 
  off-white (#FAF8F4) for candidate-facing screens, gold accent (#C9A84C) for 
  highlights, scores, and CTAs. Muted warm gray for body text.
- Typography: Playfair Display (headings, large scores), DM Sans (body, labels), 
  DM Mono (tags, IDs, metrics, code)
- Component style: Rounded cards (12px radius), subtle shadows, progress bars, 
  skill pill tags, score rings, data tables with row hover states
- Icons: Lucide icon set throughout

SCREENS TO DESIGN (14 total):

1. LANDING PAGE
   - Hero with headline "Hire Smarter, Apply Better"
   - Animated CV score card mockup (match %, quality score, ATS score)
   - Feature highlights: CV Parsing, Role Prediction, Gap Analysis, Bias Reduction
   - Two CTA paths: "I'm a Candidate" and "I'm a Recruiter"
   - Stats bar: 14+ AI Features, 2 Modules, Bias-Reduced Screening

2. CANDIDATE — ONBOARDING / CV UPLOAD
   - Drag-and-drop CV upload zone (PDF/DOCX)
   - Upload progress state with parsing animation
   - "AI is analyzing your resume…" loading screen with step indicators:
     Extracting Skills → Predicting Roles → Scoring Quality → Generating Insights

3. CANDIDATE — CV ANALYSIS DASHBOARD (main screen)
   - Left sidebar: navigation (Dashboard, Job Matches, Skill Gap, Career Path, ATS Check)
   - Top header: candidate name, role prediction badge ("Predicted Role: ML Engineer")
   - 4 KPI cards: Resume Quality Score (87%), ATS Compatibility (92%), 
     Skill Coverage (74%), Job Match Score (91%) — each with circular progress ring
   - Extracted Skills panel: categorized skill pills 
     (Technical / Soft Skills / Tools / Languages)
   - Resume Weaknesses panel: list with severity tags (High / Medium / Low)
   - AI Explanation panel: natural language breakdown of scoring rationale

4. CANDIDATE — JOB MATCHING SCREEN
   - Search/filter bar: role, location, experience level
   - Job cards grid (3 columns): company logo placeholder, role title, match %, 
     top 3 matched skills highlighted, "View Details" CTA
   - Active job detail drawer (right side panel):
     - Full JD summary
     - Match breakdown bar chart (Skills 88%, Experience 75%, Education 90%)
     - Matched skills (green pills) vs Missing skills (red/orange pills)
     - "Apply Now" + "Save Job" actions

5. CANDIDATE — SKILL GAP ANALYSIS
   - Target Role selector dropdown at top
   - Two-column skill comparison:
     Left: "Your Skills" (green checkmarks)
     Right: "Required Skills" (with gap indicators in amber/red)
   - Gap severity heatmap or radar chart
   - Personalized Learning Roadmap section below:
     Timeline-style cards: Course name, platform (Coursera/Udemy), 
     estimated time, priority tag

6. CANDIDATE — ATS COMPATIBILITY CHECKER
   - ATS Score gauge (large, centered): 92/100
   - Section-by-section ATS checklist:
     ✓ Contact Info, ✓ Work Experience format, ✗ Missing keywords, 
     ✓ File format, ⚠ Font compatibility
   - Keyword density panel: bar chart of top JD keywords vs resume frequency
   - Quick Fix Suggestions list with one-click "Copy Fix" actions

7. CANDIDATE — CAREER PATH SIMULATION
   - Interactive career timeline (horizontal, step-based):
     Current Role → Mid Role → Target Role (with skill requirements per step)
   - Estimated transition time per step
   - Skill investment needed (pills per role step)
   - "Simulate Alternative Paths" toggle showing 2-3 parallel route options

8. RECRUITER — LOGIN / ROLE SELECTION
   - Clean split screen: "I'm a Candidate" (left) | "I'm a Recruiter" (right)
   - Recruiter side: dark navy, professional tone
   - Login form with company email + role badge

9. RECRUITER — DASHBOARD HOME
   - Stats overview: Total Applications, Shortlisted, Avg Match Score, 
     Open Positions — as large KPI cards
   - Recent Applications table: Candidate name (blurred in blind mode), 
     applied role, match score bar, status badge (Shortlisted/Pending/Rejected)
   - Talent Pool Skill Distribution: horizontal bar chart of top skills in pool
   - Skill Shortage Insights panel: roles with low applicant quality flagged in red

10. RECRUITER — CANDIDATE RANKING SCREEN
    - Active Job Position selector at top
    - Ranked candidate list (table + card hybrid):
      Rank number, avatar (blurred if blind mode ON), name, match score 
      (color-coded: green 80%+, amber 60-79%, red <60%), 
      top matched skills, quick action buttons (View, Shortlist, Reject)
    - Blind Mode toggle (top right): when ON, names/photos are blurred
    - Sort/filter controls: by score, by skill, by experience

11. RECRUITER — CANDIDATE PROFILE VIEW
    - Full candidate detail: extracted skills, work history, education
    - Match Score breakdown: radar chart (Skills, Experience, Education, 
      Culture Fit placeholder)
    - Explainability panel: "Why this score?" — natural language AI rationale
    - Skill match visualization: side-by-side JD requirements vs candidate skills
    - AI-Generated Interview Questions section:
      3-5 questions generated based on candidate's specific profile + role gaps
      Each with category tag (Technical / Behavioral / Gap-Based)

12. RECRUITER — JD PARSER & JOB POSTING
    - Paste JD text area with "Parse with AI" button
    - Parsed output panel:
      Required Skills (extracted pills), Experience Level, Education requirement,
      Soft Skills detected, Seniority classification
    - "Edit & Confirm" flow before posting
    - Preview card of how the job will appear to candidates

13. RECRUITER — TALENT ANALYTICS DASHBOARD
    - Market Demand chart: trending skills in job market (line chart, 6 months)
    - Talent Shortage heatmap: roles vs skill gaps across applicant pool
    - Hiring Funnel visualization: Applications → Screened → Shortlisted → Hired
    - Diversity & Bias Metrics panel (when blind mode data is available):
      Gender distribution, anonymous demographics
    - Export Report button

14. DESIGN SYSTEM / COMPONENT LIBRARY PAGE
    - Color palette swatches with hex codes
    - Typography scale: H1–H6, body, caption, mono
    - Button variants: Primary, Secondary, Gold CTA, Danger, Ghost
    - Form elements: Input, Dropdown, Toggle, Checkbox, Radio
    - Card components: Job Card, Candidate Card, Skill Pill (matched/missing/neutral)
    - Score Ring component (multiple sizes)
    - Status badges: Shortlisted, Pending, Rejected, High Priority
    - Navigation sidebar component
    - Data table row states: default, hover, selected, blind-mode

LAYOUT SPECIFICATIONS:
- Desktop first: 1440px wide artboards
- Sidebar width: 240px (fixed)
- Content area: 1140px max-width, 40px padding
- Card grid: 12-column grid, 24px gutters
- Mobile versions for screens 3, 4, and 5 (375px iPhone frame)

INTERACTION NOTES FOR PROTOTYPE:
- Candidate upload → parsing loader → dashboard (auto-transition)
- Blind mode toggle on recruiter ranking screen should blur names live
- Job card click → detail drawer slides in from right
- Career path steps should be clickable to expand skill requirements
- Sidebar nav active states clearly differentiated

ADDITIONAL DESIGN DETAILS:
- Empty states for all data screens (e.g. "No CVs uploaded yet")
- Loading skeleton screens for all data-heavy panels
- Micro-interaction hints: score rings animate on load, 
  skill pills fade in staggered, match bars fill on hover
- Tooltips on all score metrics explaining what they measure
- Consistent use of gold color ONLY for positive metrics and primary CTAs
- Red/amber ONLY for gaps, warnings, and low scores — never decoratively