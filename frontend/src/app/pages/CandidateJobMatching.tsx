import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Sidebar } from "../components/Sidebar";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { SkillPill } from "../components/SkillPill";
import { Badge } from "../components/ui/badge";
import { Search, MapPin, Briefcase, Loader2, Send, Check } from "lucide-react";
import { Progress } from "../components/ui/progress";
import { DarkModeToggle } from "../components/DarkModeToggle";
import { useAuth } from "../context/AuthContext";
import { candidate as candidateApi } from "../services/api";

export default function CandidateJobMatching() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedJobs, setAppliedJobs] = useState<Set<number>>(new Set());
  const [applyingId, setApplyingId] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) { navigate("/recruiter/login"); return; }

    // Load job matches and existing applications in parallel
    Promise.all([
      candidateApi.jobMatches(),
      candidateApi.applications(),
    ]).then(([matches, apps]) => {
      setJobs(matches.map((m: any) => ({
        id: m.job_id,
        company: m.company,
        role: m.title,
        location: m.location,
        experience: m.experience_level,
        match: Math.round(m.match_score),
        matchedSkills: m.matched_skills || [],
        missingSkills: m.missing_skills || [],
        explanation: m.explanation || "",
        matchBreakdown: m.breakdown || {},
      })));
      // Mark already-applied jobs
      setAppliedJobs(new Set(apps.map((a: any) => a.job_id)));
    })
    .catch(() => setJobs([]))
    .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const handleApply = async (jobId: number) => {
    setApplyingId(jobId);
    try {
      await candidateApi.apply(jobId);
      setAppliedJobs(prev => new Set(prev).add(jobId));
    } catch (err: any) {
      // If already applied (409), still mark as applied
      if (err.message?.includes("Already applied")) {
        setAppliedJobs(prev => new Set(prev).add(jobId));
      }
    } finally {
      setApplyingId(null);
    }
  };

  const filteredJobs = jobs.filter(j =>
    j.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto mb-4" />
          <p className="text-muted-foreground font-['DM_Sans']">Matching you against real job postings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar type="candidate" />

      <div className="flex-1 ml-60 relative">
        <div className="absolute top-8 right-8 z-50">
          <DarkModeToggle />
        </div>

        <div className="p-8">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-4xl font-['Playfair_Display'] font-bold mb-2">Job Matches</h1>
            <p className="text-muted-foreground font-['DM_Sans']">
              AI-matched against {jobs.length} real job posting{jobs.length !== 1 ? "s" : ""} from recruiters
            </p>
          </motion.div>

          {/* Search */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
            <Card className="p-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input placeholder="Search roles or companies..." className="pl-10 font-['DM_Sans']"
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </div>
            </Card>
          </motion.div>

          {filteredJobs.length === 0 ? (
            <Card className="p-8 text-center">
              <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-['Playfair_Display'] font-bold mb-2">No Job Matches Found</h3>
              <p className="text-muted-foreground font-['DM_Sans']">
                {jobs.length === 0
                  ? "No jobs have been posted by recruiters yet. Check back later!"
                  : "No jobs match your search. Try different keywords."}
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredJobs.map((job, index) => {
                const isApplied = appliedJobs.has(job.id);
                const isApplying = applyingId === job.id;

                return (
                  <motion.div key={job.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}>
                    <Card className="p-6">
                      <div className="flex items-start gap-6">
                        {/* Company Avatar */}
                        <div className="w-14 h-14 rounded-lg bg-accent/10 flex items-center justify-center font-['Playfair_Display'] font-bold text-accent text-xl flex-shrink-0">
                          {job.company[0]}
                        </div>

                        {/* Job Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-xl font-['DM_Sans'] font-semibold">{job.role}</h3>
                              <p className="text-muted-foreground font-['DM_Sans']">{job.company}</p>
                              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground font-['DM_Sans']">
                                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{job.location}</span>
                                {job.experience && <span>• {job.experience}</span>}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className={`text-3xl font-['Playfair_Display'] font-bold ${
                                job.match >= 80 ? "text-green-600" : job.match >= 60 ? "text-accent" : "text-orange-500"
                              }`}>{job.match}%</div>
                              <p className="text-xs text-muted-foreground font-['DM_Sans']">Match</p>
                            </div>
                          </div>

                          {/* Match Breakdown */}
                          {Object.keys(job.matchBreakdown).length > 0 && (
                            <div className="grid grid-cols-4 gap-4 my-4">
                              {Object.entries(job.matchBreakdown).map(([key, value]) => (
                                <div key={key}>
                                  <div className="flex justify-between mb-1">
                                    <span className="text-xs font-['DM_Sans'] capitalize text-muted-foreground">{key.replace(/_/g, " ")}</span>
                                    <span className="text-xs font-['DM_Mono'] font-semibold">{value as number}%</span>
                                  </div>
                                  <Progress value={value as number} className="h-1.5" />
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Skills */}
                          <div className="flex flex-wrap gap-2 mt-3">
                            {job.matchedSkills.slice(0, 6).map((skill: string) => (
                              <SkillPill key={skill} skill={skill} variant="matched" />
                            ))}
                            {job.missingSkills.slice(0, 3).map((skill: string) => (
                              <SkillPill key={skill} skill={skill} variant="missing" />
                            ))}
                          </div>

                          {/* Explanation */}
                          {job.explanation && (
                            <p className="text-sm text-muted-foreground font-['DM_Sans'] mt-3 leading-relaxed">
                              {job.explanation}
                            </p>
                          )}

                          {/* Apply Button */}
                          <div className="mt-4 flex items-center gap-3">
                            {isApplied ? (
                              <Badge className="bg-green-100 text-green-800 font-['DM_Sans'] px-4 py-2 text-sm">
                                <Check className="w-4 h-4 mr-1.5" /> Applied
                              </Badge>
                            ) : (
                              <Button
                                onClick={() => handleApply(job.id)}
                                disabled={isApplying}
                                className="bg-accent text-accent-foreground hover:bg-accent/90 font-['DM_Sans']"
                              >
                                {isApplying ? (
                                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                  <Send className="w-4 h-4 mr-2" />
                                )}
                                {isApplying ? "Applying..." : "Apply Now"}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}