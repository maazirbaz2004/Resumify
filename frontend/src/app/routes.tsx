import { createBrowserRouter } from "react-router";
import LandingPage from "./pages/LandingPage";
import CandidateOnboarding from "./pages/CandidateOnboarding";
import CandidateDashboard from "./pages/CandidateDashboard";
import CandidateJobMatching from "./pages/CandidateJobMatching";
import CandidateSkillGap from "./pages/CandidateSkillGap";
import CandidateATS from "./pages/CandidateATS";
import CandidateCareerPath from "./pages/CandidateCareerPath";
import RecruiterLogin from "./pages/RecruiterLogin";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import RecruiterRanking from "./pages/RecruiterRanking";
import RecruiterProfile from "./pages/RecruiterProfile";
import RecruiterJDParser from "./pages/RecruiterJDParser";
import RecruiterAnalytics from "./pages/RecruiterAnalytics";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import DesignSystem from "./pages/DesignSystem";

/* Central Routing Configuration */
export const router = createBrowserRouter([
  { // Public Landing Page
    path: "/",
    Component: LandingPage,
  },
  { // Candidate Routes
    path: "/candidate/onboarding",
    Component: CandidateOnboarding,
  },
  {
    path: "/candidate/dashboard",
    Component: CandidateDashboard,
  },
  {
    path: "/candidate/jobs",
    Component: CandidateJobMatching,
  },
  {
    path: "/candidate/skill-gap",
    Component: CandidateSkillGap,
  },
  {
    path: "/candidate/ats",
    Component: CandidateATS,
  },
  {
    path: "/candidate/career-path",
    Component: CandidateCareerPath,
  },
  {
    path: "/recruiter/login",
    Component: RecruiterLogin,
  },
  {
    path: "/recruiter/dashboard",
    Component: RecruiterDashboard,
  },
  {
    path: "/recruiter/ranking",
    Component: RecruiterRanking,
  },
  {
    path: "/recruiter/profile/:id",
    Component: RecruiterProfile,
  },
  {
    path: "/recruiter/jd-parser",
    Component: RecruiterJDParser,
  },
  {
    path: "/recruiter/analytics",
    Component: RecruiterAnalytics,
  },
  {
    path: "/admin/login",
    Component: AdminLogin,
  },
  {
    path: "/admin/dashboard",
    Component: AdminDashboard,
  },
  {
    path: "/design-system",
    Component: DesignSystem,
  },
]);