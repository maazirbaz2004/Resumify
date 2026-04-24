import { motion } from "motion/react";

interface ScoreRingProps {
  score: number;
  size?: "sm" | "md" | "lg";
  label?: string;
  color?: string;
}

export function ScoreRing({ score, size = "md", label, color = "#C9A84C" }: ScoreRingProps) {
  const sizes = {
    sm: { outer: 80, stroke: 6, text: "text-xl" },
    md: { outer: 120, stroke: 8, text: "text-3xl" },
    lg: { outer: 160, stroke: 10, text: "text-4xl" },
  };

  const { outer, stroke, text } = sizes[size];
  const radius = (outer - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: outer, height: outer }}>
        <svg width={outer} height={outer} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={outer / 2}
            cy={outer / 2}
            r={radius}
            fill="none"
            stroke="#E5E3DE"
            strokeWidth={stroke}
          />
          {/* Progress circle */}
          <motion.circle
            cx={outer / 2}
            cy={outer / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        <div
          className={`absolute inset-0 flex items-center justify-center ${text} font-['Playfair_Display']`}
          style={{ fontWeight: 700 }}
        >
          {score}%
        </div>
      </div>
      {label && (
        <p className="text-sm text-muted-foreground font-['DM_Sans']">{label}</p>
      )}
    </div>
  );
}
