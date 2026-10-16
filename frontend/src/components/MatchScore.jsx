import React from "react";
import { Sparkles } from "lucide-react";

export function MatchScore({ score = 85, size = "md", showLabel = true, showIcon = true }) {
  const getColor = (val) => {
    if (val >= 90) return "text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-500/10 border-brand-200 dark:border-brand-500/20";
    if (val >= 80) return "text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-500/10 border-teal-200 dark:border-teal-500/20";
    if (val >= 70) return "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20";
    return "text-slate-700 dark:text-zinc-200 bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-800";
  };

  const getProgressColor = (val) => {
    if (val >= 90) return "bg-brand-500";
    if (val >= 80) return "bg-teal-500";
    if (val >= 70) return "bg-amber-500";
    return "bg-slate-400";
  };

  if (size === "sm") {
    return (
      <div
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border ${getColor(
          score
        )}`}
      >
        {showIcon && <Sparkles className="w-3 h-3" />}
        <span>{score}% Match</span>
      </div>
    );
  }

  if (size === "pill") {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getColor(
          score
        )}`}
      >
        {showIcon && <Sparkles className="w-3.5 h-3.5" />}
        <span>{score}% Match</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${getColor(
          score
        )}`}
      >
        {showIcon && <Sparkles className="w-3.5 h-3.5" />}
        <span>{score}%</span>
        {showLabel && <span className="font-normal opacity-90">Match</span>}
      </div>
      <div className="hidden sm:flex flex-col gap-1 w-20">
        <div className="h-1.5 w-full bg-slate-200 dark:bg-zinc-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getProgressColor(score)}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default MatchScore;
