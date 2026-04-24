import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Users, Briefcase, TrendingUp, Shield, Loader2, UserCheck, UserX, Trash2, Check, X, Clock } from "lucide-react";
import { DarkModeToggle } from "../components/DarkModeToggle";
import { useAuth } from "../context/AuthContext";
import { admin as adminApi } from "../services/api";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [auditLog, setAuditLog] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "admin") { navigate("/admin/login"); return; }
    Promise.all([
      adminApi.dashboard(),
      adminApi.getUsers(),
      adminApi.getJobs(),
      adminApi.auditLog(),
    ]).then(([dash, u, j, log]) => {
      setKpis(dash);
      setUsers(u);
      setJobs(j);
      setAuditLog(log);
    }).catch(() => {})
    .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const handleUserAction = async (userId: number, action: "activate" | "suspend" | "delete") => {
    try {
      await adminApi.updateUserStatus(userId, action);
      setUsers(prev => action === "delete"
        ? prev.filter(u => u.id !== userId)
        : prev.map(u => u.id === userId ? { ...u, is_active: action === "activate" } : u)
      );
    } catch {}
  };

  const handleJobStatus = async (jobId: number, status: string) => {
    try {
      await adminApi.updateJobStatus(jobId, status);
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status } : j));
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const kpiCards = [
    { label: "Total Users", value: kpis?.total_users || 0, icon: Users },
    { label: "Candidates", value: kpis?.candidates || 0, icon: UserCheck },
    { label: "Recruiters", value: kpis?.recruiters || 0, icon: Briefcase },
    { label: "Active Jobs", value: kpis?.active_jobs || 0, icon: TrendingUp },
  ];

  const roleColors: Record<string, string> = { candidate: "bg-blue-100 text-blue-800", recruiter: "bg-purple-100 text-purple-800", admin: "bg-amber-100 text-amber-800" };
  const statusColors: Record<string, string> = { published: "bg-green-100 text-green-800", draft: "bg-gray-100 text-gray-800", under_review: "bg-amber-100 text-amber-800", closed: "bg-red-100 text-red-800", rejected: "bg-red-100 text-red-800" };

  return (
    <div className="min-h-screen bg-background relative">
      <div className="absolute top-8 right-8 z-50"><DarkModeToggle /></div>

      <div className="p-8 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-accent" />
            <h1 className="text-4xl font-['Playfair_Display'] font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-muted-foreground font-['DM_Sans']">Platform management and oversight</p>
        </motion.div>

        {/* KPIs */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {kpiCards.map((kpi, i) => (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <kpi.icon className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-3xl font-['Playfair_Display'] font-bold">{kpi.value}</h3>
                <p className="text-sm text-muted-foreground font-['DM_Sans']">{kpi.label}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users">
          <TabsList className="mb-6">
            <TabsTrigger value="users" className="font-['DM_Sans']">Manage Users</TabsTrigger>
            <TabsTrigger value="jobs" className="font-['DM_Sans']">Job Postings</TabsTrigger>
            <TabsTrigger value="audit" className="font-['DM_Sans']">Audit Log</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="p-6">
              <h3 className="text-xl font-['Playfair_Display'] font-semibold mb-4">All Users ({users.length})</h3>
              <div className="space-y-3">
                {users.map((u) => (
                  <motion.div key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center font-['Playfair_Display'] font-bold text-accent">
                        {u.full_name[0]}
                      </div>
                      <div>
                        <p className="font-['DM_Sans'] font-medium">{u.full_name}</p>
                        <p className="text-sm text-muted-foreground font-['DM_Sans']">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={`font-['DM_Mono'] ${roleColors[u.role] || ""}`}>{u.role}</Badge>
                      <Badge className={`font-['DM_Mono'] ${u.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {u.is_active ? "Active" : "Suspended"}
                      </Badge>
                      {u.role !== "admin" && (
                        <div className="flex gap-1">
                          {u.is_active ? (
                            <Button size="sm" variant="outline" onClick={() => handleUserAction(u.id, "suspend")}>
                              <UserX className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => handleUserAction(u.id, "activate")}>
                              <UserCheck className="w-4 h-4" />
                            </Button>
                          )}
                          <Button size="sm" variant="destructive" onClick={() => handleUserAction(u.id, "delete")}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                {users.length === 0 && <p className="text-center text-muted-foreground font-['DM_Sans'] py-8">No users yet</p>}
              </div>
            </Card>
          </TabsContent>

          {/* Jobs Tab */}
          <TabsContent value="jobs">
            <Card className="p-6">
              <h3 className="text-xl font-['Playfair_Display'] font-semibold mb-4">All Job Postings ({jobs.length})</h3>
              <div className="space-y-3">
                {jobs.map((j) => (
                  <motion.div key={j.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                    <div>
                      <p className="font-['DM_Sans'] font-semibold">{j.title}</p>
                      <p className="text-sm text-muted-foreground font-['DM_Sans']">
                        {j.company_name || "Company"} • {new Date(j.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={`font-['DM_Mono'] ${statusColors[j.status] || ""}`}>{j.status}</Badge>
                      {j.status === "under_review" && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => handleJobStatus(j.id, "published")}>
                            <Check className="w-4 h-4 text-green-600" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleJobStatus(j.id, "rejected")}>
                            <X className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      )}
                      {j.status === "published" && (
                        <Button size="sm" variant="outline" onClick={() => handleJobStatus(j.id, "closed")}>Close</Button>
                      )}
                    </div>
                  </motion.div>
                ))}
                {jobs.length === 0 && <p className="text-center text-muted-foreground font-['DM_Sans'] py-8">No job postings yet</p>}
              </div>
            </Card>
          </TabsContent>

          {/* Audit Log Tab */}
          <TabsContent value="audit">
            <Card className="p-6">
              <h3 className="text-xl font-['Playfair_Display'] font-semibold mb-4">Audit Trail</h3>
              <div className="space-y-3">
                {auditLog.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-['DM_Sans'] text-sm">
                        <span className="font-semibold">{entry.admin_name}</span> performed{" "}
                        <span className="font-semibold text-accent">{entry.action}</span> on {entry.target_type} #{entry.target_id}
                      </p>
                      <p className="text-xs text-muted-foreground font-['DM_Sans']">
                        {new Date(entry.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                {auditLog.length === 0 && <p className="text-center text-muted-foreground font-['DM_Sans'] py-8">No audit entries yet</p>}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}