import { Link } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, Brain, Target, TrendingUp, Shield, FileText, Sparkles } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { ScoreRing } from "../components/ScoreRing";
import { DarkModeToggle } from "../components/DarkModeToggle";

export default function LandingPage() {
  const features = [
    {
      icon: FileText,
      title: "CV Parsing",
      description: "AI-powered resume analysis extracting skills, experience, and insights",
    },
    {
      icon: Target,
      title: "Role Prediction",
      description: "Intelligent career path suggestions based on your profile",
    },
    {
      icon: TrendingUp,
      title: "Gap Analysis",
      description: "Identify skill gaps and get personalized learning recommendations",
    },
    {
      icon: Shield,
      title: "Bias Reduction",
      description: "Fair, anonymous screening for diverse and inclusive hiring",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-lg border-b border-border z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-['Playfair_Display'] font-bold"
          >
            Resum<span className="text-accent">ify</span>
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-6 font-['DM_Sans']"
          >

            {/* Admin Portal Button - Highlighted */}
            <Link to="/admin/login">
              <motion.div
                className="flex items-center gap-2 px-3 py-1.5 rounded-md font-['DM_Mono'] uppercase transition-all duration-200 border"
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.15em",
                  backgroundColor: "rgba(201, 168, 76, 0.15)",
                  borderColor: "#C9A84C",
                  color: "#C9A84C",
                }}
                whileHover={{
                  backgroundColor: "rgba(201, 168, 76, 0.25)",
                  scale: 1.02,
                }}
                whileTap={{
                  scale: 0.98,
                }}
              >
                <Shield size={12} />
                <span>Admin Portal</span>
              </motion.div>
            </Link>
            
            <DarkModeToggle />
            
            <Link to="/recruiter/login">
              <Button variant="outline">Sign In</Button>
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-5xl lg:text-6xl font-['Playfair_Display'] font-bold leading-tight mb-6">
                Hire Smarter,
                <br />
                Apply <span className="text-accent">Better</span>
              </h2>
              <p className="text-xl text-muted-foreground font-['DM_Sans'] mb-8">
                AI-Driven Talent Intelligence & Recruitment Optimization Platform.
                Transform hiring with data driven insights and bias reduced screening.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link to="/recruiter/login">
                  <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-['DM_Sans']">
                    I'm a Candidate <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/recruiter/login">
                  <Button size="lg" variant="outline" className="font-['DM_Sans']">
                    I'm a Recruiter
                  </Button>
                </Link>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-6">
                {[
                  { value: "14+", label: "AI Features" },
                  { value: "2", label: "Modules" },
                  { value: "100%", label: "Bias-Reduced" },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="text-center"
                  >
                    <div className="text-3xl font-['Playfair_Display'] font-bold text-accent">
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground font-['DM_Sans']">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Animated Score Card Mockup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Card className="p-8 bg-card shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <Sparkles className="w-6 h-6 text-accent" />
                  <h3 className="text-xl font-['Playfair_Display'] font-semibold">
                    AI Analysis Preview
                  </h3>
                </div>

                <div className="grid grid-cols-3 gap-6 mb-6">
                  <ScoreRing score={92} size="sm" label="Match %" />
                  <ScoreRing score={87} size="sm" label="Quality Score" />
                  <ScoreRing score={95} size="sm" label="ATS Score" />
                </div>

                <div className="space-y-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ delay: 1, duration: 0.8 }}
                    className="h-2 bg-accent rounded-full"
                  />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "85%" }}
                    transition={{ delay: 1.2, duration: 0.8 }}
                    className="h-2 bg-chart-4 rounded-full"
                  />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "70%" }}
                    transition={{ delay: 1.4, duration: 0.8 }}
                    className="h-2 bg-chart-5 rounded-full"
                  />
                </div>

                <p className="text-sm text-muted-foreground font-['DM_Sans'] mt-6">
                  Instant AI-powered analysis of your resume with actionable insights
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h3 className="text-4xl font-['Playfair_Display'] font-bold mb-4">
              Powered by AI Intelligence
            </h3>
            <p className="text-xl text-muted-foreground font-['DM_Sans']">
              Advanced features designed for both candidates and recruiters
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-6 h-full hover:shadow-lg transition-shadow">
                    <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-accent" />
                    </div>
                    <h4 className="text-lg font-['DM_Sans'] font-semibold mb-2">
                      {feature.title}
                    </h4>
                    <p className="text-sm text-muted-foreground font-['DM_Sans']">
                      {feature.description}
                    </p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-4xl font-['Playfair_Display'] font-bold mb-6">
              Ready to Transform Your Hiring?
            </h3>
            <p className="text-xl text-muted-foreground font-['DM_Sans'] mb-8">
              Join thousands of candidates and recruiters using AI-powered talent intelligence
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/recruiter/login">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-['DM_Sans']">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}