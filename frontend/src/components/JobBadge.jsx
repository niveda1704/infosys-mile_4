import React from "react";

export function JobBadge({ type, text, size = "md", icon: Icon }) {
  const sizeClasses = size === "sm" ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-xs font-semibold";

  const getStyle = () => {
    switch (type) {
      case "match":
        return "bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-500/20";
      case "remote":
        return "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/20";
      case "fresher":
        return "bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-500/20";
      case "low-competition":
        return "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20";
      case "fulltime":
        return "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800";
      case "internship":
        return "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/20";
      case "mnc":
        return "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20";
      case "startup":
        return "bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-500/20";
      case "newly-founded":
        return "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/20";
      default:
        return "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800";
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${sizeClasses} ${getStyle()}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5 opacity-85" />}
      <span>{text}</span>
    </span>
  );
}

export default JobBadge;
