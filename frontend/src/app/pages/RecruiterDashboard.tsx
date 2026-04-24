import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Sidebar } from "../components/Sidebar";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Users, Briefcase, TrendingUp, AlertCircle, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DarkModeToggle } from "../components/DarkModeToggle";
import { useAuth } from "../context/AuthContext";
import { recruiter as recruiterApi } from "../services/api";

export default function RecruiterDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated) { navigate("/recruiter/login"); return; }
    recruiterApi.dashboard()
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

  const kpis = data?.kpis || { total_applications: 0, shortlisted: 0, avg_match_score: 0, open_positions: 0 };
  const recentApps = data?.recent_applications || [];
  const skillDist = data?.skill_distribution || [];

  const kpiData = [
    { label: "Total Applications", value: kpis.total_applications.toLocaleString(), icon: Users },
    { label: "Shortlisted", value: kpis.shortlisted.toLocaleString(), icon: TrendingUp },
    { label: "Avg Match Score", value: `${kpis.avg_match_score}%`, icon: Briefcase },
    { label: "Open Positions", value: kpis.open_positions.toString(), icon: AlertCircle },
  ];

  const statusColors: Record<string, string> = {
    shortlisted: "default",
    pending: "secondary",
    rejected: "destructive",
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar type="recruiter" />

      <div className="flex-1 ml-60 relative">
        <div className="absolute top-8 right-8 z-50">
          <DarkModeToggle />
        </div>

        <div className="p-8">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-4xl font-['Playfair_Display'] font-bold mb-2">Recruiter Dashboard</h1>
            <p className="text-muted-foreground font-['DM_Sans']">
              {data?.company ? `${data.company} — ` : ""}Overview of your hiring pipeline and candidate analytics
            </p>
          </motion.div>

          {/* KPI Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            {kpiData.map((kpi, index) => (
              <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}>
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                      <kpi.icon className="w-6 h-6 text-accent" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-['Playfair_Display'] font-bold mb-1">{kpi.value}</h3>
                  <p className="text-sm text-muted-foreground font-['DM_Sans']">{kpi.label}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Skill Distribution Chart */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <Card className="p-6">
                <h3 className="text-xl font-['Playfair_Display'] font-semibold mb-6">Top Skills in Applicant Pool</h3>
                {skillDist.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={skillDist}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E3DE" />
                      <XAxis dataKey="skill_name" className="font-['DM_Sans'] text-xs" />
                      <YAxis className="font-['DM_Sans'] text-xs" />
                      <Tooltip contentStyle={{ fontFamily: "DM Sans", borderRadius: "8px", border: "1px solid #E5E3DE" }} />
                      <Bar dataKey="count" fill="#C9A84C" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground font-['DM_Sans'] text-center py-12">
                    No applicant data yet. Post a job to start receiving applications.
                  </p>
                )}
              </Card>
            </motion.div>

            {/* Recent Applications */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
              <Card className="p-6">
                <h3 className="text-xl font-['Playfair_Display'] font-semibold mb-6">Recent Applications</h3>
                {recentApps.length > 0 ? (
                  <div className="space-y-4">
                    {recentApps.map((app: any, index: number) => (
                      <motion.div key={index} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.05 }}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center font-['Playfair_Display'] font-bold text-accent">
                            {(app.full_name || "?")[0]}
                          </div>
                          <div>
                            <p className="font-['DM_Sans'] font-medium">{app.full_name || "Candidate"}</p>
                            <p className="text-xs text-muted-foreground font-['DM_Sans'] mt-0.5">
                              Applied for: <span className="font-medium text-foreground/80">{app.job_title || "Unknown Job"}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {app.match_score && (
                            <span className="font-['DM_Mono'] font-bold text-accent">{Math.round(app.match_score)}%</span>
                          )}
                          <Badge variant={statusColors[app.status] as any || "secondary"} className="font-['DM_Mono'] capitalize">
                            {app.status}
                          </Badge>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground font-['DM_Sans'] text-center py-12">
                    No applications received yet.
                  </p>
                )}
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}