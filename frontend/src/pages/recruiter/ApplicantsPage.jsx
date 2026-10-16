import React, { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  Filter,
  Users,
  Eye,
  FileText,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Sparkles,
  ArrowRight,
  ChevronDown
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { jobService } from "../../services/jobService";
import { STAGES, STATUS_COLORS, initials, toUiApplicant } from "../../utils/applicants";

export function ApplicantsPage() {
  const { addToast } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const jobFilter = searchParams.get("job"); // set by the "N Applicants" links on the jobs pages

  const [applicants, setApplicants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const loadApplicants = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await jobService.getApplicants();
      setApplicants((res.applicants || []).map(toUiApplicant));
    } catch (err) {
      setLoadError(err?.response?.data?.message || "Unable to load applicants.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApplicants();
  }, [loadApplicants]);

  // Persists the stage and notifies the candidate (done by the backend).
  const updateApplicantStatus = async (id, status) => {
    const previous = applicants;
    setApplicants((list) => list.map((a) => (a.id === id ? { ...a, status } : a)));
    try {
      await jobService.updateApplicationStatus(id, status);
      addToast(`Moved to ${status}. The candidate was notified.`, "success");
    } catch (err) {
      setApplicants(previous);
      addToast(err?.response?.data?.message || "Could not update the application.", "error");
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const statusColors = STATUS_COLORS;

  const filteredApplicants = applicants.filter((app) => {
    const matchesSearch =
      (app.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.appliedJobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.skills?.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "All" || app.status.toLowerCase() === statusFilter.toLowerCase();

    const matchesJob = !jobFilter || String(app.jobId) === String(jobFilter);

    return matchesSearch && matchesStatus && matchesJob;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight">
            Candidate Pipeline
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Review ATS-matched candidates, filter by stage, and advance qualified profiles to interviews.
          </p>
        </div>
      </div>

      {jobFilter && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl text-xs text-blue-800 dark:text-blue-300">
          <span>
            Showing applicants for one job only
            {applicants.find((a) => String(a.jobId) === String(jobFilter))
              ? `: ${applicants.find((a) => String(a.jobId) === String(jobFilter)).appliedJobTitle}`
              : ""}
          </span>
          <button type="button" onClick={() => setSearchParams({})} className="font-bold underline">
            Show all jobs
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search candidate name, role, skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {["All", ...STAGES].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Applicants List */}
      {isLoading ? (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-12 text-center text-xs text-slate-500">
          Loading applicants...
        </div>
      ) : loadError ? (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-rose-200 dark:border-rose-500/20 p-12 text-center">
          <p className="text-xs text-rose-600 mb-3">{loadError}</p>
          <button type="button" onClick={loadApplicants} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">
            Retry
          </button>
        </div>
      ) : filteredApplicants.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-zinc-100">No applicants found</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or switching to the "All" status filter.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredApplicants.map((app) => (
            <div
              key={app.id}
              className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs hover:border-blue-200 dark:hover:border-blue-500/20 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              {/* Candidate Info */}
              <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                <div
                  aria-hidden="true"
                  className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-slate-200 dark:border-zinc-800 shrink-0 mt-0.5 sm:mt-0 flex items-center justify-center text-sm font-extrabold"
                >
                  {initials(app.name)}
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/recruiter/applicants/${app.id}`}
                      className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-50 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {app.name}
                    </Link>

                    {/* ATS Score Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        app.atsScore >= 85
                          ? "bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-500/20"
                          : app.atsScore >= 70
                          ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/20"
                          : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20"
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{app.hasScore ? `${app.atsScore}% AI Match` : "Match pending"}</span>
                    </span>

                    {/* Status Badge */}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        statusColors[app.status] || "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200"
                      }`}
                    >
                      {app.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-zinc-300 font-medium truncate">
                    Applying for: <span className="font-bold text-slate-900 dark:text-zinc-50">{app.appliedJobTitle}</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-zinc-400 pt-0.5">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span>{app.email}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{app.phone}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>Applied {app.appliedDate}</span>
                    </span>
                  </div>

                  {/* Skills preview */}
                  <div className="flex flex-wrap gap-1 pt-1.5">
                    {app.skills?.slice(0, 5).map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded-md text-[10px] font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                    {app.skills?.length > 5 && (
                      <span className="px-1.5 py-0.5 text-slate-400 text-[10px]">
                        +{app.skills.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Selector & Review Action */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-zinc-800 lg:pl-6">
                <div className="relative">
                  <label className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase">
                    Stage
                  </label>
                  <select
                    value={app.status}
                    onChange={(e) => updateApplicantStatus(app.id, e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-semibold focus:bg-white dark:focus:bg-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {STAGES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-3.5 sm:pt-4">
                  <Link
                    to={`/recruiter/applicants/${app.id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 whitespace-nowrap"
                  >
                    <span>View Dossier</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ApplicantsPage;
