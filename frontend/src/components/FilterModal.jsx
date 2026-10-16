import React, { useEffect, useState } from "react";
import { X, Check, RotateCcw, SlidersHorizontal } from "lucide-react";

import { useApp } from "../context/AppContext";

// ============================================================
// FILTER OPTIONS
// ============================================================

const SKILL_OPTIONS = [
  "All",
  "Java",
  "Spring Boot",
  "React",
  "JavaScript",
  "TypeScript",
  "Python",
  "FastAPI",
  "Node.js",
  "SQL",
  "PostgreSQL",
  "AWS",
  "Docker",
  "Kubernetes",
  "Machine Learning",
  "PyTorch",
  "TensorFlow",
  "Git",
];

const LOCATION_OPTIONS = [
  "All",
  "Bengaluru",
  "Hyderabad",
  "Pune",
  "Chennai",
  "Gurgaon",
  "Noida",
  "Mumbai",
  "Ranchi",
  "Kolkata",
  "Remote India",
];

const EMPLOYMENT_OPTIONS = ["All", "Full Time", "Internship"];

const WORK_MODE_OPTIONS = ["All", "Remote", "Hybrid", "On-site"];

const EXPERIENCE_OPTIONS = [
  "All",
  "Fresher",
  "0-2 years",
  "1-3 years",
  "2-4 years",
  "3-5 years",
];

// ============================================================
// SAFE FILTER DEFAULTS
// ============================================================

const getSafeFilters = (filters = {}) => ({
  ...filters,

  location: filters.location || "All",

  jobType: filters.jobType || "All",

  workMode: filters.workMode || "All",

  experienceLevel: filters.experienceLevel || "All",

  selectedSkill: filters.selectedSkill || "All",

  isRemote: Boolean(filters.isRemote),

  isInternship: Boolean(filters.isInternship),

  recentlyPosted: Boolean(filters.recentlyPosted),
  lowCompetition: Boolean(filters.lowCompetition),
});

// ============================================================
// FILTER MODAL
// ============================================================

