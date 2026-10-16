import React, {
  useState,
  useEffect,
} from "react";

import {
  useParams,
  Link,
  useNavigate,
} from "react-router-dom";

import {
  Building2,
  MapPin,
  Users,
  Globe,
  Star,
  Briefcase,
  ArrowLeft,
  Share2,
  ExternalLink,
  CheckCircle2,
  Bookmark,
  Layers,
  HeartHandshake,
  Send,
  AlertCircle,
} from "lucide-react";

import jobService from "../services/jobService";

import { useApp } from "../context/AppContext";


export function CompanyDetailsPage() {

  const { id } = useParams();

  const navigate = useNavigate();

  const {
    setApplyModalJob,
    addToast,
  } = useApp();


  // =========================================================
  // STATE
  // =========================================================

  const [company, setCompany] = useState(null);

  const [companyJobs, setCompanyJobs] =
    useState([]);

  const [savedJobIds, setSavedJobIds] =
    useState(new Set());

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState(null);

  const [savingJobId, setSavingJobId] =
    useState(null);


  // =========================================================
  // LOAD COMPANY + JOBS + SAVED JOBS
  // =========================================================

  useEffect(() => {

    let isMounted = true;

    async function loadData() {

      setIsLoading(true);
      setError(null);

      try {

        // ---------------------------------------------------
        // COMPANY
        // ---------------------------------------------------

        const companyResponse =
          await jobService.getCompany(id);

        console.log(
          "GET /companies/:id:",
          companyResponse
        );

        if (
          !companyResponse?.success ||
          !companyResponse?.company
        ) {
          throw new Error(
            companyResponse?.message ||
              "Company profile not found."
          );
        }

        const currentCompany =
          companyResponse.company;

        if (!isMounted) {
          return;
        }

        setCompany(
          currentCompany
        );


        // ---------------------------------------------------
        // JOBS
        // ---------------------------------------------------

        const jobsResponse =
          await jobService.getJobs();

        console.log(
          "GET /jobs:",
          jobsResponse
        );

        const allJobs =
          jobsResponse?.success &&
          Array.isArray(
            jobsResponse.jobs
          )
            ? jobsResponse.jobs
            : [];


        // ---------------------------------------------------
        // MATCH JOBS TO COMPANY
        // ---------------------------------------------------

        const companyName =
          currentCompany.name
            ?.trim()
            .toLowerCase() || "";


        const matchedJobs =
          allJobs.filter((job) => {

            const jobCompany =
              job.company
                ?.trim()
                .toLowerCase() || "";

            const isSameCompany =
              jobCompany === companyName;

            const isActive =
              !job.status ||
              job.status === "Active";

            return (
              isSameCompany &&
              isActive
            );
          });


        if (isMounted) {
          setCompanyJobs(
            matchedJobs
          );
        }


        // ---------------------------------------------------
        // SAVED JOBS
        // ---------------------------------------------------

        try {

          const savedResponse =
            await jobService.getSavedJobs();

          if (
            savedResponse?.success &&
            Array.isArray(
              savedResponse.saved_jobs
            )
          ) {

            const ids =
              savedResponse.saved_jobs.map(
                (item) =>
                  Number(
                    item.job?.id ??
                    item.job_id ??
                    item.id
                  )
              );

            if (isMounted) {
              setSavedJobIds(
                new Set(
                  ids.filter(
                    (value) =>
                      Number.isFinite(value)
                  )
                )
              );
            }
          }

        } catch (savedError) {

          // Saved jobs should not prevent
          // company details from loading.

          console.warn(
            "Unable to load saved jobs:",
            savedError
          );

        }

      } catch (err) {

        console.error(
          "Error loading company details:",
          err
        );

        if (isMounted) {

          setError(
            err?.response?.data?.message ||
              err?.message ||
              "Failed to load company details. Please try again."
          );

        }

      } finally {

        if (isMounted) {
          setIsLoading(false);
        }

      }
    }


    loadData();


    return () => {
      isMounted = false;
    };

  }, [id]);


  // =========================================================
  // SHARE
  // =========================================================

  const handleShare = async () => {

    try {

      if (
        navigator.share
      ) {

        await navigator.share({
          title:
            company?.name ||
            "Company",
          text:
            `Check out ${company?.name || "this company"} on SwipeX.`,
          url:
            window.location.href,
        });

        return;
      }


      if (
        navigator.clipboard
      ) {

        await navigator.clipboard.writeText(
          window.location.href
        );

        addToast?.(
          "Company link copied to clipboard!",
          "success"
        );
      }

    } catch (err) {

      if (
        err?.name !==
        "AbortError"
      ) {

        console.error(
          "Share failed:",
          err
        );
      }

    }
  };


  // =========================================================
  // SAVE / UNSAVE
  // =========================================================

  const handleSaveJob = async (
    job
  ) => {

    if (!job?.id) {
      return;
    }

    const jobId =
      Number(job.id);

    const isSaved =
      savedJobIds.has(jobId);

    setSavingJobId(jobId);

    try {

      if (isSaved) {

        await jobService.unsaveJob(
          jobId
        );

        setSavedJobIds(
          (previous) => {

            const next =
              new Set(previous);

            next.delete(jobId);

            return next;
          }
        );

        addToast?.(
          "Job removed from saved jobs.",
          "success"
        );

      } else {

        await jobService.saveJob(
          jobId
        );

        setSavedJobIds(
          (previous) => {

            const next =
              new Set(previous);

            next.add(jobId);

            return next;
          }
        );

        addToast?.(
          "Job saved successfully.",
          "success"
        );
      }

    } catch (err) {

      console.error(
        "Save job failed:",
        err
      );

      addToast?.(
        err?.response?.data?.message ||
          "Unable to update saved job.",
        "error"
      );

    } finally {

      setSavingJobId(null);

    }
  };


  // =========================================================
  // LOADING
  // =========================================================

  if (isLoading) {

    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">

        <div className="h-44 bg-slate-200 dark:bg-zinc-700 rounded-3xl mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          <div className="lg:col-span-2 space-y-6">

            <div className="h-6 bg-slate-200 dark:bg-zinc-700 rounded w-1/3" />

            <div className="h-24 bg-slate-100 dark:bg-zinc-800 rounded-2xl" />

            <div className="h-40 bg-slate-100 dark:bg-zinc-800 rounded-2xl" />

          </div>

          <div className="space-y-4">

            <div className="h-48 bg-slate-100 dark:bg-zinc-800 rounded-2xl" />

          </div>

        </div>

      </div>
    );
  }


  // =========================================================
  // ERROR
  // =========================================================

  if (
    error ||
    !company
  ) {

    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">

        <div className="w-16 h-16 bg-slate-100 dark:bg-zinc-800 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">

          <AlertCircle className="w-8 h-8" />

        </div>

        <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-50 mb-2">
          Company Not Found
        </h2>

        <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6">
          {error ||
            "We couldn't locate this company profile."}
        </p>

        <div className="flex items-center justify-center gap-2">

          <button
            type="button"
            onClick={() =>
              navigate(-1)
            }
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-bold rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <Link
            to="/companies"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-all"
          >
            Browse Companies
          </Link>

        </div>

      </div>
    );
  }


  // =========================================================
  // SAFE DATA
  // =========================================================

  const techStack =
    Array.isArray(
      company.techStack
    )
      ? company.techStack
      : [];

  const benefits =
    Array.isArray(
      company.benefits
    )
      ? company.benefits
      : [];


  // =========================================================
  // RENDER
  // =========================================================

  return (

    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-200">

      {/* ===================================================
          BACK
      =================================================== */}

      <button
        type="button"
        onClick={() =>
          navigate(-1)
        }
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-50 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>
          Back to Companies
        </span>
      </button>


      {/* ===================================================
          HERO
      =================================================== */}

      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-xs mb-8">

        {/* Banner */}

        <div className="h-32 bg-linear-to-r from-brand-600 to-amber-600 relative">

          <div className="absolute top-4 right-4">

            <button
              type="button"
              onClick={handleShare}
              className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-white transition-all"
              title="Share company profile"
              aria-label="Share company profile"
            >
              <Share2 className="w-4 h-4" />
            </button>

          </div>

        </div>


        {/* Company Header */}

        <div className="px-6 sm:px-8 pb-6 pt-0 relative">

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 mb-5">

            <div className="flex items-end gap-4 min-w-0">

              {/* Logo */}

              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white dark:bg-zinc-900 p-1.5 border-4 border-white dark:border-zinc-800 shadow-md overflow-hidden shrink-0">

                {company.logo ? (
                  <img
                    src={company.logo}
                    alt={`${company.name} logo`}
                    className="w-full h-full object-contain rounded-xl"
                    onError={(event) => {
                      event.currentTarget.style.display =
                        "none";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-zinc-950 rounded-xl">
                    <Building2 className="w-8 h-8 text-slate-400" />
                  </div>
                )}

              </div>


              {/* Name */}

              <div className="pb-1 min-w-0">

                <div className="flex flex-wrap items-center gap-2.5">

                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-zinc-50 truncate">
                    {company.name}
                  </h1>

                  <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-500/20 rounded-md">
                    {company.category}
                  </span>

                </div>

                <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-medium">
                  {company.industry}

                  {company.foundedYear && (
                    <>
                      {" "}
                      • Founded{" "}
                      {company.foundedYear}
                    </>
                  )}
                </p>

              </div>

            </div>


            {/* WEBSITE */}

            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-100 text-xs font-bold rounded-xl transition-all w-fit shrink-0"
              >
                <Globe className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />

                <span>
                  Visit Website
                </span>

                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            )}

          </div>


          {/* =================================================
              METRICS
          ================================================= */}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800">

            {/* HQ */}

            <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-zinc-300">

              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />

              <div className="min-w-0">

                <p className="text-[10px] text-slate-400 uppercase font-bold">
                  Headquarters
                </p>

                <p className="font-semibold text-slate-900 dark:text-zinc-50 truncate">
                  {company.location ||
                    "Not specified"}
                </p>

              </div>

            </div>


            {/* TEAM */}

            <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-zinc-300">

              <Users className="w-4 h-4 text-slate-400 shrink-0" />

              <div>

                <p className="text-[10px] text-slate-400 uppercase font-bold">
                  Team Size
                </p>

                <p className="font-semibold text-slate-900 dark:text-zinc-50">
                  {company.employeeCount ||
                    "Not specified"}
                </p>

              </div>

            </div>


            {/* RATING */}

            <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-zinc-300">

              <Star className="w-4 h-4 text-amber-500 shrink-0 fill-amber-400" />

              <div>

                <p className="text-[10px] text-slate-400 uppercase font-bold">
                  Rating
                </p>

                <p className="font-semibold text-slate-900 dark:text-zinc-50">
                  {company.rating != null
                    ? `${company.rating} / 5.0`
                    : "Not rated"}
                </p>

              </div>

            </div>


            {/* JOBS */}

            <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-zinc-300">

              <Briefcase className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />

              <div>

                <p className="text-[10px] text-slate-400 uppercase font-bold">
                  Open Positions
                </p>

                <p className="font-semibold text-brand-700 dark:text-brand-300">
                  {companyJobs.length}
                  {" "}
                  {companyJobs.length ===
                  1
                    ? "role"
                    : "roles"}
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>


      {/* ===================================================
          MAIN GRID
      =================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* =================================================
            LEFT
        ================================================= */}

        <div className="lg:col-span-2 space-y-6">

          {/* ABOUT */}

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 shadow-xs">

            <h2 className="text-base font-bold text-slate-900 dark:text-zinc-50 mb-3 flex items-center gap-2">

              <Building2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />

              <span>
                About {company.name}
              </span>

            </h2>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
              {company.about ||
                "No company description is available yet."}
            </p>

          </div>


          {/* TECH STACK */}

          {techStack.length > 0 && (

            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 shadow-xs">

              <h2 className="text-base font-bold text-slate-900 dark:text-zinc-50 mb-4 flex items-center gap-2">

                <Layers className="w-4 h-4 text-brand-600 dark:text-brand-400" />

                <span>
                  Primary Engineering Stack
                </span>

              </h2>

              <div className="flex flex-wrap gap-2">

                {techStack.map(
                  (tech, index) => (
                    <span
                      key={`${tech}-${index}`}
                      className="px-3 py-1.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-semibold rounded-xl"
                    >
                      {tech}
                    </span>
                  )
                )}

              </div>

            </div>
          )}


          {/* BENEFITS */}

          {benefits.length > 0 && (

            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 shadow-xs">

              <h2 className="text-base font-bold text-slate-900 dark:text-zinc-50 mb-4 flex items-center gap-2">

                <HeartHandshake className="w-4 h-4 text-brand-600 dark:text-brand-400" />

                <span>
                  Workplace Benefits & Perks
                </span>

              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                {benefits.map(
                  (benefit, index) => (

                    <div
                      key={`${benefit}-${index}`}
                      className="flex items-center gap-2.5 p-3 bg-brand-50/50 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/20 rounded-xl text-xs font-medium text-slate-700 dark:text-zinc-200"
                    >

                      <CheckCircle2 className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />

                      <span>
                        {benefit}
                      </span>

                    </div>

                  )
                )}

              </div>

            </div>
          )}

        </div>


        {/* =================================================
            RIGHT - OPEN ROLES
        ================================================= */}

        <div className="space-y-6">

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 shadow-xs">

            <div className="flex items-center justify-between mb-4">

              <h2 className="text-base font-bold text-slate-900 dark:text-zinc-50 flex items-center gap-2">

                <Briefcase className="w-4 h-4 text-brand-600 dark:text-brand-400" />

                <span>
                  Open Roles
                </span>

              </h2>

              <span className="px-2 py-0.5 bg-brand-100 dark:bg-brand-500/15 text-brand-800 dark:text-brand-300 font-bold text-[11px] rounded-full">
                {companyJobs.length}
              </span>

            </div>


            {/* JOB LIST */}

            {companyJobs.length > 0 ? (

              <div className="space-y-3">

                {companyJobs.map(
                  (job) => {

                    const jobId =
                      Number(job.id);

                    const isSaved =
                      savedJobIds.has(
                        jobId
                      );

                    const isSaving =
                      savingJobId ===
                      jobId;

                    return (

                      <div
                        key={job.id}
                        className="p-3.5 bg-slate-50 dark:bg-zinc-950 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl transition-all"
                      >

                        {/* JOB HEADER */}

                        <div className="flex items-start justify-between gap-2 mb-2">

                          <div className="min-w-0">

                            <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-50 leading-tight">
                              {job.title}
                            </h4>

                            <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1">
                              {job.company}
                            </p>

                          </div>


                          {/* SAVE */}

                          <button
                            type="button"
                            onClick={() =>
                              handleSaveJob(
                                job
                              )
                            }
                            disabled={
                              isSaving
                            }
                            className={`p-1.5 rounded-lg transition-colors ${
                              isSaved
                                ? "text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10"
                                : "text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10"
                            }`}
                            title={
                              isSaved
                                ? "Remove from saved"
                                : "Save role"
                            }
                            aria-label={
                              isSaved
                                ? "Remove from saved"
                                : "Save role"
                            }
                          >

                            <Bookmark
                              className={`w-3.5 h-3.5 ${
                                isSaved
                                  ? "fill-brand-600 text-brand-600 dark:text-brand-400"
                                  : ""
                              }`}
                            />

                          </button>

                        </div>


                        {/* JOB META */}

                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500 dark:text-zinc-400 mb-3">

                          {job.employment_type && (
                            <span className="px-1.5 py-0.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded">
                              {job.employment_type}
                            </span>
                          )}

                          {job.work_mode && (
                            <span className="px-1.5 py-0.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded">
                              {job.work_mode}
                            </span>
                          )}

                          {job.experience_level && (
                            <span className="px-1.5 py-0.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded">
                              {job.experience_level}
                            </span>
                          )}

                        </div>


                        {/* LOCATION + SALARY */}

                        <div className="space-y-1 mb-3">

                          {job.location && (
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-zinc-400">

                              <MapPin className="w-3 h-3 text-slate-400" />

                              <span>
                                {job.location}
                              </span>

                            </div>
                          )}

                          {job.salary && (
                            <div className="text-[10px] font-semibold text-brand-700 dark:text-brand-300">
                              ₹ {job.salary}
                            </div>
                          )}

                        </div>


                        {/* ACTIONS */}

                        <div className="flex items-center gap-2">

                          <Link
                            to={`/jobs/${job.id}`}
                            className="flex-1 text-center px-3 py-2 bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 text-[10px] font-bold rounded-lg transition-all"
                          >
                            View Details
                          </Link>

                          <button
                            type="button"
                            onClick={() =>
                              setApplyModalJob(
                                job
                              )
                            }
                            className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white text-[10px] font-bold rounded-lg transition-all shadow-xs"
                          >

                            <Send className="w-3 h-3" />

                            Apply

                          </button>

                        </div>

                      </div>

                    );
                  }
                )}

              </div>

            ) : (

              /* NO JOBS */

              <div className="text-center py-8">

                <div className="w-12 h-12 bg-slate-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center mx-auto mb-3">

                  <Briefcase className="w-6 h-6 text-slate-300" />

                </div>

                <p className="text-xs font-semibold text-slate-700 dark:text-zinc-200 mb-1">
                  No open roles
                </p>

                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mb-4">
                  This company currently has
                  no active jobs in SwipeX.
                </p>

                <Link
                  to="/"
                  className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
                >
                  Explore jobs
                  <ArrowLeft className="w-3 h-3 rotate-180" />
                </Link>

              </div>

            )}

          </div>

        </div>

      </div>

    </div>
  );
}

export default CompanyDetailsPage;