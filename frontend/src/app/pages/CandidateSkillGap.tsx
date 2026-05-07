import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Sidebar } from "../components/Sidebar";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { SkillPill } from "../components/SkillPill";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Check, X, BookOpen, Clock, TrendingUp, Loader2 } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Legend } from "recharts";
import { useAuth } from "../context/AuthContext";
import { candidate as candidateApi } from "../services/api";

// Skills required per target role
const ROLE_SKILLS: Record<string, string[]> = {
  "ML Engineer": ["Python", "TensorFlow", "PyTorch", "Kubernetes", "AWS", "Docker", "MLOps", "Deep Learning"],
  "Data Scientist": ["Python", "Pandas", "Scikit-learn", "Statistics", "SQL", "Tableau", "R", "Machine Learning"],
  "Frontend Developer": ["React", "TypeScript", "JavaScript", "CSS", "HTML", "Next.js", "Figma", "Git"],
  "Backend Developer": ["Node.js", "Python", "PostgreSQL", "Docker", "REST API", "Git", "AWS", "Redis"],
  "DevOps Engineer": ["Docker", "Kubernetes", "AWS", "Terraform", "CI/CD", "Jenkins", "Git", "Linux"],
};

export default function CandidateSkillGap() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [targetRole, setTargetRole] = useState("ML Engineer");
  const [gapData, setGapData] = useState<any>(null);
  const [mySkills, setMySkills] = useState<string[]>([]);

  useEffect(() => {
    if (!isAuthenticated) { navigate("/recruiter/login"); return; }
    // Load current skills of candidate from dashboard
    candidateApi.dashboard().then((d) => {
      setMySkills([...d.skills.technical, ...d.skills.soft]);
    }).catch(() => {});
  }, [isAuthenticated]);

  const analyzeGap = async (role: string) => {
    setLoading(true);
    setTargetRole(role);
    try {
      const result = await candidateApi.skillGap(ROLE_SKILLS[role] || []);
      setGapData(result);
    } catch {
      setGapData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && mySkills.length > 0) {
      analyzeGap(targetRole);
    }
  }, [mySkills]);

  const matched = gapData?.matched || [];
  const missing = gapData?.missing || [];
  const pct = gapData?.pct || 0;
  const recommendations = gapData?.recommendations || [];

  const radarData = [
    { skill: "Programming", current: mySkills.length > 3 ? 85 : 50, required: 90 },
    { skill: "ML/AI", current: matched.length > 2 ? 80 : 40, required: 90 },
    { skill: "Cloud", current: mySkills.some((s: string) => ["AWS", "Azure", "GCP"].includes(s)) ? 80 : 30, required: 85 },
    { skill: "DevOps", current: mySkills.some((s: string) => ["Docker", "Kubernetes"].includes(s)) ? 70 : 30, required: 80 },
    { skill: "Soft Skills", current: mySkills.length > 0 ? 85 : 50, required: 85 },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar type="candidate" />
      <div className="flex-1 ml-60">
        <div className="p-8">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-4xl font-['Playfair_Display'] font-bold mb-2">Skill Gap Analysis</h1>
            <p className="text-muted-foreground font-['DM_Sans']">Identify gaps and get personalized learning recommendations</p>
          </motion.div>

          {/* Target Role Selector */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
            <Card className="p-4">
              <div className="flex items-center gap-4">
                <span className="font-['DM_Sans'] font-medium">Target Role:</span>
                <Select value={targetRole} onValueChange={(v) => analyzeGap(v)}>
                  <SelectTrigger className="w-64 font-['DM_Sans']"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(ROLE_SKILLS).map(role => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {loading && <Loader2 className="w-5 h-5 animate-spin text-accent" />}
                {gapData && <Badge className="font-['DM_Mono'] bg-accent text-accent-foreground">{pct.toFixed(0)}% Match</Badge>}
              </div>
            </Card>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* Skills Comparison */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <Card className="p-6 h-full">
                <h3 className="text-xl font-['Playfair_Display'] font-semibold mb-6">Skill Comparison</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-['DM_Sans'] font-semibold text-green-600 mb-4 flex items-center gap-2">
                      <Check className="w-4 h-4" /> Matched ({matched.length})
                    </h4>
                    <div className="space-y-2">
                      {matched.map((skill: string) => (
                        <div key={skill} className="flex items-center gap-2 text-sm font-['DM_Sans']">
                          <Check className="w-4 h-4 text-green-600" />{skill}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-['DM_Sans'] font-semibold text-red-500 mb-4 flex items-center gap-2">
                      <X className="w-4 h-4" /> Missing ({missing.length})
                    </h4>
                    <div className="space-y-2">
                      {missing.map((skill: string) => (
                        <div key={skill} className="flex items-center gap-2 text-sm font-['DM_Sans']">
                          <X className="w-4 h-4 text-red-500" /><span className="text-red-600">{skill}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Radar Chart */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <Card className="p-6 h-full">
                <h3 className="text-xl font-['Playfair_Display'] font-semibold mb-4">Gap Severity Analysis</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#E5E3DE" />
                    <PolarAngleAxis dataKey="skill" className="font-['DM_Sans'] text-sm" />
                    <Radar key="current-level" name="Your Level" dataKey="current" stroke="#C9A84C" fill="#C9A84C" fillOpacity={0.3} />
                    <Radar key="required-level" name="Required Level" dataKey="required" stroke="#0D0D0D" fill="#0D0D0D" fillOpacity={0.1} />
                    <Legend wrapperStyle={{ fontFamily: "DM Sans" }} />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>
            </motion.div>
          </div>

          {/* Learning Roadmap */}
          {recommendations.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="text-xl font-['Playfair_Display'] font-semibold">Personalized Learning Roadmap</h3>
                </div>
                <div className="space-y-4">
                  {recommendations.map((rec: any, index: number) => (
                    <motion.div key={rec.skill} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }} className="relative">
                      {index < recommendations.length - 1 && <div className="absolute left-6 top-16 w-0.5 h-8 bg-border" />}
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 font-['Playfair_Display'] font-bold text-accent">
                          {index + 1}
                        </div>
                        <Card className="flex-1 p-4 bg-secondary/30">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="text-lg font-['DM_Sans'] font-semibold mb-1">Learn {rec.skill}</h4>
                              <p className="text-sm text-muted-foreground font-['DM_Sans']">{rec.path}</p>
                            </div>
                            <Badge variant="destructive" className="font-['DM_Mono']">Priority</Badge>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-3">
                            <SkillPill skill={rec.skill} variant="neutral" />
                          </div>
                        </Card>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
