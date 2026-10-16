import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  Briefcase,
  CheckCircle2,
  Clock,
  UserCheck,
  XCircle,
  Search,
  ArrowRight,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import { jobService } from "../services/jobService";
import { ApplicationCard } from "../components/ApplicationCard";


// ============================================================
// HELPERS
// ============================================================

const normalizeApplication = (application) => {
  if (!application) {
    return null;
  }

  const rawDate =
    application.applied_at ||
    application.appliedAt ||
    application.appliedDate ||
    application.created_at ||
    application.createdAt;

  let formattedDate = "";
  if (rawDate) {
    try {
      formattedDate = new Date(rawDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      formattedDate = String(rawDate);
    }
  }

  const job = application.job || {};
  const companyName =
    typeof application.company === "object" && application.company !== null
      ? application.company.name || "Tech Corp"
      : application.company ||
        application.company_name ||
        application.companyName ||
        (typeof job.company === "object" ? job.company?.name : job.company) ||
        "Tech Corp";

  const title =
    application.title ||
    application.job_title ||
    application.jobTitle ||
    job.title ||
    "Software Engineer";

  const location =
    application.location ||
    job.location ||
    "Remote / Onsite";

  const salary =
    application.salary ||
    job.salary ||
    "Competitive";

  return {
    ...application,

    // Backend
    job_id:
      application.job_id ??
      application.jobId ??
      null,

    // Compatibility with existing ApplicationCard
    jobId:
      application.jobId ??
      application.job_id ??
      null,

    title,
    company: companyName,
    location,
    salary,
    appliedDate: formattedDate || "Recently",

    skills: Array.isArray(application.skills) && application.skills.length > 0
      ? application.skills
      : Array.isArray(job.skills) && job.skills.length > 0
      ? job.skills
      : ["React", "Node.js", "Python"],

    status:
      application.status ||
      "Applied",

    applied_at: rawDate,
    appliedAt: rawDate,
  };
};


const normalizeStatus = (status) => {
  return String(
    status || "Applied"
  )
    .trim()
    .toLowerCase();
};


// ============================================================
// PAGE
// ============================================================

export function ApplicationsPage() {

  // ==========================================================
  // STATE
  // ==========================================================

  const [
    applications,
    setApplications,
  ] = useState([]);

  const [
    selectedStatus,
    setSelectedStatus,
  ] = useState("All");

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isRefreshing,
    setIsRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState(null);


  // ==========================================================
  // LOAD APPLICATIONS
  // ==========================================================

  const loadApplications = useCallback(
    async (showLoader = true) => {

      if (showLoader) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      setError(null);

      try {

        const response =
          await jobService.getApplications();

        const backendApplications =
          response?.applications ||
          response?.items ||
          (Array.isArray(response) ? response : []);

        const normalizedApplications =
          Array.isArray(
            backendApplications
          )
            ? backendApplications
                .map(
                  normalizeApplication
                )
                .filter(Boolean)
            : [];

        setApplications(
          normalizedApplications
        );

      } catch (err) {

        console.error(
          "Failed to load applications:",
          err
        );

        setError(
          err?.response?.data?.message ||
            "Unable to load your applications. Please try again."
        );

        setApplications([]);

      } finally {

        setIsLoading(false);
        setIsRefreshing(false);

      }
    },
    []
  );


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    loadApplications(true);
  }, [loadApplications]);


  // ==========================================================
  // STATISTICS
  // ==========================================================

  const stats = useMemo(() => {

    const getCount = (
      status
    ) =>
      applications.filter(
        (application) =>
          normalizeStatus(
            application.status
          ) ===
          normalizeStatus(
            status
          )
      ).length;

    return {
      total:
        applications.length,

      applied:
        getCount("Applied"),

      shortlisted:
        getCount(
          "Shortlisted"
        ),

      interview:
        getCount(
          "Interview"
        ),

      rejected:
        getCount("Rejected"),
    };

  }, [applications]);


  // ==========================================================
  // FILTER APPLICATIONS
  // ==========================================================

  const filteredApplications =
    useMemo(() => {

      const query =
        searchQuery
          .toLowerCase()
          .trim();

      return applications.filter(
        (application) => {

          // ----------------------------------------------
          // STATUS
          // ----------------------------------------------

          const matchesStatus =
            selectedStatus ===
              "All" ||
            normalizeStatus(
              application.status
            ) ===
              normalizeStatus(
                selectedStatus
              );


          // ----------------------------------------------
          // SEARCH
          // ----------------------------------------------

          const title =
            String(
              application.title ||
                ""
            ).toLowerCase();

          const company =
            String(
              application.company ||
                ""
            ).toLowerCase();

          const location =
            String(
              application.location ||
                ""
            ).toLowerCase();

          const matchesQuery =
            !query ||
            title.includes(query) ||
            company.includes(query) ||
            location.includes(query);


          return (
            matchesStatus &&
            matchesQuery
          );
        }
      );

    }, [
      applications,
      selectedStatus,
      searchQuery,
    ]);


  // ==========================================================
  // STATUS CARD HANDLER
  // ==========================================================

  const toggleStatus = (
    status
  ) => {

    setSelectedStatus(
      selectedStatus ===
        status
        ? "All"
        : status
    );

  };


  // ==========================================================
  // LOADING
  // ==========================================================

  if (isLoading) {

    return (
      <div className="min-h-[calc(100dvh-4rem)] bg-slate-50/60 dark:bg-zinc-950/60">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Header Skeleton */}

          <div className="mb-8 space-y-3">

            <div className="h-8 w-64 bg-slate-200 dark:bg-zinc-700 rounded-xl animate-pulse" />

            <div className="h-4 w-96 max-w-full bg-slate-200 dark:bg-zinc-700 rounded-lg animate-pulse" />

          </div>


          {/* Stats Skeleton */}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">

            {[1, 2, 3, 4].map(
              (item) => (

                <div
                  key={item}
                  className="h-32 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl animate-pulse"
                />

              )
            )}

          </div>


          {/* Search Skeleton */}

          <div className="h-11 w-full sm:w-96 bg-slate-200 dark:bg-zinc-700 rounded-xl mb-6 animate-pulse" />


          {/* Application Skeleton */}

          <div className="space-y-4">

            {[1, 2, 3].map(
              (item) => (

                <div
                  key={item}
                  className="h-36 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl animate-pulse"
                />

              )
            )}

          </div>

        </div>

      </div>
    );
  }


  // ==========================================================
  // ERROR STATE
  // ==========================================================

  if (
    error &&
    applications.length === 0
  ) {

    return (
      <div className="min-h-[calc(100dvh-4rem)] bg-slate-50/60 dark:bg-zinc-950/60 flex items-center justify-center px-4">

        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-rose-100 dark:border-rose-500/20 shadow-sm p-8 text-center max-w-md w-full">

          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">

            <AlertCircle className="w-7 h-7" />

          </div>


          <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-50">

            Unable to load applications

          </h2>


          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2 mb-6 leading-relaxed">

            {error}

          </p>


          <button
            type="button"
            onClick={() =>
              loadApplications(true)
            }
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-all active:scale-95"
          >

            <RefreshCw className="w-4 h-4" />

            Retry

          </button>

        </div>

      </div>
    );
  }


  // ==========================================================
  // MAIN UI
  // ==========================================================

  return (

    <div className="min-h-[calc(100dvh-4rem)] bg-slate-50/60 dark:bg-zinc-950/60">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-200">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">

          <div>

            <div className="flex items-center gap-2 mb-1">

              <div className="p-2 bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 rounded-xl">

                <Briefcase className="w-5 h-5" />

              </div>


              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight">

                Job Applications

              </h1>

            </div>


            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">

              Track your applications, recruiter responses, interviews, and hiring progress in one place.

            </p>

          </div>


          {/* Refresh */}

          <button
            type="button"
            onClick={() =>
              loadApplications(
                false
              )
            }
            disabled={
              isRefreshing
            }
            className="self-start flex items-center justify-center gap-2 px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-brand-200 dark:hover:border-brand-500/20 hover:text-brand-700 dark:hover:text-brand-300 text-slate-600 dark:text-zinc-300 text-xs font-semibold rounded-xl transition-all disabled:opacity-50"
          >

            <RefreshCw
              className={`w-4 h-4 ${
                isRefreshing
                  ? "animate-spin"
                  : ""
              }`}
            />

            Refresh

          </button>

        </div>


        {/* ====================================================
            STATS
        ==================================================== */}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">

          {/* APPLIED */}

          <button
            type="button"
            onClick={() =>
              toggleStatus(
                "Applied"
              )
            }
            className={`p-5 rounded-2xl border text-left transition-all ${
              selectedStatus ===
              "Applied"
                ? "bg-slate-900 dark:bg-zinc-800 text-white border-slate-900 shadow-md"
                : "bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-50 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 shadow-2xs"
            }`}
          >

            <div className="flex items-center justify-between mb-2">

              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  selectedStatus ===
                  "Applied"
                    ? "text-slate-300"
                    : "text-slate-400"
                }`}
              >
                Applied
              </span>


              <Clock
                className={`w-4 h-4 ${
                  selectedStatus ===
                  "Applied"
                    ? "text-brand-400"
                    : "text-blue-600 dark:text-blue-400"
                }`}
              />

            </div>


            <p className="text-2xl sm:text-3xl font-extrabold">

              {stats.applied}

            </p>


            <p
              className={`text-[11px] mt-1 ${
                selectedStatus ===
                "Applied"
                  ? "text-slate-300"
                  : "text-slate-500 dark:text-zinc-400"
              }`}
            >
              In initial review
            </p>

          </button>


          {/* SHORTLISTED */}

          <button
            type="button"
            onClick={() =>
              toggleStatus(
                "Shortlisted"
              )
            }
            className={`p-5 rounded-2xl border text-left transition-all ${
              selectedStatus ===
              "Shortlisted"
                ? "bg-brand-700 text-white border-brand-700 shadow-md"
                : "bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-50 border-slate-200 dark:border-zinc-800 hover:border-brand-200 dark:hover:border-brand-500/20 shadow-2xs"
            }`}
          >

            <div className="flex items-center justify-between mb-2">

              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  selectedStatus ===
                  "Shortlisted"
                    ? "text-brand-100"
                    : "text-slate-400"
                }`}
              >
                Shortlisted
              </span>


              <CheckCircle2
                className={`w-4 h-4 ${
                  selectedStatus ===
                  "Shortlisted"
                    ? "text-brand-200"
                    : "text-brand-600 dark:text-brand-400"
                }`}
              />

            </div>


            <p className="text-2xl sm:text-3xl font-extrabold">

              {stats.shortlisted}

            </p>


            <p
              className={`text-[11px] mt-1 ${
                selectedStatus ===
                "Shortlisted"
                  ? "text-brand-100"
                  : "text-slate-500 dark:text-zinc-400"
              }`}
            >
              Profile accepted
            </p>

          </button>


          {/* INTERVIEW */}

          <button
            type="button"
            onClick={() =>
              toggleStatus(
                "Interview"
              )
            }
            className={`p-5 rounded-2xl border text-left transition-all ${
              selectedStatus ===
              "Interview"
                ? "bg-purple-700 text-white border-purple-700 shadow-md"
                : "bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-50 border-slate-200 dark:border-zinc-800 hover:border-purple-200 dark:hover:border-purple-500/20 shadow-2xs"
            }`}
          >

            <div className="flex items-center justify-between mb-2">

              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  selectedStatus ===
                  "Interview"
                    ? "text-purple-100"
                    : "text-slate-400"
                }`}
              >
                Interview
              </span>


              <UserCheck
                className={`w-4 h-4 ${
                  selectedStatus ===
                  "Interview"
                    ? "text-purple-200"
                    : "text-purple-600 dark:text-purple-400"
                }`}
              />

            </div>


            <p className="text-2xl sm:text-3xl font-extrabold">

              {stats.interview}

            </p>


            <p
              className={`text-[11px] mt-1 ${
                selectedStatus ===
                "Interview"
                  ? "text-purple-100"
                  : "text-slate-500 dark:text-zinc-400"
              }`}
            >
              Active rounds
            </p>

          </button>


          {/* REJECTED */}

          <button
            type="button"
            onClick={() =>
              toggleStatus(
                "Rejected"
              )
            }
            className={`p-5 rounded-2xl border text-left transition-all ${
              selectedStatus ===
              "Rejected"
                ? "bg-slate-800 dark:bg-zinc-700 text-white border-slate-800 shadow-md"
                : "bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-50 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 shadow-2xs"
            }`}
          >

            <div className="flex items-center justify-between mb-2">

              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  selectedStatus ===
                  "Rejected"
                    ? "text-slate-300"
                    : "text-slate-400"
                }`}
              >
                Archived
              </span>


              <XCircle
                className={`w-4 h-4 ${
                  selectedStatus ===
                  "Rejected"
                    ? "text-rose-300"
                    : "text-slate-400"
                }`}
              />

            </div>


            <p className="text-2xl sm:text-3xl font-extrabold">

              {stats.rejected}

            </p>


            <p
              className={`text-[11px] mt-1 ${
                selectedStatus ===
                "Rejected"
                  ? "text-slate-300"
                  : "text-slate-500 dark:text-zinc-400"
              }`}
            >
              Closed / Completed
            </p>

          </button>

        </div>


        {/* ====================================================
            SEARCH + STATUS FILTER
        ==================================================== */}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">

          {/* SEARCH */}

          <div className="relative w-full sm:max-w-md">

            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />


            <input
              type="text"
              value={
                searchQuery
              }
              onChange={(event) =>
                setSearchQuery(
                  event.target.value
                )
              }
              placeholder="Search applications..."
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />

          </div>


          {/* STATUS FILTER */}

          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl self-start sm:self-auto overflow-x-auto no-scrollbar max-w-full">

            {[
              "All",
              "Applied",
              "Shortlisted",
              "Interview",
              "Rejected",
            ].map(
              (status) => (

                <button
                  key={
                    status
                  }
                  type="button"
                  onClick={() =>
                    setSelectedStatus(
                      status
                    )
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    selectedStatus ===
                    status
                      ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-50 shadow-2xs font-bold"
                      : "text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-zinc-50"
                  }`}
                >

                  {status}

                </button>

              )
            )}

          </div>

        </div>


        {/* ====================================================
            BACKGROUND ERROR
        ==================================================== */}

        {error &&
          applications.length >
            0 && (

            <div className="mb-5 flex items-center justify-between gap-3 px-4 py-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl">

              <div className="flex items-center gap-2">

                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />

                <p className="text-xs text-rose-700 dark:text-rose-300">

                  {error}

                </p>

              </div>


              <button
                type="button"
                onClick={() =>
                  loadApplications(
                    false
                  )
                }
                className="text-xs font-bold text-rose-700 dark:text-rose-300 hover:text-rose-900 dark:hover:text-rose-300"
              >
                Retry
              </button>

            </div>

          )}


        {/* ====================================================
            APPLICATIONS
        ==================================================== */}

        {filteredApplications.length ===
        0 ? (

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs p-12 text-center max-w-md mx-auto my-8">

            <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-4">

              <Briefcase className="w-8 h-8" />

            </div>


            <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-50 mb-1">

              {applications.length ===
              0
                ? "No applications yet"
                : "No applications found"}

            </h2>


            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed mb-6">

              {applications.length ===
              0
                ? "Swipe right on a job or use Apply to submit an application. Your application status will appear here."
                : selectedStatus !==
                    "All"
                  ? `No applications in the '${selectedStatus}' stage match your search.`
                  : "No applications match your current search."}

            </p>


            {applications.length ===
            0 ? (

              <Link
                to="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs active:scale-95 transition-all"
              >

                <span>
                  Explore Jobs
                </span>

                <ArrowRight className="w-4 h-4" />

              </Link>

            ) : (

              <button
                type="button"
                onClick={() => {
                  setSelectedStatus(
                    "All"
                  );
                  setSearchQuery(
                    ""
                  );
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-100 text-xs font-bold rounded-xl transition-all"
              >

                Clear Filters

              </button>

            )}

          </div>

        ) : (

          <div className="space-y-4">

            {filteredApplications.map(
              (application) => (

                <ApplicationCard
                  key={
                    application.id
                  }
                  application={
                    application
                  }
                />

              )
            )}

          </div>

        )}

      </div>

    </div>
  );
}


export default ApplicationsPage;