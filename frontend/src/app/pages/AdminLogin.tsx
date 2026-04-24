import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Shield, ArrowRight, Loader2 } from "lucide-react";
import { DarkModeToggle } from "../components/DarkModeToggle";
import { useAuth } from "../context/AuthContext";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const user = await login(email, password);
      if (user.role !== "admin") {
        setError("This account is not an admin");
        return;
      }
      navigate("/admin/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative">
      <div className="absolute top-8 right-8 z-50"><DarkModeToggle /></div>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10 text-accent" />
          </div>
          <h1 className="text-3xl font-['Playfair_Display'] font-bold mb-2">Admin Portal</h1>
          <p className="text-muted-foreground font-['DM_Sans']">Secure access for platform administrators</p>
        </div>

        <Card className="p-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="font-['DM_Sans']">Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@resumify.com" className="font-['DM_Sans']" />
            </div>
            <div className="space-y-2">
              <Label className="font-['DM_Sans']">Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" className="font-['DM_Sans']" />
            </div>
            {error && <p className="text-sm text-red-500 font-['DM_Sans']">{error}</p>}
            <Button onClick={handleLogin} disabled={loading}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-['DM_Sans']">
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              Sign In <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}