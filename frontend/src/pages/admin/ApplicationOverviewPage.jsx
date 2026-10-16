import React, { useState } from "react";
import {
  FileSpreadsheet,
  Search,
  Download,
  Filter,
  Users,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Sparkles
} from "lucide-react";
import { useApp } from "../../context/AppContext";

export function ApplicationOverviewPage() {
  const { adminApplications, adminLoading, adminError, addToast } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredApplications = adminApplications.filter((app) => {
    const matchesSearch =
      (app.candidateName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.jobTitle || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.company || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || app.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const handleExportCSV = () => {
    // Export the rows currently shown
    const headers = "ID,Candidate,Position,Company,AppliedDate,Status\n";
    const rows = filteredApplications
      .map(
        (a) =>
          `"${a.id}","${a.candidateName}","${a.jobTitle}","${a.company}","${a.appliedDate}","${a.status}"`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `SwipeX_Applications_Export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast("Exported applications to CSV report", "success");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Ecosystem Application Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Audit candidate submissions, interview conversion rates, and ATS screening performance.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-zinc-900/90 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 dark:text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search candidate, job, company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-slate-800/80 dark:bg-zinc-700/80 border border-slate-700/80 rounded-xl text-xs font-medium text-white placeholder:text-slate-500 dark:placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {["All", "Applied", "Under Review", "Shortlisted", "Interview", "Offered", "Hired", "Rejected"].map((st) => (
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

      {/* Applications Table */}
      <div className="bg-white dark:bg-zinc-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-zinc-950/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Candidate</th>
                <th className="py-3.5 px-4">Role & Company</th>
                <th className="py-3.5 px-4">Applied Date</th>
                <th className="py-3.5 px-4">Recruiter</th>
                <th className="py-3.5 px-4 sm:px-6">Application Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {filteredApplications.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="py-4 px-4 sm:px-6">
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{app.candidateName}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">ID: {app.id}</p>
                  </td>

                  <td className="py-4 px-4">
                    <p className="text-slate-700 dark:text-slate-200 font-semibold">{app.jobTitle}</p>
                    <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">{typeof app.company === "object" ? (app.company?.name || "Company") : (app.company || "Company")}</p>
                  </td>

                  <td className="py-4 px-4 text-slate-500 dark:text-slate-400 font-medium">
                    {app.appliedDate}
                  </td>

                  <td className="py-4 px-4 text-slate-600 dark:text-slate-300 font-medium">{app.recruiterName}</td>

                  <td className="py-4 px-4 sm:px-6">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        app.status === "Shortlisted"
                          ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                          : app.status === "Interview"
                          ? "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                          : app.status === "Offered" || app.status === "Hired"
                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                          : app.status === "Under Review"
                          ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                          : app.status === "Applied"
                          ? "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                          : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                      }`}
                    >
                      <span>{app.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {adminError && <p className="p-6 text-xs text-rose-600 dark:text-rose-400">{adminError}</p>}
          {!adminError && filteredApplications.length === 0 && (
            <p className="p-6 text-xs text-slate-500 dark:text-slate-400 text-center">
              {adminLoading ? "Loading applications..." : "No applications match this filter."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ApplicationOverviewPage;
