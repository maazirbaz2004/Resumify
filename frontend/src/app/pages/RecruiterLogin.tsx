import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "motion/react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { User, Building, ArrowRight, Loader2, Shield, Eye, EyeOff } from "lucide-react";
import { DarkModeToggle } from "../components/DarkModeToggle";
import { useAuth } from "../context/AuthContext";

export default function RecruiterLogin() {
  const navigate = useNavigate();
  const { login, register, isAuthenticated, user, logout } = useAuth();

  // Candidate state
  const [candEmail, setCandEmail] = useState("");
  const [candPassword, setCandPassword] = useState("");
  const [candLoading, setCandLoading] = useState(false);
  const [candError, setCandError] = useState("");
  const [candMode, setCandMode] = useState<"login" | "register">("login");
  const [candName, setCandName] = useState("");

  // Recruiter state
  const [recEmail, setRecEmail] = useState("");
  const [recPassword, setRecPassword] = useState("");
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState("");
  const [recMode, setRecMode] = useState<"login" | "register">("login");
  const [recName, setRecName] = useState("");
  const [recCompany, setRecCompany] = useState("");
  const [showCandPassword, setShowCandPassword] = useState(false);
  const [showRecPassword, setShowRecPassword] = useState(false);

  const handleCandidateSubmit = async () => {
    setCandLoading(true);
    setCandError("");
    try {
      if (candMode === "register") {
        await register({ email: candEmail, password: candPassword, full_name: candName, role: "candidate" });
        navigate("/candidate/onboarding");
      } else {
        const loggedUser = await login(candEmail, candPassword);
        navigate(loggedUser.role === "candidate" ? "/candidate/dashboard" : "/");
      }
    } catch (err: any) {
      setCandError(err.message || "Authentication failed");
    } finally {
      setCandLoading(false);
    }
  };

  const handleRecruiterSubmit = async () => {
    setRecLoading(true);
    setRecError("");
    try {
      if (recMode === "register") {
        await register({ email: recEmail, password: recPassword, full_name: recName, role: "recruiter", company_name: recCompany });
      } else {
        await login(recEmail, recPassword);
      }
      navigate("/recruiter/dashboard");
    } catch (err: any) {
      setRecError(err.message || "Authentication failed");
    } finally {
      setRecLoading(false);
    }
  };

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative">
        <div className="absolute top-8 right-8 z-50"><DarkModeToggle /></div>
        <Card className="p-8 text-center max-w-md w-full shadow-lg">
          {user?.role === 'recruiter' ? (
             <Building className="w-12 h-12 text-accent mx-auto mb-4" />
          ) : user?.role === 'candidate' ? (
             <User className="w-12 h-12 text-accent mx-auto mb-4" />
          ) : (
             <Shield className="w-12 h-12 text-accent mx-auto mb-4" />
          )}
          <h2 className="text-2xl font-['Playfair_Display'] font-bold mb-2">Already Logged In</h2>
          <p className="text-muted-foreground font-['DM_Sans'] mb-6">
            You are currently logged in as a <strong className="capitalize">{user?.role}</strong>. You must logout before logging in to another account.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => navigate(user?.role === 'admin' ? '/admin/dashboard' : `/${user?.role}/dashboard`)} variant="outline" className="font-['DM_Sans']">
              Go to Dashboard
            </Button>
            <Button onClick={() => logout()} variant="destructive" className="font-['DM_Sans']">
              Logout
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background grid lg:grid-cols-2 relative">
      <div className="absolute top-8 right-8 z-50">
        <DarkModeToggle />
      </div>

      {/* Left Side - Candidate */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center justify-center p-8 bg-background"
      >
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-accent" />
            </div>
            <h2 className="text-3xl font-['Playfair_Display'] font-bold mb-2">
              For Candidates
            </h2>
            <p className="text-muted-foreground font-['DM_Sans']">
              Get AI-powered insights on your resume and discover perfect job matches
            </p>
          </div>

          <Card className="p-8">
            <div className="space-y-6">
              {candMode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="candidate-name" className="font-['DM_Sans']">Full Name</Label>
                  <Input id="candidate-name" value={candName} onChange={(e) => setCandName(e.target.value)}
                    placeholder="Sarah Johnson" className="font-['DM_Sans']" />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="candidate-email" className="font-['DM_Sans']">Email Address</Label>
                <Input id="candidate-email" type="email" value={candEmail} onChange={(e) => setCandEmail(e.target.value)}
                  placeholder="your.email@example.com" className="font-['DM_Sans']" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="candidate-password" className="font-['DM_Sans']">Password</Label>
                <div className="relative">
                  <Input id="candidate-password" type={showCandPassword ? "text" : "password"} value={candPassword} onChange={(e) => setCandPassword(e.target.value)}
                    placeholder="••••••••" className="font-['DM_Sans'] pr-10" />
                  <button type="button" onClick={() => setShowCandPassword(!showCandPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showCandPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {candError && <p className="text-sm text-red-500 font-['DM_Sans']">{candError}</p>}

              <Button onClick={handleCandidateSubmit} disabled={candLoading}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-['DM_Sans']">
                {candLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                {candMode === "register" ? "Create Account" : "Sign In as Candidate"}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>

              <div className="text-center">
                <Button variant="link" className="font-['DM_Sans'] text-accent"
                  onClick={() => { setCandMode(candMode === "login" ? "register" : "login"); setCandError(""); }}>
                  {candMode === "login" ? "New candidate? Create account" : "Already have an account? Sign in"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </motion.div>

      {/* Right Side - Recruiter */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center justify-center p-8 bg-sidebar text-sidebar-foreground"
      >
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
              <Building className="w-10 h-10 text-accent" />
            </div>
            <h2 className="text-3xl font-['Playfair_Display'] font-bold mb-2">
              For Recruiters
            </h2>
            <p className="text-sidebar-foreground/70 font-['DM_Sans']">
              Streamline your hiring with AI-powered candidate matching and analytics
            </p>
          </div>

          <Card className="p-8 bg-sidebar-accent border-sidebar-border">
            <div className="space-y-6">
              {recMode === "register" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="recruiter-name" className="font-['DM_Sans'] text-sidebar-foreground">Full Name</Label>
                    <Input id="recruiter-name" value={recName} onChange={(e) => setRecName(e.target.value)}
                      placeholder="John Smith" className="font-['DM_Sans'] bg-sidebar border-sidebar-border text-sidebar-foreground" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recruiter-company" className="font-['DM_Sans'] text-sidebar-foreground">Company Name</Label>
                    <Input id="recruiter-company" value={recCompany} onChange={(e) => setRecCompany(e.target.value)}
                      placeholder="TechCorp Inc" className="font-['DM_Sans'] bg-sidebar border-sidebar-border text-sidebar-foreground" />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="recruiter-email" className="font-['DM_Sans'] text-sidebar-foreground">Company Email</Label>
                <Input id="recruiter-email" type="email" value={recEmail} onChange={(e) => setRecEmail(e.target.value)}
                  placeholder="recruiter@company.com" className="font-['DM_Sans'] bg-sidebar border-sidebar-border text-sidebar-foreground" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recruiter-password" className="font-['DM_Sans'] text-sidebar-foreground">Password</Label>
                <div className="relative">
                  <Input id="recruiter-password" type={showRecPassword ? "text" : "password"} value={recPassword} onChange={(e) => setRecPassword(e.target.value)}
                    placeholder="••••••••" className="font-['DM_Sans'] bg-sidebar border-sidebar-border text-sidebar-foreground pr-10" />
                  <button type="button" onClick={() => setShowRecPassword(!showRecPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-sidebar-foreground/50 hover:text-sidebar-foreground">
                    {showRecPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {recError && <p className="text-sm text-red-500 font-['DM_Sans']">{recError}</p>}

              <Button onClick={handleRecruiterSubmit} disabled={recLoading}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-['DM_Sans']">
                {recLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                {recMode === "register" ? "Create Account" : "Sign In as Recruiter"}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>

              <div className="text-center">
                <Button variant="link" className="font-['DM_Sans'] text-accent hover:text-accent/80"
                  onClick={() => { setRecMode(recMode === "login" ? "register" : "login"); setRecError(""); }}>
                  {recMode === "login" ? "New recruiter? Create account" : "Already have an account? Sign in"}
                </Button>
              </div>
            </div>
          </Card>

          <div className="mt-6 text-center">
            <Link to="/">
              <Button variant="link" className="font-['DM_Sans'] text-sidebar-foreground/70">
                ← Back to home
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}