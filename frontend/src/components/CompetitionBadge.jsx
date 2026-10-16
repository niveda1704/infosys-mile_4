import React from "react";
import { Users, Zap } from "lucide-react";

const STYLES = {
  Low: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30",
  Medium: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30",
  High: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30",
};

/** Competition level + applicant count + early-applicant hint, from the job payload. */
export function CompetitionBadge({ job, showCount = true, className = "" }) {
  const level = job?.competition_level || job?.competition;
  if (!level) return null;
  const count = job?.applicant_count ?? job?.applicantCount ?? 0;
  return (
    <span className={`inline-flex items-center gap-1.5 flex-wrap ${className}`}>
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${STYLES[level] || STYLES.Low}`}
        title="Based on how many people applied and how fast">
        {level} competition
      </span>
      {showCount && (
        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-zinc-400">
          <Users className="w-3.5 h-3.5" />
          {count} {count === 1 ? "applicant" : "applicants"}
        </span>
      )}
      {job?.early_window_open && !job?.applied && (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 dark:text-brand-400">
          <Zap className="w-3.5 h-3.5" /> Be an early applicant
        </span>
      )}
      {job?.applied_early && (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 dark:text-brand-400">
          <Zap className="w-3.5 h-3.5" /> You applied early
        </span>
      )}
    </span>
  );
}
