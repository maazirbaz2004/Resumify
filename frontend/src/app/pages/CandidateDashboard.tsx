import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Sidebar } from "../components/Sidebar";
import { Card } from "../components/ui/card";
import { ScoreRing } from "../components/ScoreRing";
import { SkillPill } from "../components/SkillPill";
import { Badge } from "../components/ui/badge";
import { AlertCircle, CheckCircle2, AlertTriangle, Brain, Loader2, Trash2 } from "lucide-react";
import { DarkModeToggle } from "../components/DarkModeToggle";
import { useAuth } from "../context/AuthContext";
import { candidate as candidateApi } from "../services/api";

export default function CandidateDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [isDiscarding, setIsDiscarding] = useState(false);

  const fetchDashboard = () => {
    setLoading(true);
    candidateApi.dashboard()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  const handleDiscard = async () => {
    if (!confirm("Are you sure you want to discard your resume? You will need to upload a new one to apply for jobs. Existing applications will not be affected.")) return;
    setIsDiscarding(true);
    try {
      await candidateApi.discardResume();
      setData(null);
      setError("Resume discarded. Please upload a new one.");
    } catch (err) {
      alert("Failed to discard resume");
    } finally {
      setIsDiscarding(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/recruiter/login");
      return;
    }
    fetchDashboard();
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }
//commit for final
  if (error || !data) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar type="candidate" />
        <div className="flex-1 ml-60 flex items-center justify-center">
          <Card className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-['Playfair_Display'] font-bold mb-2">No Resume Data Yet</h3>
            <p className="text-muted-foreground font-['DM_Sans'] mb-4">
              {error || "Upload your resume to see your dashboard"}
            </p>
            <button onClick={() => navigate("/candidate/onboarding")}
              className="bg-accent text-accent-foreground px-6 py-2 rounded-lg font-['DM_Sans']">
              Upload Resume
            </button>
          </Card>
        </div>
      </div>
    );
  }

  const profile = data.profile;
  const skills = data.skills;
  const analysis = data.latest_analysis;

  // Build weaknesses from quality tips
  const weaknesses = (analysis?.quality?.tips || []).map((tip: string, i: number) => ({
    issue: tip,
    severity: i === 0 ? "High" : i === 1 ? "Medium" : "Low",
  }));

  const severityColors = {
    High: "destructive",
    Medium: "default",
    Low: "secondary",
  } as const;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar type="candidate" />

      <div className="flex-1 ml-60 relative">
        <div className="p-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-4xl font-['Playfair_Display'] font-bold">
                Welcome back, {profile.name?.split(" ")[0] || "there"}
              </h1>
              <div className="flex items-center gap-4">
                {profile.predicted_role && (
                  <Badge className="bg-accent text-accent-foreground font-['DM_Mono'] px-4 py-2">
                    Predicted Role: {profile.predicted_role}
                  </Badge>
                )}
                <button 
                  onClick={handleDiscard}
                  disabled={isDiscarding}
                  className="flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-600 px-4 py-2 rounded-md font-['DM_Sans'] text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isDiscarding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Discard Resume
                </button>
                <DarkModeToggle />
              </div>
            </div>
            <p className="text-muted-foreground font-['DM_Sans']">
              Here's your comprehensive CV analysis and career insights
            </p>
          </motion.div>

          {/* KPI Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            {[
              { score: profile.quality_score || 0, label: "Resume Quality Score", color: "#C9A84C" },
              { score: profile.ats_score || 0, label: "ATS Compatibility", color: "#4CAF50" },
              { score: profile.skill_coverage || 0, label: "Skill Coverage", color: "#FF9800" },
              { score: profile.job_match_score || 0, label: "Job Match Score", color: "#2196F3" },
            ].map((kpi, index) => (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 flex flex-col items-center">
                  <ScoreRing score={kpi.score} size="sm" color={kpi.color} />
                  <p className="text-sm text-center mt-3 font-['DM_Sans'] font-medium">
                    {kpi.label}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* Extracted Skills Panel */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6">
                <h3 className="text-xl font-['Playfair_Display'] font-semibold mb-6">
                  Extracted Skills
                </h3>

                <div className="space-y-6">
                  {skills.technical.length > 0 && (
                    <div>
                      <h4 className="text-sm font-['DM_Sans'] font-semibold text-muted-foreground uppercase mb-3">
                        Technical
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {skills.technical.map((skill: string, index: number) => (
                          <SkillPill key={skill} skill={skill} variant="neutral" delay={index * 0.05} />
                        ))}
                      </div>
                    </div>
                  )}
                  {skills.soft.length > 0 && (
                    <div>
                      <h4 className="text-sm font-['DM_Sans'] font-semibold text-muted-foreground uppercase mb-3">
                        Soft Skills
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {skills.soft.map((skill: string, index: number) => (
                          <SkillPill key={skill} skill={skill} variant="neutral" delay={index * 0.05} />
                        ))}
                      </div>
                    </div>
                  )}
                  {skills.technical.length === 0 && skills.soft.length === 0 && (
                    <p className="text-muted-foreground font-['DM_Sans']">No skills extracted yet</p>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Resume Weaknesses Panel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-6">
                <h3 className="text-xl font-['Playfair_Display'] font-semibold mb-6">
                  Resume Weaknesses
                </h3>

                <div className="space-y-3">
                  {weaknesses.length > 0 ? weaknesses.map((weakness: any, index: number) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50"
                    >
                      {weakness.severity === "High" && <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />}
                      {weakness.severity === "Medium" && <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />}
                      {weakness.severity === "Low" && <CheckCircle2 className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />}
                      <div className="flex-1">
                        <p className="font-['DM_Sans'] text-sm">{weakness.issue}</p>
                      </div>
                      <Badge variant={severityColors[weakness.severity as keyof typeof severityColors]} className="font-['DM_Mono'] text-xs">
                        {weakness.severity}
                      </Badge>
                    </motion.div>
                  )) : (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <p className="font-['DM_Sans'] text-sm text-green-800">Your resume looks great! No major issues found.</p>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          </div>

          {/* AI Explanation Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-['Playfair_Display'] font-semibold">
                  AI Explanation
                </h3>
              </div>

              <div className="space-y-4 font-['DM_Sans']">
                <p className="text-muted-foreground leading-relaxed">
                  Your resume was classified as <span className="font-semibold text-foreground">{profile.predicted_role || "N/A"}</span>
                  {profile.confidence ? ` with ${(profile.confidence * 100).toFixed(0)}% confidence` : ""}.
                  Your quality score is <span className="font-semibold text-foreground">{profile.quality_score || 0}/100</span>
                  {" "}({analysis?.quality?.grade || "Not rated"}).
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground">Skills Detected:</span>{" "}
                  {skills.technical.length} technical and {skills.soft.length} soft skills were extracted from your resume.
                  {skills.technical.length > 5
                    ? " This is a strong skill set showing versatility."
                    : " Consider adding more relevant skills to strengthen your profile."}
                </p>

              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
