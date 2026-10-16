import React, {
  useEffect,
  useMemo,
  useCallback,
  useState,
} from "react";
import { AnimatePresence } from "motion/react";

import {
  RotateCcw,
  Sparkles,
  Inbox,
  SlidersHorizontal,
  Keyboard,
  Undo2,
  AlertCircle,
  Loader2,
  Radio,
  ChevronLeft,
  ChevronRight,
  X,
  Heart,
  Bookmark,
} from "lucide-react";

import { useApp } from "../context/AppContext";
import { jobService } from "../services/jobService";
import { aiService } from "../services/aiService";
import { JobCard } from "../components/JobCard";

export function DiscoverPage() {
  const {
    searchQuery,
    filters,
    isFilterModalOpen,
    applyModalJob,
    setIsFilterModalOpen,
    setApplyModalJob,
    addToast,
  } = useApp();

  // ============================================================
  // JOB DATA
  // ============================================================

  const [allJobs, setAllJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  // ============================================================
  // SWIPE HISTORY
  // ============================================================
  //
  // This comes from the DATABASE.
  //
  // LEFT  = skipped
  // RIGHT = applied
  //
  // ============================================================

  const [swipedJobIds, setSwipedJobIds] = useState(
    new Set()
  );

  const [swipeHistory, setSwipeHistory] = useState([]);

  // ============================================================
  // AI DECK RANKING
  // ============================================================
  //
  // The AI service re-ranks the unseen jobs from the user's profile skills, resume and every swipe
  // stored in the database. It is re-queried after each swipe (see fetchDeckRanking below), so the
  // next card already reflects the swipe that just happened.
  //
  // ============================================================

  const [deckRank, setDeckRank] = useState(null); // { order: string[], scores: {id: number} }

  const fetchDeckRanking = useCallback(async () => {
    try {
      const deck = await aiService.getDeck({ limit: 100, timeout: 5000 });
      return {
        order: (deck.order || []).map(String),
        scores: deck.scores || {},
      };
    } catch (err) {
      // The deck keeps its current order if the AI service is slow or down.
      console.info("AI deck unavailable, keeping current order:", err?.message);
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchDeckRanking().then((ranking) => {
      if (!cancelled && ranking) setDeckRank(ranking);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchDeckRanking]);

  // ============================================================
  // SAVE STATE
  // ============================================================

  const [savedJobIds, setSavedJobIds] = useState(
    new Set()
  );

  const [savingJobId, setSavingJobId] = useState(null);

  // ============================================================
  // APPLICATION STATE
  // ============================================================

  const [appliedJobIds, setAppliedJobIds] = useState(
    new Set()
  );

  // ============================================================
  // ACTION STATE
  // ============================================================

  const [processingSwipe, setProcessingSwipe] =
    useState(false);

  // ============================================================
  // LOCAL ACTION HISTORY
  // ============================================================
  //
  // Used for UI information only.
  //
  // Actual swipe records are stored in PostgreSQL.
  //
  // ============================================================

  const [lastAction, setLastAction] = useState(null);

  // ============================================================
  // HELPERS
  // ============================================================

  const getJobSkills = useCallback((job) => {
    if (Array.isArray(job?.skills)) {
      return job.skills;
    }

    return String(job?.skills || "")
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);
  }, []);

  // ============================================================
  // FETCH JOBS
  // ============================================================

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = {};

      // --------------------------------------------------------
      // SEARCH
      // --------------------------------------------------------

      if (searchQuery?.trim()) {
        params.search = searchQuery.trim();
      }

      // --------------------------------------------------------
      // LOCATION
      // --------------------------------------------------------

      if (
        filters?.location &&
        filters.location !== "All"
      ) {
        params.location = filters.location;
      }

      // --------------------------------------------------------
      // SKILL
      // --------------------------------------------------------

      if (
        filters?.selectedSkill &&
        filters.selectedSkill !== "All"
      ) {
        params.skills = filters.selectedSkill;
      }

      // --------------------------------------------------------
      // EMPLOYMENT TYPE
      // --------------------------------------------------------

      if (
        filters?.jobType &&
        filters.jobType !== "All"
      ) {
        params.employment_type = filters.jobType;
      }

      // --------------------------------------------------------
      // WORK MODE
      // --------------------------------------------------------

      if (
        filters?.workMode &&
        filters.workMode !== "All"
      ) {
        params.work_mode = filters.workMode;
      }

      // --------------------------------------------------------
      // REMOTE
      // --------------------------------------------------------
      //
      // Remote is represented by work_mode in the database.
      //
      // --------------------------------------------------------

      if (
        filters?.isRemote &&
        !params.work_mode
      ) {
        params.work_mode = "Remote";
      }

      // --------------------------------------------------------
      // INTERNSHIP
      // --------------------------------------------------------

      if (
        filters?.isInternship &&
        !params.employment_type
      ) {
        params.employment_type = "Internship";
      }

      // --------------------------------------------------------
      // EXPERIENCE
      // --------------------------------------------------------

      if (
        filters?.experienceLevel &&
        filters.experienceLevel !== "All"
      ) {
        params.experience_level =
          filters.experienceLevel;
      }

      // --------------------------------------------------------
      // FRESHER FRIENDLY
      // --------------------------------------------------------
      //
      // If the filter is selected and no explicit experience
      // level has been selected, request Fresher.
      //
      // --------------------------------------------------------

      if (
        filters?.isFresherFriendly &&
        !params.experience_level
      ) {
        params.experience_level = "Fresher";
      }

      // --------------------------------------------------------
      // RECENTLY POSTED
      // --------------------------------------------------------

      if (filters?.recentlyPosted) {
        params.recently_posted = "true";
      }

      if (filters?.lowCompetition) {
        params.low_competition = "true";
      }

      console.log(
        "GET /jobs/ params:",
        params
      );

      const response =
        await jobService.getJobs(params);

      const jobs =
        Array.isArray(response?.jobs)
          ? response.jobs
          : [];

      setAllJobs(jobs);
      setIsLiveConnected(true);
    } catch (err) {
      console.error(
        "Error loading jobs:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to load jobs. Please check your connection and try again."
      );

      setIsLiveConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [
    searchQuery,
    filters,
  ]);

  // ============================================================
  // LOAD JOBS WHEN SEARCH / FILTER CHANGES
  // ============================================================

  useEffect(() => {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    fetchJobs(controller.signal);
  }, 350); // debounce

  return () => {
    clearTimeout(timeout);
    controller.abort();
  };
}, [searchQuery, filters]);

  // ============================================================
  // FETCH SWIPE HISTORY
  // ============================================================

  const fetchSwipeHistory =
    useCallback(async () => {
      try {
        const response =
          await jobService.getSwipeHistory();

        const swipes =
          Array.isArray(response?.swipes)
            ? response.swipes
            : [];

        setSwipeHistory(swipes);

        const ids = new Set(
          swipes
            .map((swipe) =>
              String(
                swipe.job_id ??
                  swipe.jobId ??
                  ""
              )
            )
            .filter(Boolean)
        );

        setSwipedJobIds(ids);
      } catch (err) {
        console.error(
          "Failed to load swipe history:",
          err
        );

        /*
         * Do not block job discovery if swipe history
         * cannot be loaded.
         */
      }
    }, []);

  useEffect(() => {
    fetchSwipeHistory();
  }, [fetchSwipeHistory]);

  // ============================================================
  // FETCH SAVED JOBS
  // ============================================================

  const fetchSavedJobs =
    useCallback(async () => {
      try {
        const response =
          await jobService.getSavedJobs();

        const jobs =
          Array.isArray(response?.saved_jobs)
            ? response.saved_jobs
            : [];

        const ids = new Set(
          jobs
            .map((item) =>
              String(
                item?.job_id ??
                  item?.id ??
                  ""
              )
            )
            .filter(Boolean)
        );

        setSavedJobIds(ids);
      } catch (err) {
        console.error(
          "Failed to load saved jobs:",
          err
        );

        /*
         * Saved jobs should not prevent the discovery
         * page from loading.
         */
      }
    }, []);

  useEffect(() => {
    fetchSavedJobs();
  }, [fetchSavedJobs]);

  // ============================================================
  // FETCH APPLICATIONS
  // ============================================================

  const fetchApplications =
    useCallback(async () => {
      try {
        const response =
          await jobService.getApplications();

        const applications =
          Array.isArray(
            response?.applications
          )
            ? response.applications
            : [];

        const ids = new Set(
          applications
            .map((application) =>
              String(
                application?.job_id ??
                  application?.jobId ??
                  ""
              )
            )
            .filter(Boolean)
        );

        setAppliedJobIds(ids);
      } catch (err) {
        console.error(
          "Failed to load applications:",
          err
        );
      }
    }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // ============================================================
  // FILTER / DISPLAY JOBS
  // ============================================================

  const filteredJobs = useMemo(() => {
    const unseen = allJobs.filter((job) => {
      if (!job?.id) {
        return false;
      }

      // --------------------------------------------------------
      // Remove already reviewed jobs
      // --------------------------------------------------------

      if (
        swipedJobIds.has(
          String(job.id)
        )
      ) {
        return false;
      }

      return true;
    });

    if (!deckRank) {
      return unseen;
    }

    // AI order (best first); jobs the AI did not rank keep their original order at the end.
    const position = new Map(deckRank.order.map((id, index) => [id, index]));

    return unseen
      .map((job) => {
        const score = deckRank.scores[String(job.id)];
        return score === undefined ? job : { ...job, match_score: score };
      })
      .sort(
        (a, b) =>
          (position.get(String(a.id)) ?? Number.MAX_SAFE_INTEGER) -
          (position.get(String(b.id)) ?? Number.MAX_SAFE_INTEGER)
      );
  }, [
    allJobs,
    swipedJobIds,
    deckRank,
  ]);

  // ============================================================
  // ACTIVE CARD STACK
  // ============================================================

  const activeStack = useMemo(
    () =>
      filteredJobs.slice(0, 3),
    [filteredJobs]
  );

  const currentCard =
    activeStack[0] || null;

  // ============================================================
  // SAVE / UNSAVE
  // ============================================================

  const handleSaveJob =
    useCallback(
      async (job) => {
        if (
          !job?.id ||
          savingJobId !== null
        ) {
          return;
        }

        const jobId =
          String(job.id);

        const alreadySaved =
          savedJobIds.has(jobId);

        setSavingJobId(job.id);

        try {
          // ====================================================
          // UNSAVE
          // ====================================================

          if (alreadySaved) {
            await jobService.unsaveJob(
              job.id
            );

            setSavedJobIds(
              (previous) => {
                const next =
                  new Set(previous);

                next.delete(jobId);

                return next;
              }
            );

            addToast(
              "Job removed from saved jobs.",
              "info"
            );

            return;
          }

          // ====================================================
          // SAVE
          // ====================================================

          await jobService.saveJob(
            job.id
          );

          setSavedJobIds(
            (previous) => {
              const next =
                new Set(previous);

              next.add(jobId);

              return next;
            }
          );

          addToast(
            "Job saved successfully.",
            "success"
          );

          fetchDeckRanking().then((ranking) => ranking && setDeckRank(ranking));
        } catch (err) {
          console.error(
            "Save job error:",
            err
          );

          addToast(
            err.response?.data?.message ||
              "Unable to update saved job.",
            "error"
          );
        } finally {
          setSavingJobId(null);
        }
      },
      [
        savedJobIds,
        savingJobId,
        addToast,
        fetchDeckRanking,
      ]
    );

  // ============================================================
  // SWIPE LEFT = SKIP
  // ============================================================

  const handleBackendSwipeLeft =
    useCallback(
      async (job) => {
        if (
          !job?.id ||
          processingSwipe
        ) {
          return;
        }

        setProcessingSwipe(true);

        try {
          const response =
            await jobService.swipeJob(
              job.id,
              "LEFT"
            );

          console.log(
            "SKIP response:",
            response
          );

          const jobId =
            String(job.id);

          // Re-rank the deck with this swipe included, then update everything in one render.
          const nextRanking = await fetchDeckRanking();
          if (nextRanking) {
            setDeckRank(nextRanking);
          }

          // ----------------------------------------------------
          // Remove from current deck immediately
          // ----------------------------------------------------

          setSwipedJobIds(
            (previous) => {
              const next =
                new Set(previous);

              next.add(jobId);

              return next;
            }
          );

          setSwipeHistory(
            (previous) => [
              {
                job_id: job.id,
                action: "LEFT",
              },
              ...previous,
            ]
          );

          setLastAction({
            jobId: job.id,
            action: "LEFT",
          });

          addToast(
            "Job skipped.",
            "info"
          );
        } catch (err) {
          console.error(
            "Failed to skip job:",
            err
          );

          addToast(
            err.response?.data?.message ||
              "Unable to skip this job.",
            "error"
          );
        } finally {
          setProcessingSwipe(false);
        }
      },
      [
        processingSwipe,
        addToast,
        fetchDeckRanking,
      ]
    );

  // ============================================================
  // SWIPE RIGHT = APPLY
  // ============================================================

  const handleBackendSwipeRight =
    useCallback(
      async (job) => {
        if (
          !job?.id ||
          processingSwipe
        ) {
          return;
        }

        setProcessingSwipe(true);

        try {
          /*
           * IMPORTANT:
           *
           * Backend /swipe with RIGHT performs BOTH:
           *
           * 1. swipes -> RIGHT
           * 2. applications -> Applied
           *
           * Therefore we do NOT call applyJob() here.
           */

          const response =
            await jobService.swipeJob(
              job.id,
              "RIGHT"
            );

          console.log(
            "APPLY response:",
            response
          );

          const jobId =
            String(job.id);

          // Re-rank the deck with this swipe included, then update everything in one render.
          const nextRanking = await fetchDeckRanking();
          if (nextRanking) {
            setDeckRank(nextRanking);
          }

          // ----------------------------------------------------
          // Remove from discovery
          // ----------------------------------------------------

          setSwipedJobIds(
            (previous) => {
              const next =
                new Set(previous);

              next.add(jobId);

              return next;
            }
          );

          // ----------------------------------------------------
          // Mark as applied
          // ----------------------------------------------------

          setAppliedJobIds(
            (previous) => {
              const next =
                new Set(previous);

              next.add(jobId);

              return next;
            }
          );

          // ----------------------------------------------------
          // Update local history
          // ----------------------------------------------------

          setSwipeHistory(
            (previous) => [
              {
                job_id: job.id,
                action: "RIGHT",
              },
              ...previous,
            ]
          );

          setLastAction({
            jobId: job.id,
            action: "RIGHT",
          });

          addToast(
            "Application submitted successfully!",
            "success"
          );
        } catch (err) {
          console.error(
            "Failed to apply through swipe:",
            err
          );

          addToast(
            err.response?.data?.message ||
              "Unable to apply for this job.",
            "error"
          );
        } finally {
          setProcessingSwipe(false);
        }
      },
      [
        processingSwipe,
        addToast,
        fetchDeckRanking,
      ]
    );

  // ============================================================
  // LEFT CONTROL
  // ============================================================

  const swipeLeftFromControl =
    useCallback(() => {
      if (
        !currentCard ||
        processingSwipe
      ) {
        return;
      }

      handleBackendSwipeLeft(
        currentCard
      );
    }, [
      currentCard,
      processingSwipe,
      handleBackendSwipeLeft,
    ]);

  // ============================================================
  // RIGHT CONTROL
  // ============================================================

  const swipeRightFromControl =
    useCallback(() => {
      if (
        !currentCard ||
        processingSwipe
      ) {
        return;
      }

      handleBackendSwipeRight(
        currentCard
      );
    }, [
      currentCard,
      processingSwipe,
      handleBackendSwipeRight,
    ]);

  // ============================================================
  // SAVE CONTROL
  // ============================================================

  const saveCurrentJob =
    useCallback(() => {
      if (
        !currentCard ||
        savingJobId !== null
      ) {
        return;
      }

      handleSaveJob(
        currentCard
      );
    }, [
      currentCard,
      savingJobId,
      handleSaveJob,
    ]);

  // ============================================================
  // KEYBOARD CONTROLS
  // ============================================================

  useEffect(() => {
    const handleKeyDown = (event) => {
      const target =
        document.activeElement;

      // Don't intercept typing
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT"
      ) {
        return;
      }

      // Don't control deck when modal is open
      if (
        isFilterModalOpen ||
        applyModalJob
      ) {
        return;
      }

      if (!currentCard) {
        return;
      }

      // --------------------------------------------------------
      // LEFT = SKIP
      // --------------------------------------------------------

      if (
        event.key === "ArrowLeft"
      ) {
        event.preventDefault();

        swipeLeftFromControl();

        return;
      }

      // --------------------------------------------------------
      // RIGHT = APPLY
      // --------------------------------------------------------

      if (
        event.key === "ArrowRight"
      ) {
        event.preventDefault();

        swipeRightFromControl();

        return;
      }

      // --------------------------------------------------------
      // S = SAVE
      // --------------------------------------------------------

      if (
        event.key === "s" ||
        event.key === "S"
      ) {
        event.preventDefault();

        saveCurrentJob();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    currentCard,
    swipeLeftFromControl,
    swipeRightFromControl,
    saveCurrentJob,
    isFilterModalOpen,
    applyModalJob,
  ]);

  // ============================================================
  // REFRESH DISCOVERY
  // ============================================================

  const handleRefresh =
    useCallback(async () => {
      await Promise.all([
        fetchJobs(),
        fetchSwipeHistory(),
        fetchSavedJobs(),
        fetchApplications(),
      ]);

      setLastAction(null);

      addToast(
        "Jobs refreshed.",
        "success"
      );
    }, [
      fetchJobs,
      fetchSwipeHistory,
      fetchSavedJobs,
      fetchApplications,
      addToast,
    ]);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="flex flex-col min-h-[calc(100dvh-4rem)] w-full bg-slate-50/60 dark:bg-zinc-950/60 pb-6 select-none">

      <div className="flex-1 flex flex-col w-full max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-5">

        {/* ======================================================
            STATUS BAR
        ====================================================== */}

        <div className="flex items-center justify-between mb-3 px-1">

          {/* STATUS */}

          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-zinc-200 shadow-sm">

            {isLiveConnected ? (
              <>
                <Radio className="h-3 w-3 text-brand-600 dark:text-brand-400 animate-pulse" />

                <span className="text-[11px] sm:text-xs">
                  Live Matches
                </span>
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3 text-brand-600 dark:text-brand-400" />

                <span className="text-[11px] sm:text-xs">
                  Smart Discovery
                </span>
              </>
            )}

            <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-zinc-600" />

            <span
             id="job-results-count"
             className="text-[11px] sm:text-xs text-slate-500 dark:text-zinc-400 font-normal">
              {filteredJobs.length}{" "}
              {filteredJobs.length === 1
                ? "role"
                : "roles"}
            </span>

          </div>

          {/* REFRESH */}

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-medium text-slate-600 dark:text-zinc-300 shadow-sm hover:border-brand-300 hover:text-brand-700 dark:hover:text-brand-300 hover:bg-brand-50/50 dark:hover:bg-brand-500/10 active:scale-95 transition-all disabled:opacity-50"
          >
            <RotateCcw
              className={`w-3.5 h-3.5 ${
                isLoading
                  ? "animate-spin"
                  : ""
              }`}
            />

            <span className="hidden sm:inline">
              Refresh
            </span>
          </button>
        </div>

        {/* ======================================================
            LOADING
        ====================================================== */}

        {isLoading && (
          <div className="flex-1 flex flex-col justify-center items-center w-full min-h-[460px] max-h-[640px] bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/80 dark:border-zinc-800/80 shadow-sm p-8">

            <Loader2 className="w-8 h-8 text-brand-600 dark:text-brand-400 animate-spin mb-3" />

            <p className="text-sm font-semibold text-slate-600 dark:text-zinc-300">
              Loading job opportunities...
            </p>

            <p className="text-xs text-slate-400 mt-1">
              Finding roles from SwipeX
            </p>

          </div>
        )}

        {/* ======================================================
            ERROR
        ====================================================== */}

        {!isLoading && error && (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[460px] bg-white dark:bg-zinc-900 rounded-3xl border border-rose-100 dark:border-rose-500/20 shadow-sm p-6 text-center">

            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-zinc-50">
              Failed to load jobs
            </h3>

            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mt-1 mb-5">
              {error}
            </p>

            <button
              type="button"
              onClick={fetchJobs}
              className="py-2.5 px-5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm active:scale-95 transition-all"
            >
              Retry Connection
            </button>

          </div>
        )}

        {/* ======================================================
            DECK
        ====================================================== */}

        {!isLoading &&
          !error && (
            <div className="flex-1 flex flex-col items-center justify-center w-full">

              {activeStack.length > 0 ? (

                <div className="relative w-full flex items-center justify-center">

                  {/* =================================================
                      DESKTOP SKIP
                  ================================================= */}

                  <button
                    type="button"
                    onClick={
                      swipeLeftFromControl
                    }
                    disabled={
                      processingSwipe
                    }
                    aria-label="Skip job"
                    title="Skip job"
                    className="hidden lg:flex absolute left-2 xl:left-6 z-40 h-13 w-13 items-center justify-center rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-400 shadow-lg transition-all hover:border-rose-200 dark:hover:border-rose-500/20 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
                  </button>

                  {/* =================================================
                      CARD STACK
                  ================================================= */}

                  <div className="relative w-full max-w-xl h-[min(65vh,580px)] min-h-[480px]">

                    <AnimatePresence mode="popLayout">

                      {/* BACK CARD */}

                      {activeStack.length > 2 && (
                        <JobCard
                          key={`stack-2-${activeStack[2].id}`}
                          job={
                            activeStack[2]
                          }
                          isFront={false}
                          stackIndex={2}
                        />
                      )}

                      {/* MIDDLE CARD */}

                      {activeStack.length > 1 && (
                        <JobCard
                          key={`stack-1-${activeStack[1].id}`}
                          job={
                            activeStack[1]
                          }
                          isFront={false}
                          stackIndex={1}
                        />
                      )}

                      {/* FRONT CARD */}

                      <JobCard
                        key={
                          activeStack[0].id
                        }
                        job={
                          activeStack[0]
                        }
                        isFront={true}
                        stackIndex={0}

                        onSwipeLeft={
                          handleBackendSwipeLeft
                        }

                        onSwipeRight={
                          handleBackendSwipeRight
                        }

                        onSave={
                          handleSaveJob
                        }

                        onApply={
                          setApplyModalJob
                        }

                        isSaved={savedJobIds.has(
                          String(
                            activeStack[0].id
                          )
                        )}

                        isSaving={
                          savingJobId ===
                          activeStack[0].id
                        }

                        isApplied={appliedJobIds.has(
                          String(
                            activeStack[0].id
                          )
                        )}
                      />

                    </AnimatePresence>

                  </div>

                  {/* =================================================
                      DESKTOP APPLY
                  ================================================= */}

                  <button
                    type="button"
                    onClick={
                      swipeRightFromControl
                    }
                    disabled={
                      processingSwipe
                    }
                    aria-label="Apply for job"
                    title="Apply for job"
                    className="hidden lg:flex absolute right-2 xl:right-6 z-40 h-13 w-13 items-center justify-center rounded-2xl border border-brand-500 bg-brand-600 text-white shadow-lg transition-all hover:bg-brand-700 hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    <ChevronRight className="w-6 h-6 stroke-[2.5]" />
                  </button>

                </div>

              ) : (

                /* ==================================================
                   EMPTY STATE
                   ================================================== */

                <div className="flex flex-col items-center justify-center w-full max-w-lg min-h-[460px] bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/80 dark:border-zinc-800/80 shadow-sm p-8 text-center">

                  <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-3">
                    <Inbox className="w-7 h-7" />
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-50">
                    You're all caught up!
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-xs mt-1 mb-6 leading-relaxed">
                    No more jobs match your
                    current search and filters,
                    or you have already reviewed
                    all available roles.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2.5 w-full">

                    <button
                      id="btn-open-filters"
                      type="button"
                      onClick={() =>
                        setIsFilterModalOpen(
                          true
                        )
                      }
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-bold rounded-xl transition-all"
                    >
                      <SlidersHorizontal className="w-4 h-4" />

                      Filters
                    </button>

                    <button
                      type="button"
                      onClick={
                        handleRefresh
                      }
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-all"
                    >
                      <RotateCcw className="w-4 h-4" />

                      Refresh Jobs
                    </button>

                  </div>

                </div>
              )}

              {/* ==================================================
                  MOBILE CONTROLS
              ================================================== */}

              {activeStack.length > 0 && (
                <div className="flex lg:hidden items-center justify-center gap-5 mt-4">

                  {/* =================================================
                      SKIP
                  ================================================= */}

                  <button
                    type="button"
                    onClick={
                      swipeLeftFromControl
                    }
                    disabled={
                      processingSwipe
                    }
                    aria-label="Skip job"
                    title="Skip job"
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-rose-500 shadow-md active:scale-90 transition-transform disabled:opacity-50"
                  >
                    <X className="w-5 h-5 stroke-[2.5]" />
                  </button>

                  {/* =================================================
                      SAVE
                  ================================================= */}

                  <button
                    type="button"
                    onClick={
                      saveCurrentJob
                    }
                    disabled={
                      savingJobId ===
                      currentCard?.id
                    }
                    aria-label={
                      savedJobIds.has(
                        String(
                          currentCard?.id
                        )
                      )
                        ? "Unsave job"
                        : "Save job"
                    }
                    title={
                      savedJobIds.has(
                        String(
                          currentCard?.id
                        )
                      )
                        ? "Unsave job"
                        : "Save job"
                    }
                    className={`flex h-12 w-12 items-center justify-center rounded-full border shadow-md active:scale-90 transition-transform disabled:opacity-50 ${
                      savedJobIds.has(
                        String(
                          currentCard?.id
                        )
                      )
                        ? "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400"
                        : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300"
                    }`}
                  >
                    <Bookmark
                      className={`w-5 h-5 ${
                        savedJobIds.has(
                          String(
                            currentCard?.id
                          )
                        )
                          ? "fill-current"
                          : ""
                      }`}
                    />
                  </button>

                  {/* =================================================
                      APPLY
                  ================================================= */}

                  <button
                    type="button"
                    onClick={
                      swipeRightFromControl
                    }
                    disabled={
                      processingSwipe
                    }
                    aria-label="Apply for job"
                    title="Apply for job"
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white shadow-md shadow-brand-600/30 active:scale-90 transition-transform disabled:opacity-50"
                  >
                    <Heart className="w-5 h-5 fill-current" />
                  </button>

                </div>
              )}
            </div>
          )}

        {/* ======================================================
            FOOTER
        ====================================================== */}

        <div className="mt-4 flex items-center justify-center text-[11px] text-slate-400">

          <span className="hidden lg:inline-flex items-center gap-1.5">
            <Keyboard className="w-3.5 h-3.5" />

            ← Skip • → Apply • S Save
          </span>

          <span className="inline-flex lg:hidden text-center">
            Swipe left to skip • Swipe right to apply •
            Bookmark to save
          </span>

        </div>

      </div>
    </div>
  );
}

export default DiscoverPage;