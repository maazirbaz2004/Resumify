import { Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useDarkMode } from "../contexts/DarkModeContext";

export function DarkModeToggle() {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  return (
    <motion.button
      onClick={toggleDarkMode}
      className="relative w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200"
      initial={false}
      animate={{
        backgroundColor: isDarkMode ? "rgba(42, 42, 42, 0)" : "rgba(229, 224, 216, 0)",
      }}
      whileHover={{
        backgroundColor: isDarkMode ? "rgba(42, 42, 42, 1)" : "rgba(229, 224, 216, 1)",
      }}
      whileTap={{ scale: 0.95 }}
      aria-label="Toggle dark mode"
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDarkMode ? (
          <motion.div
            key="moon"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <Moon
              size={18}
              style={{
                color: "#6b7280",
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <Sun
              size={18}
              style={{
                color: "#6b7280",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}