import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  Bookmark,
  Building,
  MapPin,
  IndianRupee,
  Trash2,
  Send,
  ArrowRight,
  Loader2,
  AlertCircle,
  RefreshCw,
  BriefcaseBusiness,
} from "lucide-react";

import { jobService } from "../services/jobService";
import { MatchScore } from "../components/MatchScore";
import { JobBadge } from "../components/JobBadge";
import { useApp } from "../context/AppContext";


// ============================================================
// HELPERS
// ============================================================

const normalizeSkills = (skills) => {
  if (Array.isArray(skills)) {
    return skills
      .map((skill) => String(skill).trim())
      .filter(Boolean);
  }

  return String(skills || "")
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
};


const isRemoteJob = (job) => {
  const workMode = String(
    job?.work_mode ||
      job?.workMode ||
      ""
  ).toLowerCase();

  return workMode.includes("remote");
};


const isInternshipJob = (job) => {
  const employmentType = String(
    job?.employment_type ||
      job?.employmentType ||
      ""
  ).toLowerCase();

  return employmentType.includes(
    "intern"
  );
};


const getEmploymentType = (job) => {
  return (
    job?.employment_type ||
    job?.employmentType ||
    job?.jobType ||
    "Job"
  );
};


const getMatchScore = (job) => {
  return (
    job?.matchPercentage ??
    job?.match_percentage ??
    job?.matchScore ??
    null
  );
};


// ============================================================
// PAGE
// ============================================================

