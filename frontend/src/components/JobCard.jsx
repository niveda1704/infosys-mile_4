import React, { useState, useRef } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
} from "motion/react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  IndianRupee,
  Briefcase,
  Clock,
  Bookmark,
  Send,
  X,
  Building,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Users,
  Globe2,
} from "lucide-react";

import { JobBadge } from "./JobBadge";
import { MatchScore } from "./MatchScore";
import { CompetitionBadge } from "./CompetitionBadge";

// ============================================================
// SWIPE CONFIGURATION
// ============================================================
export const SWIPE_THRESHOLD = 110;
export const VELOCITY_THRESHOLD = 360;

// ============================================================
// JOB CARD
// ============================================================
export function JobCard({
  job,
  isFront = true,
  stackIndex = 0,
  onSwipeLeft,
  onSwipeRight,
  onSave,
  onApply,
  isSaved = false,
}) {
  const navigate = useNavigate();
  const [isExiting, setIsExiting] = useState(false);
  const cardRef = useRef(null);

  // Motion values
  const x = useMotionValue(0);
  const rotate = useTransform(
    x,
    [-SWIPE_THRESHOLD * 2, 0, SWIPE_THRESHOLD * 2],
    [-7, 0, 7]
  );

  // Swipe indicators
  const skipOpacity = useTransform(x, [-20, -SWIPE_THRESHOLD], [0, 1]);
  const skipScale = useTransform(x, [-20, -SWIPE_THRESHOLD], [0.9, 1.05]);

  const likeOpacity = useTransform(x, [20, SWIPE_THRESHOLD], [0, 1]);
  const likeScale = useTransform(x, [20, SWIPE_THRESHOLD], [0.9, 1.05]);

  // ============================================================
  // NORMALIZE DATA — mapped to the actual Job Service API fields
  // (employment_type, experience_level, work_mode, etc.)
  // ============================================================

  const skills = Array.isArray(job?.skills)
    ? job.skills
    : String(job?.skills || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

  const highlights = Array.isArray(job?.highlights) ? job.highlights : [];

  const matchPercentage = Number(
    job?.matchPercentage ?? job?.match_score ?? job?.matchScore ?? 0
  );

  const applicantCount = job?.applicant_count ?? job?.applicantCount ?? job?.applicants ?? 0;

  // Real backend fields, with old camelCase names kept as fallback
  // in case some other source (mock data, recommendations service)
  // still sends them that way.
  const employmentType = job?.employment_type ?? job?.jobType ?? null;
  const experienceLevel = job?.experience_level ?? job?.experience ?? null;
  const workMode = job?.work_mode ?? null;

  const isRemoteJob =
    typeof workMode === "string" && workMode.toLowerCase() === "remote";

  const isInternshipJob =
    (typeof employmentType === "string" &&
      employmentType.toLowerCase() === "internship") ||
    Boolean(job?.isInternship);

  const isFresherJob =
    (typeof experienceLevel === "string" &&
      experienceLevel.toLowerCase().includes("fresher")) ||
    Boolean(job?.isFresherFriendly || job?.isFresher);

  // Programmatic left swipe
  const triggerSwipeLeft = async () => {
    if (isExiting || !job || !isFront) return;
    setIsExiting(true);
    const targetX = -Math.max(window.innerWidth * 0.9, 650);
    await animate(x, targetX, {
      duration: 0.26,
      ease: [0.32, 0.72, 0, 1],
    });
    onSwipeLeft?.(job);
  };

  // Programmatic right swipe
  const triggerSwipeRight = async () => {
    if (isExiting || !job || !isFront) return;
    setIsExiting(true);
    const targetX = Math.max(window.innerWidth * 0.9, 650);
    await animate(x, targetX, {
      duration: 0.26,
      ease: [0.32, 0.72, 0, 1],
    });
    onSwipeRight?.(job);
  };

  // Drag handler
  const handleDragEnd = async (_event, info) => {
    if (isExiting || !isFront) return;

    const offsetX = info.offset.x;
    const velocityX = info.velocity.x;

    const isLeftSwipe =
      offsetX < -SWIPE_THRESHOLD ||
      (offsetX < -40 && velocityX < -VELOCITY_THRESHOLD);

    const isRightSwipe =
      offsetX > SWIPE_THRESHOLD ||
      (offsetX > 40 && velocityX > VELOCITY_THRESHOLD);

    if (isLeftSwipe) {
      setIsExiting(true);
      const targetX = -Math.max(window.innerWidth * 0.9, 650);
      await animate(x, targetX, {
        duration: 0.22,
        ease: [0.32, 0.72, 0, 1],
      });
      onSwipeLeft?.(job);
      return;
    }

    if (isRightSwipe) {
      setIsExiting(true);
      const targetX = Math.max(window.innerWidth * 0.9, 650);
      await animate(x, targetX, {
        duration: 0.22,
        ease: [0.32, 0.72, 0, 1],
      });
      onSwipeRight?.(job);
      return;
    }

    // Return card smoothly
    await animate(x, 0, {
      type: "spring",
      stiffness: 450,
      damping: 28,
      mass: 0.8,
    });
  };

  const handleDetailsClick = (event) => {
    event.stopPropagation();
    navigate(`/jobs/${job.id}`);
  };

  // ==========================================================
  // BACKGROUND STACK CARD
  // ==========================================================
  if (!isFront) {
    const scale = stackIndex === 1 ? 0.97 : 0.94;
    const translateY = stackIndex === 1 ? 12 : 24;

    return (
      <motion.div
        className="absolute inset-0 w-full h-full bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-zinc-800/90 shadow-sm overflow-hidden pointer-events-none"
        animate={{ scale, y: translateY }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        style={{ zIndex: 10 - stackIndex }}
        aria-hidden="true"
      >
        <div className="h-full p-4 sm:p-6 flex flex-col justify-between opacity-70">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800/80 p-1 flex items-center justify-center overflow-hidden shrink-0">
                {job.logo ? (
                  <img
                    src={job.logo}
                    alt=""
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Building className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300 truncate">
                  {job.company || "Company"}
                </p>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-50 truncate">
                  {job.title || "Job Opportunity"}
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="p-2.5 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-100 dark:border-zinc-800 text-xs text-slate-700 dark:text-zinc-200 truncate">
                {isRemoteJob ? "Remote" : job.location || "Location"}
              </div>
              <div className="p-2.5 bg-brand-50/70 dark:bg-brand-500/10 rounded-xl border border-brand-100 dark:border-brand-500/20 text-xs font-bold text-brand-800 dark:text-brand-300 truncate">
                {job.salary || "Salary"}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100 dark:border-zinc-800">
            <span>{employmentType || "Full Time"}</span>
            <span>{experienceLevel || "Experience"}</span>
          </div>
        </div>
      </motion.div>
    );
  }

  // ==========================================================
  // FRONT CARD
  // ==========================================================
  return (
    <motion.div
  ref={cardRef}
  style={{
    x,
    rotate,
    zIndex: 30,
    touchAction: "pan-y",
  }}
  drag="x"
  dragConstraints={{ left: 0, right: 0 }}
  dragElastic={0.72}
  dragMomentum={false}
  onDragEnd={handleDragEnd}
  layout
  transition={{ type: "spring", stiffness: 450, damping: 28 }}
  className="absolute inset-0 w-full h-full bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-zinc-800/90 shadow-xl overflow-hidden select-none flex flex-col cursor-grab active:cursor-grabbing"
  id={`job-card-${job.id}`}
  data-testid="job-card"
  tabIndex={0}
  role="region"
  aria-label={`${job.title} at ${job.company}`}
>
      {/* ======================================================
          SWIPE OVERLAY INDICATORS
      ====================================================== */}
      <motion.div
        style={{ opacity: likeOpacity, scale: likeScale }}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-40 pointer-events-none rotate-6 bg-brand-600 text-white px-3 sm:px-4 py-1.5 rounded-xl font-extrabold text-xs sm:text-sm tracking-wider uppercase border-2 border-white dark:border-zinc-800 shadow-lg flex items-center gap-1.5"
      >
        <Sparkles className="w-4 h-4 text-brand-200" />
        <span>Interested</span>
      </motion.div>

      <motion.div
        style={{ opacity: skipOpacity, scale: skipScale }}
        className="absolute top-4 left-4 sm:top-6 sm:left-6 z-40 pointer-events-none -rotate-6 bg-rose-500 text-white px-3 sm:px-4 py-1.5 rounded-xl font-extrabold text-xs sm:text-sm tracking-wider uppercase border-2 border-white dark:border-zinc-800 shadow-lg flex items-center gap-1.5"
      >
        <X className="w-4 h-4 text-rose-200" />
        <span>Skip</span>
      </motion.div>

      {/* ======================================================
          SCROLLABLE CARD BODY
      ====================================================== */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain flex flex-col lg:flex-row">
        {/* ====================================================
            COMPANY INFO (TOP ON MOBILE / LEFT SIDEBAR ON LAPTOP)
        ==================================================== */}
        <div className="lg:w-[32%] xl:w-[30%] shrink-0 p-4 sm:p-5 lg:p-7 bg-slate-50/70 dark:bg-zinc-950/70 border-b lg:border-b-0 lg:border-r border-slate-200/80 dark:border-zinc-800/80 flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center lg:flex-col lg:items-start gap-3 lg:gap-4">
              {/* Company Logo */}
              <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-18 lg:h-18 rounded-xl lg:rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 shadow-xs p-1.5 flex items-center justify-center overflow-hidden shrink-0">
                {job.logo ? (
                  <img
                    src={job.logo}
                    alt={`${job.company || "Company"} logo`}
                    className="w-full h-full object-cover rounded-lg lg:rounded-xl"
                  />
                ) : (
                  <Building className="w-6 h-6 lg:w-8 lg:h-8 text-brand-600 dark:text-brand-400" />
                )}
              </div>

              {/* Title & Company */}
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300 truncate">
                  {job.company || "Company"}
                </p>
                <h2 data-testid="swipe-card-title" className="text-base sm:text-lg lg:text-xl font-extrabold text-slate-900 dark:text-zinc-50 leading-tight line-clamp-2 mt-0.5">
                  {job.title || "Job Opportunity"}
                </h2>
                {job.companyType && (
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium mt-1 truncate">
                    {job.companyType}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Match Score & Time Info */}
          <div className="flex flex-row lg:flex-col gap-3">
            <div className="flex-1 flex items-center justify-between p-2.5 sm:p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800/80 shadow-2xs">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Profile Fit
                </p>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                  Suitability
                </p>
              </div>
              <MatchScore score={matchPercentage} size="pill" />
            </div>

            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 px-1">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>
                {job.postedAgo || job.postedTime || "Recently posted"}
              </span>
            </div>
          </div>
        </div>

        {/* ====================================================
            RIGHT DETAILS / METRICS PANEL
        ==================================================== */}
        <div className="flex-1 min-w-0 p-4 sm:p-5 lg:p-7 flex flex-col justify-between space-y-4 sm:space-y-5">
          <div>
            {/* KEY METRICS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5 mb-4">
              <div className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-100 dark:border-zinc-800 min-w-0">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] sm:text-[10px] uppercase font-semibold text-slate-400 truncate">
                    Location
                  </p>
                  <p className="text-xs font-bold text-slate-800 dark:text-zinc-100 truncate">
                    {job.location || "Not specified"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 bg-brand-50/60 dark:bg-brand-500/10 rounded-xl border border-brand-100 dark:border-brand-500/20 min-w-0">
                <IndianRupee className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] sm:text-[10px] uppercase font-semibold text-brand-700 dark:text-brand-300 truncate">
                    Salary / CTC
                  </p>
                  <p className="text-xs font-extrabold text-brand-900 dark:text-brand-300 truncate">
                    {job.salary || "Competitive"}
                  </p>
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1 flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-100 dark:border-zinc-800 min-w-0">
                <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] sm:text-[10px] uppercase font-semibold text-slate-400 truncate">
                    Experience
                  </p>
                  <p className="text-xs font-bold text-slate-800 dark:text-zinc-100 truncate">
                    {experienceLevel || "Not specified"}
                  </p>
                </div>
              </div>

              {/* WORK MODE — new tile so Remote/Hybrid/On-site is unambiguous */}
              <div className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-100 dark:border-zinc-800 min-w-0">
                <Globe2 className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] sm:text-[10px] uppercase font-semibold text-slate-400 truncate">
                    Work Mode
                  </p>
                  <p className="text-xs font-bold text-slate-800 dark:text-zinc-100 truncate">
                    {workMode || "Not specified"}
                  </p>
                </div>
              </div>
            </div>

            {/* BADGES */}
            <div className="flex flex-wrap items-center gap-1.5 pb-3 border-b border-slate-100 dark:border-zinc-800">
              {employmentType && (
                <JobBadge type="fulltime" text={employmentType} size="sm" />
              )}
              {isRemoteJob && (
                <JobBadge type="remote" text="Remote" size="sm" />
              )}
              {isFresherJob && (
                <JobBadge type="fresher" text="Fresher" size="sm" />
              )}
              {isInternshipJob && (
                <JobBadge type="internship" text="Internship" size="sm" />
              )}
              {job.isNewlyFounded && (
                <JobBadge type="newly-founded" text="Startup" size="sm" />
              )}
              {job.competition && (
                <JobBadge
                  type="low-competition"
                  text={`${job.competition} Comp`}
                  size="sm"
                />
              )}
            </div>

            {/* DESCRIPTION */}
            <div className="mt-3 sm:mt-4">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-50">
                  Role Overview
                </h3>
                <CompetitionBadge job={job} className="justify-end" />
              </div>
              <p className="text-xs sm:text-[13px] text-slate-600 dark:text-zinc-300 leading-relaxed line-clamp-3 sm:line-clamp-4">
                {job.description || "No job description available."}
              </p>
            </div>

            {/* SKILLS */}
            {skills.length > 0 && (
              <div className="mt-3 sm:mt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Core Skills
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {skills.slice(0, 7).map((skill, index) => (
                    <span
                      key={`${skill}-${index}`}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 rounded-lg text-xs font-medium border border-slate-200/70 dark:border-zinc-800/70"
                    >
                      {skill}
                    </span>
                  ))}
                  {skills.length > 7 && (
                    <span className="px-2 py-1 text-slate-400 text-xs font-medium">
                      +{skills.length - 7} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* HIGHLIGHTS */}
            {highlights.length > 0 && (
              <div className="mt-3 sm:mt-4 p-3 bg-brand-50/60 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/20 rounded-xl space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-brand-800 dark:text-brand-300">
                  Perks & Highlights
                </p>
                {highlights.slice(0, 2).map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-1.5 text-xs text-brand-900 dark:text-brand-300"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* VIEW DETAILS LINK */}
          <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
            <button
              type="button"
              onClick={handleDetailsClick}
              className="text-xs font-bold text-brand-700 dark:text-brand-300 hover:text-brand-800 dark:hover:text-brand-300 flex items-center gap-1 group py-1"
            >
              <span>View full job details</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <span className="text-[11px] text-slate-400 flex items-center gap-1 lg:hidden">
              <Clock className="w-3 h-3" />
              {job.postedAgo || job.postedTime || "Recent"}
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================
          ACTION FOOTER
      ====================================================== */}
      <div className="shrink-0 p-2.5 sm:p-3.5 lg:p-4 bg-slate-50 dark:bg-zinc-950 border-t border-slate-200/80 dark:border-zinc-800/80 flex items-center gap-2 sm:gap-3">
        {/* SKIP */}
        <button
          type="button"
          onClick={triggerSwipeLeft}
          id="btn-card-skip"
          aria-label="Skip this job"
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white dark:bg-zinc-900 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-700 dark:text-zinc-200 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200/90 dark:border-zinc-800/90 hover:border-rose-200 dark:hover:border-rose-500/20 rounded-xl font-bold text-xs sm:text-sm shadow-2xs transition-all active:scale-95"
        >
          <X className="w-4 h-4 text-rose-500" />
          <span>Skip</span>
        </button>

        {/* INTERESTED / SAVE */}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSave?.(job);
          }}
          id="btn-card-save"
          aria-label={isSaved ? "Unsave this job" : "Save this job"}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm shadow-2xs transition-all active:scale-95 border ${
            isSaved
              ? "bg-brand-50 dark:bg-brand-500/10 border-brand-300 text-brand-800 dark:text-brand-300"
              : "bg-white dark:bg-zinc-900 hover:bg-brand-50 dark:hover:bg-brand-500/10 text-slate-700 dark:text-zinc-200 hover:text-brand-700 dark:hover:text-brand-300 border-slate-200/90 dark:border-zinc-800/90 hover:border-brand-200 dark:hover:border-brand-500/20"
          }`}
        >
          <Bookmark
            className={`w-4 h-4 ${
              isSaved ? "fill-brand-600 text-brand-600 dark:text-brand-400" : "text-brand-600 dark:text-brand-400"
            }`}
          />
          <span>{isSaved ? "Saved" : "Save"}</span>
        </button>

        {/* APPLY NOW */}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onApply?.(job);
          }}
          id="btn-card-apply"
          aria-label="Apply now"
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-2xs shadow-brand-600/20 transition-all active:scale-95"
        >
          <Send className="w-4 h-4" />
          <span>Apply</span>
        </button>
      </div>
    </motion.div>
  );
}

export default JobCard;