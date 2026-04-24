import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Sidebar } from "../components/Sidebar";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { SkillPill } from "../components/SkillPill";
import { Badge } from "../components/ui/badge";
import { ArrowRight, Clock, TrendingUp, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { candidate as candidateApi } from "../services/api";

export default function CandidateCareerPath() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [selectedPath, setSelectedPath] = useState(0);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated) { navigate("/recruiter/login"); return; }
    candidateApi.careerPath()
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

  const paths = data?.paths || [];
  const currentRole = data?.current_role || "Your Role";
  const currentPath = paths[selectedPath] || { name: "No paths", steps: [] };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar type="candidate" />
      <div className="flex-1 ml-60">
        <div className="p-8">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-4xl font-['Playfair_Display'] font-bold mb-2">Career Path Simulation</h1>
            <p className="text-muted-foreground font-['DM_Sans']">
              Visualize your career trajectory from <span className="font-semibold text-accent">{currentRole}</span>
            </p>
          </motion.div>

          {/* Path Selector */}
          {paths.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
              <Card className="p-6">
                <h3 className="text-lg font-['DM_Sans'] font-semibold mb-4">Choose Your Path</h3>
                <div className="flex flex-wrap gap-3">
                  {paths.map((path: any, index: number) => (
                    <Button key={path.name} variant={selectedPath === index ? "default" : "outline"}
                      onClick={() => setSelectedPath(index)}
                      className={`font-['DM_Sans'] ${selectedPath === index ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}`}>
                      {path.name}
                    </Button>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Career Timeline */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="p-8">
              <h3 className="text-2xl font-['Playfair_Display'] font-semibold mb-8">{currentPath.name}</h3>
              <div className="relative">
                <div className="absolute top-20 left-0 right-0 h-1 bg-border hidden lg:block" />
                <div className="grid lg:grid-cols-3 gap-8 relative">
                  {currentPath.steps.map((step: any, index: number) => (
                    <motion.div key={index} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.2 }} className="relative">
                      {index < currentPath.steps.length - 1 && (
                        <div className="hidden lg:flex absolute -right-4 top-20 z-10 w-8 h-8 items-center justify-center bg-background">
                          <ArrowRight className="w-6 h-6 text-accent" />
                        </div>
                      )}
                      <Card className={`p-6 ${step.current ? "border-2 border-accent shadow-lg" : "border-border"}`}>
                        <div className="flex items-center justify-between mb-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-['Playfair_Display'] font-bold text-xl ${
                            step.current ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"
                          }`}>
                            {index + 1}
                          </div>
                          {step.current && (
                            <Badge className="bg-accent text-accent-foreground font-['DM_Mono']">Current</Badge>
                          )}
                        </div>
                        <h4 className="text-xl font-['Playfair_Display'] font-bold mb-2">{step.role}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground font-['DM_Sans'] mb-4">
                          <Clock className="w-4 h-4" />
                          {step.duration}
                        </div>
                        <div>
                          <p className="text-sm font-['DM_Sans'] font-semibold text-muted-foreground mb-3">Required Skills:</p>
                          <div className="flex flex-wrap gap-2">
                            {step.skills.map((skill: string, si: number) => (
                              <SkillPill key={skill} skill={skill} variant={step.current ? "matched" : "neutral"} delay={si * 0.05} />
                            ))}
                          </div>
                        </div>
                        {!step.current && (
                          <div className="mt-4 pt-4 border-t border-border">
                            <div className="flex items-center gap-2 text-sm text-accent font-['DM_Sans']">
                              <TrendingUp className="w-4 h-4" />
                              <span className="font-semibold">{step.skills.length} new skills to learn</span>
                            </div>
                          </div>
                        )}
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
