import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Upload, FileText, Loader2, Check, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { DarkModeToggle } from "../components/DarkModeToggle";
import { useAuth } from "../context/AuthContext";
import { candidate as candidateApi } from "../services/api";

export default function CandidateOnboarding() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const steps = [
    "Uploading Resume",
    "Extracting Skills",
    "Predicting Roles",
    "Scoring Quality",
    "Generating Insights",
  ];

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    navigate("/recruiter/login");
    return null;
  }

  const processFile = async (file: File) => {
    setSelectedFile(file);
    setIsUploading(true);
    setError("");
    setCurrentStep(0);

    try {
      // Simulate step progression while waiting for API
      const stepInterval = setInterval(() => {
        setCurrentStep((prev) => Math.min(prev + 1, steps.length - 2));
      }, 1200);

      const result = await candidateApi.uploadResume(file);

      clearInterval(stepInterval);
      setCurrentStep(steps.length - 1);

      // Brief delay to show completion, then navigate
      setTimeout(() => {
        navigate("/candidate/dashboard");
      }, 1000);
    } catch (err: any) {
      setIsUploading(false);
      setError(err.message || "Upload failed. Please try again.");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative">
      <div className="absolute top-8 right-8 z-50">
        <DarkModeToggle />
      </div>

      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-['Playfair_Display'] font-bold mb-2">
            Welcome to Resum<span className="text-accent">ify</span>
            {user && <span className="text-2xl text-muted-foreground">, {user.full_name.split(" ")[0]}</span>}
          </h1>
          <p className="text-lg text-muted-foreground font-['DM_Sans']">
            Upload your resume to get started with AI-powered career insights
          </p>
        </motion.div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc"
          onChange={handleFileSelect}
          className="hidden"
        />

        <AnimatePresence mode="wait">
          {!isUploading ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card
                className={`p-12 border-2 border-dashed transition-all cursor-pointer ${
                  isDragging
                    ? "border-accent bg-accent/5"
                    : "border-border hover:border-accent/50"
                }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center text-center">
                  <motion.div
                    animate={{ y: isDragging ? -10 : 0 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-6"
                  >
                    <Upload className="w-10 h-10 text-accent" />
                  </motion.div>

                  <h3 className="text-2xl font-['Playfair_Display'] font-semibold mb-2">
                    Drop your CV here
                  </h3>
                  <p className="text-muted-foreground font-['DM_Sans'] mb-6">
                    or click to browse • PDF or DOCX • Max 5MB
                  </p>

                  {error && (
                    <div className="flex items-center gap-2 text-red-500 mb-4">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-['DM_Sans']">{error}</span>
                    </div>
                  )}

                  <Button className="bg-accent text-accent-foreground hover:bg-accent/90 font-['DM_Sans']">
                    <FileText className="mr-2 w-5 h-5" />
                    Select File
                  </Button>
                </div>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="p-12">
                <div className="flex flex-col items-center text-center">
                  <div className="relative w-24 h-24 mb-8">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 border-4 border-accent/20 border-t-accent rounded-full"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FileText className="w-10 h-10 text-accent" />
                    </div>
                  </div>

                  <h3 className="text-2xl font-['Playfair_Display'] font-semibold mb-2">
                    AI is analyzing your resume...
                  </h3>
                  <p className="text-muted-foreground font-['DM_Sans'] mb-2">
                    {selectedFile?.name}
                  </p>
                  <p className="text-muted-foreground font-['DM_Sans'] mb-8">
                    This will only take a moment
                  </p>

                  <div className="w-full space-y-4">
                    {steps.map((step, index) => (
                      <motion.div
                        key={step}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.3 }}
                        className="flex items-center gap-4"
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                            index <= currentStep
                              ? "bg-accent text-accent-foreground"
                              : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {index < currentStep ? (
                            <Check className="w-5 h-5" />
                          ) : index === currentStep ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <span className="font-['DM_Mono'] text-sm">{index + 1}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className={`font-['DM_Sans'] ${
                            index <= currentStep ? "text-foreground font-medium" : "text-muted-foreground"
                          }`}>
                            {step}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="w-full mt-8">
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-accent"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}