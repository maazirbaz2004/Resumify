import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { motion } from "motion/react";
import { Sidebar } from "../components/Sidebar";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { SkillPill } from "../components/SkillPill";
import { Progress } from "../components/ui/progress";
import { ScoreRing } from "../components/ScoreRing";
import { User, CheckCircle2, XCircle, Brain, MessageCircle, Loader2, ThumbsUp, ThumbsDown } from "lucide-react";
import { DarkModeToggle } from "../components/DarkModeToggle";
import { useAuth } from "../context/AuthContext";
import { recruiter as recruiterApi } from "../services/api";

export default function RecruiterProfile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get("job_id");
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [actionDone, setActionDone] = useState("");

  useEffect(() => {
    if (!isAuthenticated) { navigate("/recruiter/login"); return; }
    if (!id) return;
    recruiterApi.getCandidateProfile(parseInt(id), jobId ? parseInt(jobId) : undefined)
      .then((res) => {
        setData(res);
        if (res.profile?.application_status === "shortlisted" || res.profile?.application_status === "rejected") {
          setActionDone(res.profile.application_status);
        }
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [isAuthenticated, id, jobId]);

  const handleShortlist = async () => {
    if (!id || !jobId) return;
    await recruiterApi.shortlist(parseInt(id), parseInt(jobId));
    setActionDone("shortlisted");
  };
  const handleReject = async () => {
    if (!id || !jobId) return;
    await recruiterApi.reject(parseInt(id), parseInt(jobId));
    setActionDone("rejected");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar type="recruiter" />
        <div className="flex-1 ml-60 flex items-center justify-center">
          <Card className="p-8 text-center">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-['Playfair_Display'] font-bold">Candidate Not Found</h3>
          </Card>
        </div>
      </div>
    );
  }

  const profile = data.profile;
  const skills = data.skills;
  const match = data.match;
  const questions = data.interview_questions || [];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar type="recruiter" />
      <div className="flex-1 ml-60 relative">
        <div className="absolute top-8 right-8 z-50"><DarkModeToggle /></div>

        <div className="p-8">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                  <User className="w-8 h-8 text-accent" />
                </div>
                <div>
                  <h1 className="text-3xl font-['Playfair_Display'] font-bold">{profile.name}</h1>
                  <p className="text-muted-foreground font-['DM_Sans']">{profile.predicted_role || "Role not analyzed"}</p>
                  <p className="text-sm text-muted-foreground font-['DM_Sans']">{profile.email}</p>
                </div>
              </div>
              {match && (
                <div className="text-center">
                  <ScoreRing score={match.overall_score} size="sm" />
                  <p className="text-sm text-muted-foreground font-['DM_Sans'] mt-2">Match Score</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Match Breakdown */}
          {match && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
              <Card className="p-6">
                <h3 className="text-xl font-['Playfair_Display'] font-semibold mb-4">Match Breakdown</h3>
                <div className="grid md:grid-cols-5 gap-4 mb-6">
                  {Object.entries(match.breakdown).map(([key, val]) => (
                    <div key={key}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-['DM_Sans'] capitalize">{key.replace("_", " ")}</span>
                        <span className="text-sm font-['DM_Mono'] font-bold">{val as number}%</span>
                      </div>
                      <Progress value={val as number} className="h-2" />
                    </div>
                  ))}
                </div>
                <div className="p-4 rounded-lg bg-secondary/50">
                  <div className="flex items-start gap-3">
                    <Brain className="w-5 h-5 text-accent mt-0.5" />
                    <p className="text-sm font-['DM_Sans'] text-muted-foreground">{match.explanation}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* Skills */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <Card className="p-6">
                <h3 className="text-xl font-['Playfair_Display'] font-semibold mb-4">Skills</h3>
                {match ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-['DM_Sans'] font-semibold text-green-600 mb-2 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Matched ({match.matched_skills.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {match.matched_skills.map((s: string) => <SkillPill key={s} skill={s} variant="matched" />)}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-['DM_Sans'] font-semibold text-red-500 mb-2 flex items-center gap-2">
                        <XCircle className="w-4 h-4" /> Missing ({match.missing_skills.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {match.missing_skills.map((s: string) => <SkillPill key={s} skill={s} variant="missing" />)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {skills.technical.length > 0 && (
                      <div>
                        <p className="text-sm font-['DM_Sans'] font-semibold text-muted-foreground mb-2">Technical</p>
                        <div className="flex flex-wrap gap-2">
                          {skills.technical.map((s: string) => <SkillPill key={s} skill={s} variant="neutral" />)}
                        </div>
                      </div>
                    )}
                    {skills.soft.length > 0 && (
                      <div>
                        <p className="text-sm font-['DM_Sans'] font-semibold text-muted-foreground mb-2">Soft Skills</p>
                        <div className="flex flex-wrap gap-2">
                          {skills.soft.map((s: string) => <SkillPill key={s} skill={s} variant="neutral" />)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </motion.div>

            {/* Interview Questions */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <MessageCircle className="w-6 h-6 text-accent" />
                  <h3 className="text-xl font-['Playfair_Display'] font-semibold">AI Interview Questions</h3>
                </div>
                {questions.length > 0 ? (
                  <div className="space-y-4">
                    {questions.map((q: any, i: number) => (
                      <div key={i} className="p-4 rounded-lg bg-secondary/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="font-['DM_Mono'] text-xs" variant={q.category === "Technical" ? "default" : q.category === "Gap-Based" ? "destructive" : "secondary"}>
                            {q.category}
                          </Badge>
                        </div>
                        <p className="font-['DM_Sans'] text-sm">{q.question}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground font-['DM_Sans'] text-center py-8">
                    Select a job to generate interview questions
                  </p>
                )}
              </Card>
            </motion.div>
          </div>

          {/* Actions */}
          {jobId && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-['Playfair_Display'] font-semibold">Decision</h3>
                  {actionDone ? (
                    <Badge className={`font-['DM_Mono'] text-lg px-6 py-2 ${actionDone === "shortlisted" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {actionDone === "shortlisted" ? "✓ Shortlisted" : "✗ Rejected"}
                    </Badge>
                  ) : (
                    <div className="flex gap-3">
                      <Button onClick={handleShortlist} className="bg-green-600 hover:bg-green-700 text-white font-['DM_Sans']">
                        <ThumbsUp className="w-5 h-5 mr-2" /> Shortlist
                      </Button>
                      <Button onClick={handleReject} variant="destructive" className="font-['DM_Sans']">
                        <ThumbsDown className="w-5 h-5 mr-2" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
