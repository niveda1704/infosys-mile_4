import React, { useEffect, useMemo, useState } from "react";
import { RecruiterAnalytics } from "../../components/RoleAnalytics";
import { Link } from "react-router-dom";
import {
  Briefcase,
  Users,
  CheckCircle2,
  Clock,
  PlusCircle,
  TrendingUp,
  ArrowRight,
  Sparkles,
  ChevronRight,
  XCircle,
} from "lucide-react";

import { authService } from "../../services/authService";
import { jobService } from "../../services/jobService";
import { STATUS_COLORS, initials, toUiApplicant } from "../../utils/applicants";

export function RecruiterDashboard() {
  // =========================
  // STATE
  // =========================

  const [profile, setProfile] = useState(null);
  const [recruiterJobs, setRecruiterJobs] = useState([]);
  const [applicants, setApplicants] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // =========================
  // LOAD DASHBOARD DATA
  // =========================

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setIsLoading(true);
    setLoadError("");

    try {
      const [profileResponse, jobsResponse, applicantsResponse] =
        await Promise.all([
          authService.getCurrentUser(),
          jobService.getRecruiterJobs(),
          // Applicants are non-critical: the dashboard still loads if this call fails
          jobService.getApplicants().catch(() => ({ applicants: [] })),
        ]);

      setApplicants((applicantsResponse?.applicants || []).map(toUiApplicant));

      // =========================
      // PROFILE
      // =========================

      const currentUser =
        profileResponse.user ||
        profileResponse;

      setProfile(currentUser);

      localStorage.setItem(
        "swipex_user",
        JSON.stringify(currentUser)
      );

      // =========================
      // JOBS
      // =========================

      const jobs = (jobsResponse.jobs || []).map(
        (job) => ({
          ...job,

          requiredSkills:
            typeof job.skills === "string"
              ? job.skills
                  .split(",")
                  .map((skill) => skill.trim())
                  .filter(Boolean)
              : [],

          employmentType:
            job.employment_type ||
            "Not specified",

          experienceLevel:
            job.experience_level ||
            "Not specified",

          salaryRange:
            job.salary ||
            "Not specified",

          workMode:
            job.work_mode ||
            "Not specified",

          postedDate:
            job.created_at
              ? new Date(
                  job.created_at
                ).toLocaleDateString()
              : "Recently",

          applicantsCount: job.applicant_count ?? job.applicantCount ?? 0,
        })
      );

      setRecruiterJobs(jobs);
    } catch (error) {
      console.error(
        "Failed to load recruiter dashboard:",
        error
      );

      setLoadError(
        error.response?.data?.message ||
          "Failed to load recruiter dashboard."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // =========================
  // PROFILE VALUES
  // =========================

  const recruiterName =
    profile?.name || "Recruiter";

  const companyName =
    profile?.company_name ||
    profile?.companyName ||
    "Your Company";

  // =========================
  // JOB STATISTICS
  // =========================

  const totalJobs = recruiterJobs.length;

  const activeJobs = recruiterJobs.filter(
    (job) =>
      String(job.status).toLowerCase() ===
      "active"
  ).length;

  // Applicant statistics (real data from /jobs/applicants)
  const totalApplicants = applicants.length;

  const pendingReview = applicants.filter(
    (a) => a.status === "Applied" || a.status === "Under Review"
  ).length;

  const shortlistedCount = applicants.filter((a) => a.status === "Shortlisted").length;
  const interviewCount = applicants.filter((a) => a.status === "Interview").length;

  const scored = applicants.filter((a) => a.hasScore);
  const avgAts = scored.length
    ? Math.round(scored.reduce((sum, a) => sum + a.atsScore, 0) / scored.length)
    : null;

  const recentApplicants = applicants.slice(0, 4);

  // =========================
  // RECENT JOBS
  // =========================

  const recentJobs = useMemo(
    () => recruiterJobs.slice(0, 3),
    [recruiterJobs]
  );

  // =========================
  // LOADING
  // =========================

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-12 text-center">
          <div className="w-8 h-8 border-4 border-blue-200 dark:border-blue-500/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />

          <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100">
            Loading recruiter dashboard...
          </h3>

          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Fetching your jobs and recruiter profile.
          </p>
        </div>
      </div>
    );
  }

  // =========================
  // ERROR
  // =========================

  if (loadError) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-rose-200 dark:border-rose-500/20 p-12 text-center">
          <XCircle className="w-12 h-12 text-rose-300 mx-auto mb-3" />

          <h3 className="text-base font-bold text-slate-800 dark:text-zinc-100">
            Unable to load dashboard
          </h3>

          <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
            {loadError}
          </p>

          <button
            type="button"
            onClick={loadDashboard}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // =========================
  // DASHBOARD
  // =========================

  return (
    <div className="space-y-8 animate-in fade-in duration-200">

      {/* =========================
          WELCOME BANNER
      ========================= */}

      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-sm relative overflow-hidden">

        <div className="relative z-10 max-w-2xl">

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold text-blue-100 mb-3 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-blue-200" />

            <span>
              SwipeX Recruiter Command Center
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {recruiterName}
          </h1>

          <p className="text-sm text-blue-100 mt-2 leading-relaxed">
            Manage your open requisitions at{" "}
            <span className="font-bold text-white">
              {companyName}
            </span>
            , review candidates, and build your
            hiring pipeline.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">

            <Link
              to="/recruiter/post-job"
              id="btn-recruiter-banner-post"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-900 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />

              <span>
                Post New Opportunity
              </span>
            </Link>

            <Link
              to="/recruiter/applicants"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold backdrop-blur-md border border-white/20 transition-all"
            >
              <Users className="w-4 h-4" />

              <span>
                Review Candidates
              </span>
            </Link>

          </div>
        </div>

        <div className="absolute -right-12 -bottom-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* =========================
          OVERVIEW METRICS
      ========================= */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">

        {/* Total Jobs */}

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs flex items-center gap-4">

          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Briefcase className="w-6 h-6" />
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
              Total Jobs Posted
            </p>

            <h3 className="text-2xl font-bold text-slate-900 dark:text-zinc-50 mt-0.5">
              {totalJobs}
            </h3>

            <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3" />

              <span>
                Current pipeline
              </span>
            </span>
          </div>
        </div>

        {/* Active Jobs */}

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs flex items-center gap-4">

          <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
              Active Jobs
            </p>

            <h3 className="text-2xl font-bold text-slate-900 dark:text-zinc-50 mt-0.5">
              {activeJobs}
            </h3>

            <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 mt-0.5 block">
              Accepting applications
            </span>
          </div>
        </div>

        {/* Applicants */}

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs flex items-center gap-4">

          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
              Total Applicants
            </p>

            <h3 className="text-2xl font-bold text-slate-900 dark:text-zinc-50 mt-0.5">
              {totalApplicants}
            </h3>

            <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 mt-0.5 block">
              Across all your jobs
            </span>
          </div>
        </div>

        {/* Pending */}

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs flex items-center gap-4">

          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
              Pending Review
            </p>

            <h3 className="text-2xl font-bold text-slate-900 dark:text-zinc-50 mt-0.5">
              {pendingReview}
            </h3>

            <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 mt-0.5 block">
              Applied + under review
            </span>
          </div>
        </div>

      </div>

      {/* =========================
          MAIN GRID
      ========================= */}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* =========================
            RECENT JOBS
        ========================= */}

        <div className="lg:col-span-7 space-y-4">

          <div className="flex items-center justify-between">

            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-50">
                Recent Job Postings
              </h2>

              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Your latest job openings
              </p>
            </div>

            <Link
              to="/recruiter/manage-jobs"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
            >
              <span>
                View all ({recruiterJobs.length})
              </span>

              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

          </div>

          <div className="space-y-3">

            {recentJobs.length === 0 ? (

              <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-slate-200 dark:border-zinc-800 text-center">

                <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />

                <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                  No job postings yet
                </h3>

                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  Post your first opportunity to start
                  building your candidate pipeline.
                </p>

                <Link
                  to="/recruiter/post-job"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                >
                  <PlusCircle className="w-4 h-4" />
                  Post New Job
                </Link>

              </div>

            ) : (

              recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs hover:border-blue-200 dark:hover:border-blue-500/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >

                  <div className="space-y-1 min-w-0">

                    <div className="flex items-center gap-2">

                      <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-50 truncate">
                        {job.title}
                      </h3>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          job.status === "Active"
                            ? "bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-500/20"
                            : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300"
                        }`}
                      >
                        {job.status ||
                          "Unknown"}
                      </span>

                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">

                      <span>
                        {job.location}
                      </span>

                      <span>•</span>

                      <span>
                        {job.employmentType}
                      </span>

                      <span>•</span>

                      <span className="font-semibold text-slate-700 dark:text-zinc-200">
                        {job.salaryRange}
                      </span>

                    </div>

                    <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500 dark:text-zinc-400">

                      <span>
                        Posted {job.postedDate}
                      </span>

                      <span>•</span>

                      <span className="text-blue-600 dark:text-blue-400 font-bold">
                        {job.applicantsCount}{" "}
                        total applicants
                      </span>

                    </div>

                  </div>

                  <div className="flex items-center gap-2 shrink-0">

                    <Link
                      to={`/recruiter/applicants?job=${job.id}`}
                      className="px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/15 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold transition-colors"
                    >
                      View Applicants
                    </Link>

                    <Link
                      to="/recruiter/manage-jobs"
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800"
                      title="Manage Job"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>

                  </div>
                </div>
              ))
            )}

          </div>

          {/* =========================
              HIRING FUNNEL
          ========================= */}

          <div className="bg-slate-50 dark:bg-zinc-950 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-3">

            <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-50 uppercase tracking-wider">
              Talent Pipeline Funnel
            </h4>

            <div className="grid grid-cols-3 gap-3 text-center">

              <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-slate-200 dark:border-zinc-800">
                <p className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
                  {shortlistedCount}
                </p>

                <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 mt-0.5">
                  Shortlisted
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-slate-200 dark:border-zinc-800">
                <p className="text-xl font-extrabold text-purple-600 dark:text-purple-400">
                  {interviewCount}
                </p>

                <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 mt-0.5">
                  Interviews
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-slate-200 dark:border-zinc-800">
                <p className="text-xl font-extrabold text-brand-600 dark:text-brand-400">
                  {avgAts !== null ? `${avgAts}%` : "—"}
                </p>

                <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 mt-0.5">
                  Avg ATS Score
                </p>
              </div>

            </div>
          </div>

        </div>

        {/* =========================
            APPLICANTS
        ========================= */}

        <div className="lg:col-span-5 space-y-4">

          <div className="flex items-center justify-between">

            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-50">
                Recent Applicants
              </h2>

              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Candidate submissions
              </p>
            </div>

            <Link
              to="/recruiter/applicants"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
            >
              <span>
                All candidates
              </span>

              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

          </div>

          {recentApplicants.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-slate-200 dark:border-zinc-800 text-center">

              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />

              <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                No applicants yet
              </h3>

              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
                Candidates appear here as soon as they apply to one of your jobs.
              </p>

              <Link
                to="/recruiter/applicants"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-bold"
              >
                Manage Applicants
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 divide-y divide-slate-100 dark:divide-zinc-800 overflow-hidden">
              {recentApplicants.map((a) => (
                <Link
                  key={a.id}
                  to={`/recruiter/applicants/${a.id}`}
                  className="flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center shrink-0">
                    {initials(a.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-zinc-50 truncate">{a.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                      {a.appliedJobTitle}{a.hasScore ? ` • ${a.atsScore}% match` : ""}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${STATUS_COLORS[a.status] || ""}`}>
                    {a.status}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {/* =========================
              ATS INFO
          ========================= */}

          <div className="bg-blue-50/70 dark:bg-blue-500/10 border border-blue-200/80 dark:border-blue-500/20 rounded-2xl p-4 text-xs text-blue-900 dark:text-blue-300 space-y-1.5">

            <div className="flex items-center gap-1.5 font-bold text-blue-800 dark:text-blue-300">

              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />

              <span>
                Smart SwipeX ATS Matching
              </span>

            </div>

            <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed">
              SwipeX ranks every applicant against the
              job's required skills, so the best matches
              show first.
            </p>

          </div>

        </div>
      </div>

      <RecruiterAnalytics />
    </div>
  );
}

export default RecruiterDashboard;