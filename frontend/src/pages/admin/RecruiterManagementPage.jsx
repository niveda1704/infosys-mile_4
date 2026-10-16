import React, { useState } from "react";
import {
  Building2,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Briefcase,
  Mail,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Power
} from "lucide-react";
import { useApp } from "../../context/AppContext";

export function RecruiterManagementPage() {
  const { adminRecruiters, adminLoading, adminError, updateRecruiterOrgStatus } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredRecruiters = adminRecruiters.filter((rec) => {
    const matchesSearch =
      rec.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.recruiterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || rec.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Employer Organizations & Recruiters
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Audit employer credentials, approve corporate accounts, and govern job posting rights.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-zinc-900/90 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 dark:text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search company or recruiter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-slate-800/80 dark:bg-zinc-700/80 border border-slate-700/80 rounded-xl text-xs font-medium text-white placeholder:text-slate-500 dark:placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {["All", "Approved", "Pending", "Suspended"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-zinc-700"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Recruiter Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredRecruiters.map((rec) => (
          <div
            key={rec.id}
            className="bg-white dark:bg-zinc-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 hover:border-slate-200 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            {/* Header */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-600/30 text-purple-700 dark:text-purple-200 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-base font-bold shrink-0">
                    {(rec.companyName || "?").trim().charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{rec.companyName}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{rec.recruiterName}</p>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                    rec.status === "Approved"
                      ? "bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-800"
                      : rec.status === "Pending"
                      ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                      : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                  }`}
                >
                  {rec.status}
                </span>
              </div>

              {/* Meta details */}
              <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 pt-1">
                <p className="flex items-center gap-2 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400 shrink-0" />
                  <span>{rec.email}</span>
                </p>
                <p className="flex items-center gap-2 truncate">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400 shrink-0" />
                  <span>{rec.location}</span>
                </p>
                <p className="flex items-center gap-2 truncate">
                  <Briefcase className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400 shrink-0" />
                  <span className="text-slate-900 dark:text-white font-semibold">{rec.jobsPosted} Job Postings</span>
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2">
              {rec.status !== "Approved" && (
                <button
                  type="button"
                  onClick={() => updateRecruiterOrgStatus(rec.id, "Approved")}
                  className="flex-1 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve</span>
                </button>
              )}

              {rec.status === "Approved" && (
                <button
                  type="button"
                  onClick={() => updateRecruiterOrgStatus(rec.id, "Suspended")}
                  className="flex-1 py-1.5 bg-slate-800 dark:bg-zinc-700 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>Suspend</span>
                </button>
              )}

              {rec.status === "Suspended" && (
                <button
                  type="button"
                  onClick={() => updateRecruiterOrgStatus(rec.id, "Approved")}
                  className="flex-1 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Reactivate</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {adminError && <p className="text-xs text-rose-600 dark:text-rose-400">{adminError}</p>}
      {!adminError && filteredRecruiters.length === 0 && (
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-8">
          {adminLoading ? "Loading recruiters..." : "No recruiters match this filter."}
        </p>
      )}
    </div>
  );
}

export default RecruiterManagementPage;
