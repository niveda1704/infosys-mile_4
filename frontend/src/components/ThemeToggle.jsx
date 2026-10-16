import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label={label}
      title={label}
      className={`relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white ${className}`}
    >
      <Sun
        className={`absolute h-4 w-4 sm:h-5 sm:w-5 transition-all duration-300 ${
          isDark ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-0 opacity-0"
        }`}
      />
      <Moon
        className={`absolute h-4 w-4 sm:h-5 sm:w-5 transition-all duration-300 ${
          isDark ? "-rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
        }`}
      />
    </button>
  );
}

export default ThemeToggle;