export function SavedJobsPage() {

  const { addToast } = useApp();

  // ==========================================================
  // STATE
  // ==========================================================

  const [savedJobs, setSavedJobs] =
    useState([]);

  const [applications, setApplications] =
    useState([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [error, setError] =
    useState(null);

  const [filterType, setFilterType] =
    useState("All");

  const [removingJobId, setRemovingJobId] =
    useState(null);

  const [applyingJobId, setApplyingJobId] =
    useState(null);


  // ==========================================================
  // LOAD SAVED JOBS + APPLICATIONS
  // ==========================================================

  const loadSavedJobs = useCallback(
    async (showLoader = true) => {

      if (showLoader) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      setError(null);

      try {

        const [
          savedResponse,
          applicationsResponse,
        ] = await Promise.all([
          jobService.getSavedJobs(),
          jobService.getApplications(),
        ]);


        // ------------------------------------------------------
        // SAVED JOBS
        // ------------------------------------------------------

        const jobs =
          savedResponse?.saved_jobs ||
          savedResponse?.jobs ||
          [];

        setSavedJobs(
          Array.isArray(jobs)
            ? jobs
            : []
        );


        // ------------------------------------------------------
        // APPLICATIONS
        // ------------------------------------------------------

        const applicationList =
          applicationsResponse?.applications ||
          [];

        setApplications(
          Array.isArray(
            applicationList
          )
            ? applicationList
            : []
        );

      } catch (err) {

        console.error(
          "Failed to load saved jobs:",
          err
        );

        setError(
          err?.response?.data?.message ||
            "Unable to load your saved jobs. Please try again."
        );

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
    loadSavedJobs(true);
  }, [loadSavedJobs]);


  // ==========================================================
  // APPLICATION LOOKUP
  // ==========================================================

  const appliedJobIds = useMemo(() => {

    return new Set(
      applications
        .map(
          (application) =>
            application?.job_id ??
            application?.jobId ??
            application?.id
        )
        .filter(
          (id) =>
            id !== undefined &&
            id !== null
        )
        .map(String)
    );

  }, [applications]);


  // ==========================================================
  // FILTER SAVED JOBS
  // ==========================================================

  const filteredSavedJobs = useMemo(() => {

    return savedJobs.filter(
      (job) => {

        if (
          filterType === "All"
        ) {
          return true;
        }


        if (
          filterType === "Remote"
        ) {
          return isRemoteJob(job);
        }


        if (
          filterType === "Internship"
        ) {
          return isInternshipJob(job);
        }


        if (
          filterType === "Full Time"
        ) {
          return (
            String(
              getEmploymentType(job)
            ).toLowerCase() ===
            "full time"
          );
        }


        return true;
      }
    );

  }, [
    savedJobs,
    filterType,
  ]);


  // ==========================================================
  // REMOVE SAVED JOB
  // ==========================================================

  const handleRemoveSavedJob =
    useCallback(
      async (job) => {

        if (
          !job?.id ||
          removingJobId
        ) {
          return;
        }

        setRemovingJobId(
          job.id
        );

        try {

          await jobService.unsaveJob(
            job.id
          );

          // Remove immediately from UI
          setSavedJobs(
            (previous) =>
              previous.filter(
                (item) =>
                  String(
                    item.id
                  ) !==
                  String(job.id)
              )
          );

          addToast(
            "Job removed from saved jobs.",
            "success"
          );

        } catch (err) {

          console.error(
            "Failed to remove saved job:",
            err
          );

          addToast(
            err?.response?.data?.message ||
              "Unable to remove saved job.",
            "error"
          );

        } finally {

          setRemovingJobId(null);

        }

      },
      [
        removingJobId,
        addToast,
      ]
    );


  // ==========================================================
  // APPLY TO JOB
  // ==========================================================
  //
  // Explicit Apply:
  //
  // POST /jobs/:id/apply
  //
  // Backend records:
  //
  // applications = Applied
  // swipes = RIGHT
  //
  // ==========================================================

  const handleApplyJob =
    useCallback(
      async (job) => {

        if (
          !job?.id ||
          applyingJobId
        ) {
          return;
        }

        const alreadyApplied =
          appliedJobIds.has(
            String(job.id)
          );

        if (alreadyApplied) {

          addToast(
            "You have already applied for this job.",
            "info"
          );

          return;
        }

        setApplyingJobId(
          job.id
        );

        try {

          const response =
            await jobService.applyJob(
              job.id
            );


          // ----------------------------------------------------
          // Update application state
          // ----------------------------------------------------

          if (
            response?.application
          ) {

            setApplications(
              (previous) => [
                response.application,
                ...previous,
              ]
            );

          } else {

            // Backend response didn't contain
            // the application object, so reload.
            const refreshed =
              await jobService.getApplications();

            setApplications(
              refreshed?.applications ||
                []
            );
          }


          addToast(
            response?.message ||
              "Application submitted successfully!",
            "success"
          );

        } catch (err) {

          console.error(
            "Failed to apply:",
            err
          );

          addToast(
            err?.response?.data?.message ||
              "Unable to submit application.",
            "error"
          );

        } finally {

          setApplyingJobId(null);

        }

      },
      [
        applyingJobId,
        appliedJobIds,
        addToast,
      ]
    );


  // ==========================================================
  // LOADING STATE
  // ==========================================================

  if (isLoading) {

    return (
      <div className="min-h-[calc(100dvh-4rem)] bg-slate-50/60 dark:bg-zinc-950/60">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Header Skeleton */}

          <div className="flex items-center justify-between mb-8">

            <div className="space-y-3">

              <div className="h-8 w-48 bg-slate-200 dark:bg-zinc-700 rounded-xl animate-pulse" />

              <div className="h-4 w-64 bg-slate-200 dark:bg-zinc-700 rounded-lg animate-pulse" />

            </div>

          </div>


          {/* Cards Skeleton */}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {[1, 2, 3].map(
              (item) => (

                <div
                  key={item}
                  className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 h-[330px] animate-pulse"
                >

                  <div className="flex gap-3 mb-5">

                    <div className="w-12 h-12 bg-slate-200 dark:bg-zinc-700 rounded-xl" />

                    <div className="space-y-2">

                      <div className="h-3 w-24 bg-slate-200 dark:bg-zinc-700 rounded" />

                      <div className="h-5 w-36 bg-slate-200 dark:bg-zinc-700 rounded" />

                    </div>

                  </div>


                  <div className="space-y-3">

                    <div className="h-4 bg-slate-100 dark:bg-zinc-800 rounded" />

                    <div className="h-4 bg-slate-100 dark:bg-zinc-800 rounded" />

                    <div className="h-4 w-3/4 bg-slate-100 dark:bg-zinc-800 rounded" />

                  </div>

                </div>

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
    savedJobs.length === 0
  ) {

    return (
      <div className="min-h-[calc(100dvh-4rem)] bg-slate-50/60 dark:bg-zinc-950/60 flex items-center justify-center px-4">

        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-rose-100 dark:border-rose-500/20 shadow-sm p-8 text-center max-w-md w-full">

          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">

            <AlertCircle className="w-7 h-7" />

          </div>


          <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-50">

            Unable to load saved jobs

          </h2>


          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2 mb-6 leading-relaxed">

            {error}

          </p>


          <button
            type="button"
            onClick={() =>
              loadSavedJobs(true)
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">

          <div>

            <div className="flex items-center gap-2 mb-1">

              <div className="p-2 bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 rounded-xl">

                <Bookmark className="w-5 h-5 fill-brand-600 text-brand-600 dark:text-brand-400" />

              </div>


              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight">

                Saved Jobs

              </h1>

            </div>


            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">

              {savedJobs.length}{" "}

              {savedJobs.length === 1
                ? "job"
                : "jobs"}{" "}

              saved to your list

            </p>

          </div>


          <div className="flex items-center gap-2">

            {/* Refresh */}

            <button
              type="button"
              onClick={() =>
                loadSavedJobs(false)
              }
              disabled={
                isRefreshing
              }
              title="Refresh saved jobs"
              className="flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 hover:text-brand-700 dark:hover:text-brand-300 hover:border-brand-200 dark:hover:border-brand-500/20 transition-all disabled:opacity-50"
            >

              <RefreshCw
                className={`w-4 h-4 ${
                  isRefreshing
                    ? "animate-spin"
                    : ""
                }`}
              />

            </button>


            {/* Filter */}

            {savedJobs.length > 0 && (

              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl">

                {[
                  "All",
                  "Remote",
                  "Full Time",
                  "Internship",
                ].map(
                  (type) => (

                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        setFilterType(
                          type
                        )
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        filterType ===
                        type
                          ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-50 shadow-2xs"
                          : "text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-zinc-50"
                      }`}
                    >

                      {type}

                    </button>

                  )
                )}

              </div>

            )}

          </div>

        </div>


        {/* ====================================================
            BACKGROUND REFRESH ERROR
        ==================================================== */}

        {error && savedJobs.length > 0 && (

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
                loadSavedJobs(false)
              }
              className="text-xs font-bold text-rose-700 dark:text-rose-300 hover:text-rose-900 dark:hover:text-rose-300"
            >

              Retry

            </button>

          </div>

        )}


        {/* ====================================================
            EMPTY / NO FILTER RESULTS
        ==================================================== */}

        {filteredSavedJobs.length === 0 ? (

          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-xs p-12 text-center max-w-md mx-auto my-8">

            <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-4">

              {savedJobs.length === 0 ? (
                <Bookmark className="w-8 h-8" />
              ) : (
                <BriefcaseBusiness className="w-8 h-8" />
              )}

            </div>


            <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-50 mb-1">

              {savedJobs.length === 0
                ? "No saved jobs yet"
                : "No jobs match this filter"}

            </h2>


            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed mb-6">

              {savedJobs.length === 0
                ? "Use the bookmark button on jobs in Discover to save opportunities here for quick review."
                : "Try another filter to see your saved opportunities."}

            </p>


            {savedJobs.length === 0 ? (

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
                onClick={() =>
                  setFilterType(
                    "All"
                  )
                }
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-100 text-xs font-bold rounded-xl transition-all"
              >

                Show All Jobs

              </button>

            )}

          </div>

        ) : (

          /* ==================================================
             SAVED JOB GRID
          ================================================== */

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {filteredSavedJobs.map(
              (job) => {

                const jobId =
                  String(
                    job.id
                  );

                const isApplied =
                  appliedJobIds.has(
                    jobId
                  );

                const isRemoving =
                  removingJobId ===
                  job.id;

                const isApplying =
                  applyingJobId ===
                  job.id;

                const skills =
                  normalizeSkills(
                    job.skills
                  );

                const remote =
                  isRemoteJob(
                    job
                  );

                const internship =
                  isInternshipJob(
                    job
                  );

                const employmentType =
                  getEmploymentType(
                    job
                  );

                const matchScore =
                  getMatchScore(
                    job
                  );

                return (


                  <div
                    data-testid="saved-job-card"
                    key={job.id}
                    className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs hover:shadow-md transition-all p-6 flex flex-col justify-between"
                  >

                    <div>

                      {/* ======================================
                          CARD HEADER
                      ====================================== */}

                      <div className="flex items-start justify-between gap-3 mb-3.5">

                        <div className="flex items-center gap-3 min-w-0">

                          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-800 p-1 flex items-center justify-center overflow-hidden shrink-0">

                            {job.logo ? (

                              <img
                                src={job.logo}
                                alt={
                                  job.company ||
                                  "Company"
                                }
                                className="w-full h-full object-cover rounded-lg"
                              />

                            ) : (

                              <Building className="w-6 h-6 text-slate-400" />

                            )}

                          </div>


                          <div className="min-w-0">

                            <span className="block text-[11px] font-bold text-brand-700 dark:text-brand-300 uppercase tracking-wider truncate">

                              {job.company ||
                                "Company"}

                            </span>


                            <h3 className="text-base font-bold text-slate-900 dark:text-zinc-50 line-clamp-1">

                              {job.title ||
                                "Untitled Job"}

                            </h3>

                          </div>

                        </div>


                        {/* REMOVE */}

                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveSavedJob(
                              job
                            )
                          }
                          disabled={
                            isRemoving
                          }
                          className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors shrink-0 disabled:opacity-50"
                          title="Remove from saved"
                          aria-label="Remove job from saved"
                        >

                          {isRemoving ? (

                            <Loader2 className="w-4 h-4 animate-spin" />

                          ) : (

                            <Trash2 className="w-4 h-4" />

                          )}

                        </button>

                      </div>


                      {/* ======================================
                          BADGES
                      ====================================== */}

                      <div className="flex flex-wrap items-center gap-1.5 mb-3">

                        {matchScore !== null && (
                          <MatchScore
                            score={
                              matchScore
                            }
                            size="sm"
                          />
                        )}


                        <JobBadge
                          type="fulltime"
                          text={
                            employmentType
                          }
                          size="sm"
                        />


                        {remote && (
                          <JobBadge
                            type="remote"
                            text="Remote"
                            size="sm"
                          />
                        )}


                        {internship && (
                          <JobBadge
                            type="internship"
                            text="Internship"
                            size="sm"
                          />
                        )}

                      </div>


                      {/* ======================================
                          JOB DETAILS
                      ====================================== */}

                      <div className="space-y-1.5 text-xs text-slate-600 dark:text-zinc-300 my-3">

                        <div className="flex items-center gap-1.5">

                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />

                          <span className="truncate">

                            {job.location ||
                              "Location not specified"}

                          </span>

                        </div>


                        {job.salary && (

                          <div className="flex items-center gap-1.5 font-bold text-brand-700 dark:text-brand-300">

                            <IndianRupee className="w-3.5 h-3.5" />

                            <span>

                              {job.salary}

                            </span>

                          </div>

                        )}

                      </div>


                      {/* ======================================
                          SKILLS
                      ====================================== */}

                      {skills.length > 0 && (

                        <div className="flex flex-wrap gap-1 mb-4">

                          {skills
                            .slice(0, 4)
                            .map(
                              (
                                skill
                              ) => (

                                <span
                                  key={
                                    skill
                                  }
                                  className="px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 text-[11px] font-medium rounded-md"
                                >

                                  {skill}

                                </span>

                              )
                            )}


                          {skills.length >
                            4 && (

                            <span className="px-1.5 py-0.5 text-slate-400 text-[11px]">

                              +
                              {skills.length -
                                4}{" "}
                              more

                            </span>

                          )}

                        </div>

                      )}

                    </div>


                    {/* ========================================
                        ACTIONS
                    ======================================== */}

                    <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center gap-2">

                      {/* VIEW DETAILS */}

                      <Link
                        to={`/jobs/${job.id}`}
                        className="flex-1 text-center py-2.5 px-3 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-100 font-semibold text-xs rounded-xl transition-colors"
                      >

                        View Details

                      </Link>


                      {/* APPLY */}

                      <button
                        type="button"
                        onClick={() =>
                          handleApplyJob(
                            job
                          )
                        }
                        disabled={
                          isApplied ||
                          isApplying
                        }
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-100 dark:disabled:bg-zinc-800 disabled:text-slate-400 text-white font-bold text-xs rounded-xl shadow-2xs transition-all active:scale-95"
                      >

                        {isApplying ? (

                          <Loader2 className="w-3.5 h-3.5 animate-spin" />

                        ) : (

                          <Send className="w-3.5 h-3.5" />

                        )}


                        <span>

                          {isApplied
                            ? "Applied"
                            : isApplying
                              ? "Applying..."
                              : "Apply"}

                        </span>

                      </button>

                    </div>

                  </div>

                );

              }
            )}

          </div>

        )}

      </div>

    </div>

  );
}


export default SavedJobsPage;