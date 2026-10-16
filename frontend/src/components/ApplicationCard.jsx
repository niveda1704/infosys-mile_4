import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building,
  MapPin,
  IndianRupee,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  MessageSquare
} from "lucide-react";
import { MatchScore } from "./MatchScore";
import { trackingService, timeAgo } from "../services/notificationService";

export function ApplicationCard({ application }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [history, setHistory] = useState(null);

  useEffect(() => {
    if (!isExpanded || history || !application?.id) return;
    trackingService
      .history(application.id)
      .then((d) => setHistory(d))
      .catch(() => setHistory({ history: [] }));
  }, [isExpanded, history, application?.id]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "Shortlisted":
        return "bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-500/20";
      case "Interview":
        return "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/20";
      case "Offered":
        return "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/20";
      case "Hired":
        return "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20";
      case "Under Review":
        return "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/20";
      case "Rejected":
        return "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/20";
      case "Applied":
      default:
        return "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/20";
    }
  };

  return (
    <div
      className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs hover:shadow-md transition-all overflow-hidden"
      id={`application-card-${application.id}`}
    >
      <div className="p-5 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          {/* Company & Title */}
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-800 p-1 flex items-center justify-center overflow-hidden shrink-0">
              {application.logo ? (
                <img
                  src={application.logo}
                  alt={typeof application.company === "object" ? application.company?.name : application.company}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <Building className="w-6 h-6 text-slate-400" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-brand-700 dark:text-brand-300 uppercase tracking-wider">
                  {typeof application.company === "object" ? (application.company?.name || "Company") : (application.company || "Company")}
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-zinc-600" />
                <span className="text-xs text-slate-500 dark:text-zinc-400">
                  {application.appliedDate
                    ? `Applied on ${application.appliedDate}`
                    : application.applied_at || application.created_at
                    ? `Applied on ${new Date(application.applied_at || application.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                    : "Recently applied"}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-50 mt-0.5">
                {application.title || "Job Opportunity"}
              </h3>

              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500 dark:text-zinc-400 font-medium">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {application.location}
                </span>
                <span className="flex items-center gap-1 font-semibold text-brand-700 dark:text-brand-300">
                  <IndianRupee className="w-3.5 h-3.5" />
                  <span>{application.salary}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Status & Match Score */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2.5">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border tracking-wide uppercase ${getStatusBadge(
                application.status
              )}`}
            >
              {application.status}
            </span>
            <MatchScore score={application.matchPercentage} size="sm" showIcon={false} />
          </div>
        </div>

        {/* Notes preview if present */}
        {application.notes && (
          <div className="mt-4 p-3 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800 flex items-start gap-2 text-xs text-slate-600 dark:text-zinc-300">
            <MessageSquare className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
            <p className="line-clamp-2">
              <strong className="text-slate-800 dark:text-zinc-100">Note: </strong>
              {application.notes}
            </p>
          </div>
        )}

        {/* Timeline breakdown drawer */}
        {isExpanded && (
          <div className="mt-5 pt-5 border-t border-slate-100 dark:border-zinc-800 space-y-3 animate-in fade-in duration-200">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Application Milestones
            </p>
            <div className="relative pl-6 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-zinc-700">
              {history?.history?.length > 0 ? history.history.map((ev, idx, arr) => (
                <div key={ev.id ?? idx} className="relative text-xs">
                  <div className="absolute -left-6 w-4 h-4 rounded-full border-2 bg-brand-600 border-brand-600 text-white flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-zinc-100">{ev.to_status}</span>
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400">{timeAgo(ev.created_at)}</span>
                  </div>
                  {ev.note && <p className="mt-0.5 text-[11px] text-slate-500 dark:text-zinc-400">"{ev.note}"</p>}
                  {idx === arr.length - 1 && history.applied_early && (
                    <p className="mt-0.5 text-[11px] font-semibold text-brand-600 dark:text-brand-400">You were an early applicant</p>
                  )}
                </div>
              )) : application.timeline?.map((step, idx) => (
                <div key={idx} className="relative flex items-center justify-between text-xs">
                  <div
                    className={`absolute -left-6 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      step.done
                        ? "bg-brand-600 border-brand-600 text-white"
                        : "bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-700 text-transparent"
                    }`}
                  >
                    {step.done && <CheckCircle2 className="w-3 h-3" />}
                  </div>
                  <span
                    className={`font-semibold ${
                      step.done ? "text-slate-800 dark:text-zinc-100" : "text-slate-400"
                    }`}
                  >
                    {step.step}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400">{step.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Bar */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 font-semibold text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-zinc-50 transition-colors"
          >
            <span>{isExpanded ? "Hide Status Timeline" : "View Application Timeline"}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <Link
            to={`/jobs/${application.jobId}`}
            className="flex items-center gap-1 font-bold text-brand-700 dark:text-brand-300 hover:text-brand-800 dark:hover:text-brand-300 transition-colors"
          >
            <span>View Job Posting</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ApplicationCard;
