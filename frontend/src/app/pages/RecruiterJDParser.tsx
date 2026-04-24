import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Sidebar } from "../components/Sidebar";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { SkillPill } from "../components/SkillPill";
import { Sparkles, FileText, Briefcase, GraduationCap, Users, Loader2, Save, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { recruiter as recruiterApi } from "../services/api";

export default function RecruiterJDParser() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isParsed, setIsParsed] = useState(false);
  const [jdText, setJdText] = useState("");
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!isAuthenticated) { navigate("/recruiter/login"); return null; }

  const handleParse = async () => {
    if (!jdText.trim()) return;
    setLoading(true);
    try {
      // Call AI service directly for JD parsing
      const res = await fetch("http://localhost:8000/api/ai/parse-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jd_text: jdText }),
      });
      const data = await res.json();
      setParsedData(data);
      setIsParsed(true);
    } catch {
      setParsedData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveJob = async () => {
    if (!parsedData) return;
    setSaving(true);
    try {
      await recruiterApi.createJob({
        title: parsedData.role_title,
        description: jdText,
        company: "",
        location: parsedData.location,
        experience_level: parsedData.experience_level,
        education: parsedData.education,
        seniority: parsedData.seniority,
        required_skills: parsedData.required_skills,
        soft_skills: parsedData.soft_skills,
      });
      setSaved(true);
    } catch {
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar type="recruiter" />
      <div className="flex-1 ml-60">
        <div className="p-8">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-4xl font-['Playfair_Display'] font-bold mb-2">JD Parser</h1>
            <p className="text-muted-foreground font-['DM_Sans']">Paste a job description and let AI extract the key requirements</p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Input */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <Card className="p-6">
                <h3 className="text-xl font-['Playfair_Display'] font-semibold mb-4">Job Description</h3>
                <Textarea value={jdText} onChange={(e) => { setJdText(e.target.value); setIsParsed(false); setSaved(false); }}
                  placeholder="Paste the full job description here..."
                  className="min-h-[300px] font-['DM_Sans'] mb-4" />
                <Button onClick={handleParse} disabled={loading || !jdText.trim()}
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-['DM_Sans']">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
                  {loading ? "Analyzing..." : "Parse with AI"}
                </Button>
              </Card>
            </motion.div>

            {/* Parsed Results */}
            <AnimatePresence>
              {isParsed && parsedData && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-['Playfair_Display'] font-semibold">Parsed Results</h3>
                      <Badge className="bg-green-100 text-green-800 font-['DM_Mono']">AI Extracted</Badge>
                    </div>

                    <div className="space-y-6">
                      {/* Role */}
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground font-['DM_Sans']">Role Title</p>
                          <p className="font-['DM_Sans'] font-semibold">{parsedData.role_title}</p>
                        </div>
                      </div>

                      {/* Required Skills */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Briefcase className="w-5 h-5 text-accent" />
                          <p className="text-sm font-['DM_Sans'] font-semibold">Required Skills ({parsedData.required_skills?.length || 0})</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(parsedData.required_skills || []).map((skill: string) => (
                            <SkillPill key={skill} skill={skill} variant="neutral" />
                          ))}
                        </div>
                      </div>

                      {/* Soft Skills */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Users className="w-5 h-5 text-accent" />
                          <p className="text-sm font-['DM_Sans'] font-semibold">Soft Skills ({parsedData.soft_skills?.length || 0})</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(parsedData.soft_skills || []).map((skill: string) => (
                            <SkillPill key={skill} skill={skill} variant="neutral" />
                          ))}
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                          <Briefcase className="w-5 h-5 text-accent mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground font-['DM_Sans']">Experience</p>
                            <p className="font-['DM_Sans'] font-semibold">{parsedData.experience_level}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <GraduationCap className="w-5 h-5 text-accent mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground font-['DM_Sans']">Education</p>
                            <p className="font-['DM_Sans'] font-semibold">{parsedData.education}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Users className="w-5 h-5 text-accent mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground font-['DM_Sans']">Seniority</p>
                            <Badge className="font-['DM_Mono'] bg-accent/10 text-accent">{parsedData.seniority}</Badge>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <FileText className="w-5 h-5 text-accent mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground font-['DM_Sans']">Location</p>
                            <p className="font-['DM_Sans'] font-semibold">{parsedData.location}</p>
                          </div>
                        </div>
                      </div>

                      {/* Save as Job */}
                      <Button onClick={handleSaveJob} disabled={saving || saved}
                        className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-['DM_Sans']">
                        {saved ? <Check className="w-5 h-5 mr-2" /> : saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                        {saved ? "Saved as Job Posting" : saving ? "Saving..." : "Save as Job Posting"}
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
