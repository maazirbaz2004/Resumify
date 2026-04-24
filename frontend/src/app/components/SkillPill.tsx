import { motion } from "motion/react";
import { Check, X, Minus } from "lucide-react";

interface SkillPillProps {
  skill: string;
  variant?: "matched" | "missing" | "neutral";
  delay?: number;
}

export function SkillPill({ skill, variant = "neutral", delay = 0 }: SkillPillProps) {
  const variants = {
    matched: "bg-green-100 text-green-800 border-green-300",
    missing: "bg-red-100 text-red-800 border-red-300",
    neutral: "bg-secondary text-foreground border-border",
  };

  const icons = {
    matched: <Check className="w-3 h-3" />,
    missing: <X className="w-3 h-3" />,
    neutral: <Minus className="w-3 h-3 opacity-0" />,
  };

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm border font-['DM_Mono'] ${variants[variant]}`}
    >
      {icons[variant]}
      {skill}
    </motion.span>
  );
}
