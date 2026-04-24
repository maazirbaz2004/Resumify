import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { motion } from "motion/react";
import { Sidebar } from "../components/Sidebar";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { SkillPill } from "../components/SkillPill";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import { Eye, EyeOff, Loader2, Trophy, Users } from "lucide-react";
import { DarkModeToggle } from "../components/DarkModeToggle";
import { useAuth } from "../context/AuthContext";
import { recruiter as recruiterApi } from "../services/api";

export default function RecruiterRanking() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [blindMode, setBlindMode] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [candidates, setCandidates] = useState<any[]>([]);
  const [rankingLoading, setRankingLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { navigate("/recruiter/login"); return; }
    recruiterApi.listJobs()
      .then((j) => {
        setJobs(j);
        if (j.length > 0) setSelectedJobId(j[0].id.toString());
      })
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  useEffect(() => {
    if (!selectedJobId) return;
    setRankingLoading(true);
    recruiterApi.getCandidates(parseInt(selectedJobId))
      .then(setCandidates)
      .catch(() => setCandidates([]))
      .finally(() => setRankingLoading(false));
  }, [selectedJobId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar type="recruiter" />
      <div className="flex-1 ml-60 relative">
        <div className="absolute top-8 right-8 z-50"><DarkModeToggle /></div>

        <div className="p-8">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-4xl font-['Playfair_Display'] font-bold mb-2">Candidate Ranking</h1>
            <p className="text-muted-foreground font-['DM_Sans']">AI-powered candidate ranking based on job fit</p>
          </motion.div>

          {/* Controls */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
            <Card className="p-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 flex-1">
                  <Label className="font-['DM_Sans'] font-medium whitespace-nowrap">Job:</Label>
                  <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                    <SelectTrigger className="font-['DM_Sans'] w-72"><SelectValue placeholder="Select a job" /></SelectTrigger>
                    <SelectContent>
                      {jobs.map((j: any) => (
                        <SelectItem key={j.id} value={j.id.toString()}>{j.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="font-['DM_Sans'] text-sm">Blind Mode</Label>
                  <Switch checked={blindMode} onCheckedChange={setBlindMode} />
                  {blindMode ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* No jobs message */}
          {jobs.length === 0 && (
            <Card className="p-8 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-['Playfair_Display'] font-bold mb-2">No Jobs Posted Yet</h3>
              <p className="text-muted-foreground font-['DM_Sans'] mb-4">Create a job posting first using the JD Parser</p>
              <Link to="/recruiter/jd-parser">
                <Button className="bg-accent text-accent-foreground font-['DM_Sans']">Go to JD Parser</Button>
              </Link>
            </Card>
          )}

          {/* Ranking Results */}
          {rankingLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-accent mr-3" />
              <span className="font-['DM_Sans'] text-muted-foreground">Ranking candidates with AI...</span>
            </div>
          ) : candidates.length > 0 ? (
            <div className="space-y-4">
              {candidates.map((c: any, index: number) => (
                <motion.div key={c.candidate_id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}>
                  <Card className={`p-6 hover:shadow-lg transition-all ${index < 3 ? "border-accent/30" : ""}`}>
                    <div className="flex items-center gap-6">
                      {/* Rank */}
                      <div className="flex flex-col items-center w-16">
                        <span className="text-2xl">{index < 3 ? medals[index] : ""}</span>
                        <span className="text-2xl font-['Playfair_Display'] font-bold text-accent">#{c.rank}</span>
                      </div>

                      {/* Name / Info */}
                      <div className="flex-1">
                        <h3 className="text-lg font-['DM_Sans'] font-semibold">
                          {blindMode ? `Candidate ${c.rank}` : c.name}
                        </h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {(c.top_skills || []).slice(0, 4).map((skill: string) => (
                            <SkillPill key={skill} skill={skill} variant="neutral" />
                          ))}
                        </div>
                      </div>

                      {/* Scores */}
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-2xl font-['Playfair_Display'] font-bold text-accent">{c.match_score}%</p>
                          <p className="text-xs text-muted-foreground font-['DM_Sans']">Overall</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-['DM_Mono'] font-semibold">{c.skill_match_pct}%</p>
                          <p className="text-xs text-muted-foreground font-['DM_Sans']">Skills</p>
                        </div>
                        <Link to={`/recruiter/profile/${c.candidate_id}?job_id=${selectedJobId}`}>
                          <Button variant="outline" className="font-['DM_Sans']">View Profile</Button>
                        </Link>
                      </div>
                    </div>

                    {/* Matched / Missing */}
                    {(c.matched_skills?.length > 0 || c.missing_skills?.length > 0) && (
                      <div className="mt-4 pt-4 border-t border-border flex gap-6">
                        {c.matched_skills?.length > 0 && (
                          <div>
                            <p className="text-xs text-green-600 font-['DM_Sans'] font-semibold mb-1">✓ Matched</p>
                            <div className="flex flex-wrap gap-1">
                              {c.matched_skills.slice(0, 5).map((s: string) => (
                                <SkillPill key={s} skill={s} variant="matched" />
                              ))}
                            </div>
                          </div>
                        )}
                        {c.missing_skills?.length > 0 && (
                          <div>
                            <p className="text-xs text-red-500 font-['DM_Sans'] font-semibold mb-1">✗ Missing</p>
                            <div className="flex flex-wrap gap-1">
                              {c.missing_skills.slice(0, 5).map((s: string) => (
                                <SkillPill key={s} skill={s} variant="missing" />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : selectedJobId && (
            <Card className="p-8 text-center">
              <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-['Playfair_Display'] font-bold mb-2">No Candidates to Rank</h3>
              <p className="text-muted-foreground font-['DM_Sans']">No resumes in the system yet. Candidates need to upload their resumes first.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
