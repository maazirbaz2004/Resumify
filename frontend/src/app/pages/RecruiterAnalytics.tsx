import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Sidebar } from "../components/Sidebar";
import { Card } from "../components/ui/card";
import { Loader2, TrendingUp, Users, PieChart as PieIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { DarkModeToggle } from "../components/DarkModeToggle";
import { useAuth } from "../context/AuthContext";
import { recruiter as recruiterApi } from "../services/api";

const COLORS = ["#C9A84C", "#0D0D0D", "#4CAF50", "#FF9800", "#2196F3", "#9C27B0"];
// to show recruiter analytics
export default function RecruiterAnalytics() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated) { navigate("/recruiter/login"); return; }
    recruiterApi.analytics()
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

  const funnel = data?.hiring_funnel || [];
  const skillDemand = data?.skill_demand || [];

  const funnelData = funnel.map((f: any) => ({
    name: f.status.charAt(0).toUpperCase() + f.status.slice(1),
    value: parseInt(f.count),
  }));

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar type="recruiter" />
      <div className="flex-1 ml-60 relative">
        <div className="absolute top-8 right-8 z-50"><DarkModeToggle /></div>

        <div className="p-8">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-4xl font-['Playfair_Display'] font-bold mb-2">Talent Analytics</h1>
            <p className="text-muted-foreground font-['DM_Sans']">Data-driven insights on your hiring pipeline</p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* Hiring Funnel */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <PieIcon className="w-6 h-6 text-accent" />
                  <h3 className="text-xl font-['Playfair_Display'] font-semibold">Hiring Funnel</h3>
                </div>
                {funnelData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={funnelData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {funnelData.map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontFamily: "DM Sans", borderRadius: "8px" }} />
                      <Legend wrapperStyle={{ fontFamily: "DM Sans" }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground font-['DM_Sans'] text-center py-12">No pipeline data yet</p>
                )}
              </Card>
            </motion.div>

            {/* Skill Demand */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <TrendingUp className="w-6 h-6 text-accent" />
                  <h3 className="text-xl font-['Playfair_Display'] font-semibold">Most Required Skills</h3>
                </div>
                {skillDemand.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={skillDemand} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E3DE" />
                      <XAxis type="number" className="font-['DM_Sans'] text-xs" />
                      <YAxis type="category" dataKey="skill" className="font-['DM_Sans'] text-xs" width={120} />
                      <Tooltip contentStyle={{ fontFamily: "DM Sans", borderRadius: "8px" }} />
                      <Bar dataKey="count" fill="#C9A84C" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground font-['DM_Sans'] text-center py-12">No skill demand data yet</p>
                )}
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
