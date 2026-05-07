import { Link, useLocation, useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  Briefcase,
  Target,
  FileCheck,
  TrendingUp,
  User,
  Users,
  FileText,
  BarChart3,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface SidebarProps {
  type: "candidate" | "recruiter";
}

export function Sidebar({ type }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const candidateLinks = [
    { path: "/candidate/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/candidate/jobs", icon: Briefcase, label: "Job Matches" },
    { path: "/candidate/skill-gap", icon: Target, label: "Skill Gap" },
    { path: "/candidate/career-path", icon: TrendingUp, label: "Career Path" },
    { path: "/candidate/ats", icon: FileCheck, label: "ATS Check" },
  ];

  const recruiterLinks = [
    { path: "/recruiter/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/recruiter/ranking", icon: Users, label: "Candidate Ranking" },
    { path: "/recruiter/jd-parser", icon: FileText, label: "JD Parser" },
    { path: "/recruiter/analytics", icon: BarChart3, label: "Analytics" },
  ];

  const links = type === "candidate" ? candidateLinks : recruiterLinks;

  return (
    <div className="w-60 h-screen bg-sidebar text-sidebar-foreground flex flex-col fixed left-0 top-0">
      <div className="p-6 border-b border-sidebar-border">
        <Link to="/">
          <h1 className="text-2xl font-['Playfair_Display'] font-bold">
            Resum<span className="text-accent">ify</span>
          </h1>
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map((link, index) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;

          return (
            <Link key={link.path} to={link.path}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-['DM_Sans'] ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "hover:bg-sidebar-accent text-sidebar-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{link.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-sidebar-border mt-auto">
        <button
          onClick={handleLogout}
          className="flex items-center w-full gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-['DM_Sans'] text-red-500/80 hover:text-red-500 hover:bg-red-500/10"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
