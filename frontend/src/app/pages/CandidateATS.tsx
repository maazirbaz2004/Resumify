import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Sidebar } from "../components/Sidebar";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ScoreRing } from "../components/ScoreRing";
import { Check, X, AlertTriangle, Copy, FileCheck, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "../context/AuthContext";
import { candidate as candidateApi } from "../services/api";

export default function CandidateATS() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated) { navigate("/recruiter/login"); return; }
    candidateApi.atsCheck()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const atsScore = data?.ats_score || 0;
  const checklist = data?.checklist || [];
  const keywordData = data?.keyword_density || [];
  const quickFixes = data?.quick_fixes || [];

  const statusColors: Record<string, string> = { pass: "text-green-600", fail: "text-red-600", warning: "text-amber-500" };
  const statusBg: Record<string, string> = { pass: "bg-green-100", fail: "bg-red-100", warning: "bg-amber-100" };
  const StatusIcon = (s: string) => s === "pass" ? Check : s === "fail" ? X : AlertTriangle;

  return (
    {/* ATS Title Bar */}
    <div className="flex min-h-screen bg-background">
      <Sidebar type="candidate" />
      <div className="flex-1 ml-60">
        <div className="p-8">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-4xl font-['Playfair_Display'] font-bold mb-2">ATS Compatibility Checker</h1>
            <p className="text-muted-foreground font-['DM_Sans']">Ensure your resume passes Applicant Tracking Systems</p>
          </motion.div>

          {/* ATS Score Showing */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="mb-8">
            <Card className="p-8">
              <div className="flex flex-col items-center">
                <ScoreRing score={atsScore} size="lg" />
                <h2 className="text-2xl font-['Playfair_Display'] font-bold mt-4 mb-2">
                  {atsScore >= 80 ? "Excellent" : atsScore >= 60 ? "Good" : "Needs Work"} ATS Compatibility
                </h2>
                <p className="text-muted-foreground font-['DM_Sans'] text-center max-w-md">
                  {atsScore >= 80 ? "Your resume is well-optimized for ATS systems." : "Address the items below to improve your score."}
                </p>
              </div>
            </Card>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* ATS Checklist */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <FileCheck className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="text-xl font-['Playfair_Display'] font-semibold">ATS Checklist</h3>
                </div>
                <div className="space-y-3">
                  {checklist.map((item: any, index: number) => {
                    const Icon = StatusIcon(item.status);
                    return (
                      <motion.div key={item.item} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.05 }}
                        className={`flex items-center gap-3 p-3 rounded-lg ${statusBg[item.status] || "bg-secondary/50"}`}>
                        <Icon className={`w-5 h-5 flex-shrink-0 ${statusColors[item.status]}`} />
                        <span className="font-['DM_Sans'] flex-1">{item.item}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </Card>
            </motion.div>

            {/* Keyword Density */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <Card className="p-6">
                <h3 className="text-xl font-['Playfair_Display'] font-semibold mb-6">Keyword Density Analysis</h3>
                {keywordData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={keywordData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E3DE" />
                        <XAxis dataKey="keyword" angle={-45} textAnchor="end" height={100} className="font-['DM_Sans'] text-xs" />
                        <YAxis className="font-['DM_Sans'] text-xs" />
                        <Tooltip contentStyle={{ fontFamily: "DM Sans", borderRadius: "8px", border: "1px solid #E5E3DE" }} />
                        <Bar key="resume-bar" dataKey="resume_count" name="Your Resume" fill="#C9A84C" radius={[8, 8, 0, 0]} />
                        <Bar key="jd-bar" dataKey="jd_count" name="Job Description" fill="#0D0D0D" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="flex gap-4 mt-4 justify-center">
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#C9A84C]" /><span className="text-sm font-['DM_Sans']">Your Resume</span></div>
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#0D0D0D]" /><span className="text-sm font-['DM_Sans']">Job Description</span></div>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground font-['DM_Sans'] text-center py-8">
                    Provide a job description to compare keyword density
                  </p>
                )}
              </Card>
            </motion.div>
          </div>

          {/* Quick Fix Suggestions */}
          {quickFixes.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="p-6">
                <h3 className="text-xl font-['Playfair_Display'] font-semibold mb-6">Quick Fix Suggestions</h3>
                <div className="space-y-4">
                  {quickFixes.map((suggestion: any, index: number) => (
                    <motion.div key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 font-['Playfair_Display'] font-bold text-accent">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-['DM_Sans'] font-semibold mb-1">{suggestion.issue}</h4>
                        <p className="text-sm text-muted-foreground font-['DM_Sans']">{suggestion.fix}</p>
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