export function FilterModal() {
  const {
    isFilterModalOpen,
    setIsFilterModalOpen,
    filters,
    setFilters,
    resetFilters,
    addToast,
  } = useApp();

  // ==========================================================
  // LOCAL STATE
  // ==========================================================

  const [localFilters, setLocalFilters] = useState(getSafeFilters(filters));

  // ==========================================================
  // SYNC WHEN MODAL OPENS
  // ==========================================================

  useEffect(() => {
    if (isFilterModalOpen) {
      setLocalFilters(getSafeFilters(filters));
    }
  }, [isFilterModalOpen, filters]);

  // ==========================================================
  // UPDATE HELPER
  // ==========================================================

  const updateFilter = (key, value) => {
    setLocalFilters((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  // ==========================================================
  // EMPLOYMENT TYPE
  // ==========================================================

  const handleEmploymentType = (value) => {
    setLocalFilters((previous) => ({
      ...previous,

      jobType: value,

      isInternship: value === "Internship",
    }));
  };

  // ==========================================================
  // WORK MODE
  // ==========================================================

  const handleWorkMode = (value) => {
    setLocalFilters((previous) => ({
      ...previous,

      workMode: value,

      isRemote: value === "Remote",
    }));
  };

  // ==========================================================
  // SKILL
  // ==========================================================

  const handleSkill = (skill) => {
    updateFilter("selectedSkill", skill);
  };

  // ==========================================================
  // APPLY
  // ==========================================================

  const handleApply = () => {
    setFilters(localFilters);

    setIsFilterModalOpen(false);

    addToast("Job search filters applied", "success");
  };

  // ==========================================================
  // CLEAR
  // ==========================================================

  const handleClear = () => {
    resetFilters();

    setIsFilterModalOpen(false);
  };

  // ==========================================================
  // CLOSED
  // ==========================================================

  if (!isFilterModalOpen) {
    return null;
  }

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 dark:bg-zinc-800/50 backdrop-blur-xs flex items-center justify-center p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          setIsFilterModalOpen(false);
        }
      }}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-slate-200 dark:border-zinc-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-modal-title"
      >
        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brand-100 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300 rounded-xl">
              <SlidersHorizontal className="w-5 h-5" />
            </div>

            <div>
              <h2
                id="filter-modal-title"
                className="text-base font-bold text-slate-900 dark:text-zinc-50"
              >
                Filter Job Opportunities
              </h2>

              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Refine jobs by type, experience, location, work mode and skills
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsFilterModalOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ==================================================
            BODY
        ================================================== */}

        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto space-y-6 no-scrollbar">
          {/* ==================================================
              EMPLOYMENT TYPE
          ================================================== */}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-2">
              Employment Type
            </label>

            <div className="grid grid-cols-3 gap-2">
              {EMPLOYMENT_OPTIONS.map((type) => {
                const active = localFilters.jobType === type;

                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleEmploymentType(type)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                      active
                        ? "bg-brand-600 text-white border-brand-600 shadow-xs"
                        : "bg-slate-50 dark:bg-zinc-950 text-slate-700 dark:text-zinc-200 border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ==================================================
    WORK MODE
================================================== */}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-2">
              Work Mode
            </label>

            <div className="grid grid-cols-4 gap-2">
              {WORK_MODE_OPTIONS.map((mode) => {
                const active = localFilters.workMode === mode;

                return (
                  <button
                    key={mode}
                    type="button"
                    id={
                      mode === "Remote"
                        ? "filter-work-mode-remote"
                        : `filter-work-mode-${mode.toLowerCase().replace(/\s+/g, "-")}`
                    }
                    onClick={() => handleWorkMode(mode)}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                      active
                        ? "bg-brand-600 text-white border-brand-600 shadow-xs"
                        : "bg-slate-50 dark:bg-zinc-950 text-slate-700 dark:text-zinc-200 border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {mode}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ==================================================
              EXPERIENCE
          ================================================== */}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-2">
              Experience Level
            </label>

            <div className="grid grid-cols-3 gap-2">
              {EXPERIENCE_OPTIONS.map((level) => {
                const active = localFilters.experienceLevel === level;

                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => updateFilter("experienceLevel", level)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                      active
                        ? "bg-brand-600 text-white border-brand-600 shadow-xs"
                        : "bg-slate-50 dark:bg-zinc-950 text-slate-700 dark:text-zinc-200 border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ==================================================
              LOCATION
          ================================================== */}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
              Preferred Location
            </label>

            <select
              value={localFilters.location || "All"}
              onChange={(event) => updateFilter("location", event.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              {LOCATION_OPTIONS.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>

          {/* ==================================================
              QUICK PREFERENCES
          ================================================== */}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-2">
              Quick Preferences
            </label>

            <div className="grid grid-cols-2 gap-2.5">
              {/* REMOTE */}

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer text-xs font-medium text-slate-800 dark:text-zinc-100 transition-colors">
                <input
                  type="checkbox"
                  checked={Boolean(localFilters.isRemote)}
                  onChange={(event) => {
                    const checked = event.target.checked;

                    setLocalFilters((previous) => ({
                      ...previous,

                      isRemote: checked,

                      workMode: checked ? "Remote" : "All",
                    }));
                  }}
                  className="w-4 h-4 rounded text-brand-600 dark:text-brand-400 focus:ring-brand-500 border-slate-300 dark:border-zinc-700"
                />

                <span>Remote Only</span>
              </label>

              {/* FRESHER */}

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer text-xs font-medium text-slate-800 dark:text-zinc-100 transition-colors">
                <input
                  type="checkbox"
                  checked={Boolean(localFilters.isFresherFriendly)}
                  onChange={(event) => {
                    setLocalFilters((previous) => ({
                      ...previous,

                      isFresherFriendly: event.target.checked,
                    }));
                  }}
                  className="w-4 h-4 rounded text-brand-600 dark:text-brand-400 focus:ring-brand-500 border-slate-300 dark:border-zinc-700"
                />

                <span>Fresher Friendly</span>
              </label>

              {/* INTERNSHIP */}

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer text-xs font-medium text-slate-800 dark:text-zinc-100 transition-colors">
                <input
                  type="checkbox"
                  checked={Boolean(localFilters.isInternship)}
                  onChange={(event) => {
                    const checked = event.target.checked;

                    setLocalFilters((previous) => ({
                      ...previous,

                      isInternship: checked,

                      jobType: checked ? "Internship" : "All",
                    }));
                  }}
                  className="w-4 h-4 rounded text-brand-600 dark:text-brand-400 focus:ring-brand-500 border-slate-300 dark:border-zinc-700"
                />

                <span>Internships Only</span>
              </label>

              {/* RECENT */}

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer text-xs font-medium text-slate-800 dark:text-zinc-100 transition-colors">
                <input
                  type="checkbox"
                  checked={Boolean(localFilters.recentlyPosted)}
                  onChange={(event) => {
                    setLocalFilters((previous) => ({
                      ...previous,

                      recentlyPosted: event.target.checked,
                    }));
                  }}
                  className="w-4 h-4 rounded text-brand-600 dark:text-brand-400 focus:ring-brand-500 border-slate-300 dark:border-zinc-700"
                />

                <span>Recently Posted</span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer text-xs font-medium text-slate-800 dark:text-zinc-100 transition-colors">
                <input
                  type="checkbox"
                  checked={Boolean(localFilters.lowCompetition)}
                  onChange={(event) =>
                    setLocalFilters((previous) => ({ ...previous, lowCompetition: event.target.checked }))
                  }
                  className="w-4 h-4 rounded text-brand-600 dark:text-brand-400 focus:ring-brand-500 border-slate-300 dark:border-zinc-700"
                />
                <span>Low Competition</span>
              </label>
            </div>
          </div>

          {/* ==================================================
              PRIMARY SKILL
          ================================================== */}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-2">
              Required Skill
            </label>

            <div className="flex flex-wrap gap-1.5">
              {SKILL_OPTIONS.map((skill) => {
                const active = localFilters.selectedSkill === skill;

                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleSkill(skill)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      active
                        ? "bg-brand-600 text-white border-brand-600"
                        : "bg-slate-50 dark:bg-zinc-950 text-slate-700 dark:text-zinc-200 border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {skill}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ==================================================
              STATUS
          ================================================== */}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-2">
              Job Status
            </label>

            <div className="px-3.5 py-2.5 rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/20">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-500" />

                <span className="text-xs font-semibold text-brand-800 dark:text-brand-300">
                  Showing Active Jobs
                </span>
              </div>

              <p className="text-[11px] text-brand-700 dark:text-brand-300 mt-1">
                Closed and inactive roles are automatically excluded.
              </p>
            </div>
          </div>
        </div>

        {/* ==================================================
            FOOTER
        ================================================== */}

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950">
          <button
            // type="button"
            // onClick={handleClear}
            type="button"
            id="btn-reset-filters"
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-zinc-50 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-xl transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />

            <span>Reset All</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFilterModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-xl transition-colors"
            >
              Cancel
            </button>

            <button
              // type="button"
              // onClick={handleApply}
              type="button"
              id="btn-apply-filters"
              onClick={handleApply}
              className="flex items-center gap-1.5 px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />

              <span>Apply Filters</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FilterModal;
