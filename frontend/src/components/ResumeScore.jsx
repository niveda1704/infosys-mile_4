import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  FileCheck,
  Zap,
  Target,
} from "lucide-react";

export function ResumeScore({ analysis }) {
  if (!analysis) return null;

  // ============================================================
  // NORMALIZE AI RESPONSE
  // ============================================================

  const atsScore = Number(
    analysis.atsScore ??
    analysis.ats_score ??
    analysis.match_score ??
    0
  );

  const jobMatch = Number(
    analysis.jobMatch ??
    analysis.job_match ??
    analysis.job_profile_fit ??
    analysis.profile_fit ??
    atsScore
  );

  const detectedSkills =
    analysis.detectedSkills ??
    analysis.detected_skills ??
    analysis.skills ??
    [];

  const missingSkills =
    analysis.missingSkills ??
    analysis.missing_skills ??
    [];

  const missingKeywords =
    analysis.missingKeywords ??
    analysis.missing_keywords ??
    [];

  const suggestions =
    analysis.suggestions ?? [];

  const scoreBreakdown = {
    keywordMatch: Number(
      analysis.scoreBreakdown?.keywordMatch ??
      analysis.score_breakdown?.keywordMatch ??
      analysis.keyword_relevance ??
      0
    ),

    formattingScore: Number(
      analysis.scoreBreakdown?.formattingScore ??
      analysis.score_breakdown?.formattingScore ??
      analysis.format_readability ??
      0
    ),

    experienceRelevance: Number(
      analysis.scoreBreakdown?.experienceRelevance ??
      analysis.score_breakdown?.experience_relevance ??
      analysis.job_profile_fit ??
      0
    ),

    skillsDepth: Number(
      analysis.scoreBreakdown?.skillsDepth ??
      analysis.score_breakdown?.skills_depth ??
      atsScore
    ),
  };

  // ============================================================
  // HELPERS
  // ============================================================

  const safeScore = (value) =>
    Math.min(100, Math.max(0, Number(value) || 0));

  const normalizedAtsScore =
    safeScore(atsScore);

  const normalizedJobMatch =
    safeScore(jobMatch);

  const renderList = (items) => {
    if (!Array.isArray(items)) {
      return [];
    }

    return items;
  };

  // ============================================================
  // SCORE CIRCLE
  // ============================================================

  const ScoreCircle = ({
    score,
    color = "emerald",
  }) => (
    <div className="relative w-20 h-20 flex items-center justify-center">

      <svg
        className="w-full h-full transform -rotate-90"
        viewBox="0 0 36 36"
      >

        <path
          className="text-slate-100"
          strokeWidth="3.5"
          stroke="currentColor"
          fill="none"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />

        <path
          className={
            color === "blue"
              ? "text-blue-600 dark:text-blue-400"
              : "text-brand-600 dark:text-brand-400"
          }
          strokeDasharray={`${score}, 100`}
          strokeWidth="3.5"
          strokeLinecap="round"
          stroke="currentColor"
          fill="none"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />

      </svg>

      <span className="absolute text-sm font-bold text-slate-900 dark:text-zinc-50">
        {score}%
      </span>
    </div>
  );

  // ============================================================
  // COMPONENT
  // ============================================================

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* TOP METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* ATS */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">

          <div className="space-y-1">

            <div className="flex items-center gap-2">

              <div className="p-1.5 bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 rounded-lg">
                <FileCheck className="w-4 h-4" />
              </div>

              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Resume ATS Score
              </span>

            </div>

            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-zinc-50">
              {normalizedAtsScore}%
            </h3>

            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Based on detected resume skills and keywords
            </p>

          </div>

          <ScoreCircle
            score={normalizedAtsScore}
          />

        </div>

        {/* JOB MATCH */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">

          <div className="space-y-1">

            <div className="flex items-center gap-2">

              <div className="p-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 rounded-lg">
                <Target className="w-4 h-4" />
              </div>

              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Job Profile Fit
              </span>

            </div>

            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-zinc-50">
              {normalizedJobMatch}%
            </h3>

            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Compatibility with the analyzed profile
            </p>

          </div>

          <ScoreCircle
            score={normalizedJobMatch}
            color="blue"
          />

        </div>

      </div>

      {/* BREAKDOWN */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm">

        <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-50 mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          ATS Diagnostic Breakdown
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {[
            [
              "Keyword Relevance",
              scoreBreakdown.keywordMatch,
            ],
            [
              "Format & ATS Readability",
              scoreBreakdown.formattingScore,
            ],
            [
              "Skills Depth",
              scoreBreakdown.skillsDepth,
            ],
            [
              "Experience Alignment",
              scoreBreakdown.experienceRelevance,
            ],
          ].map(([label, value]) => {

            const score = safeScore(value);

            return (
              <div key={label}>

                <div className="flex justify-between text-xs font-semibold mb-1.5">

                  <span className="text-slate-600 dark:text-zinc-300">
                    {label}
                  </span>

                  <span className="text-brand-700 dark:text-brand-300 font-bold">
                    {score}%
                  </span>

                </div>

                <div className="h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">

                  <div
                    className="h-full bg-brand-600 rounded-full transition-all duration-500"
                    style={{
                      width: `${score}%`,
                    }}
                  />

                </div>

              </div>
            );
          })}

        </div>
      </div>

      {/* SKILLS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* DETECTED */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm">

          <div className="flex items-center gap-2 mb-3.5">

            <CheckCircle2 className="w-5 h-5 text-brand-600 dark:text-brand-400" />

            <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-50">
              Recognized Skills ({renderList(detectedSkills).length})
            </h4>

          </div>

          <div className="flex flex-wrap gap-2">

            {renderList(detectedSkills).map(
              (skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-500/20 rounded-xl text-xs font-semibold"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {skill}
                </span>
              )
            )}

          </div>

        </div>

        {/* MISSING */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm">

          <div className="flex items-center gap-2 mb-3.5">

            <AlertTriangle className="w-5 h-5 text-amber-500" />

            <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-50">
              Missing Skills ({renderList(missingSkills).length})
            </h4>

          </div>

          <div className="flex flex-wrap gap-2">

            {renderList(missingSkills).map(
              (skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20 rounded-xl text-xs font-semibold"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {skill}
                </span>
              )
            )}

          </div>

        </div>

      </div>

      {/* KEYWORDS */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm">

        <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-50 mb-2 flex items-center gap-2">

          <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />

          Recommended Resume Keywords

        </h4>

        <p className="text-xs text-slate-500 dark:text-zinc-400 mb-3.5">
          Keywords identified as missing from the resume.
        </p>

        <div className="flex flex-wrap gap-2">

          {renderList(missingKeywords).map(
            (keyword) => (
              <span
                key={keyword}
                className="px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-semibold"
              >
                + {keyword}
              </span>
            )
          )}

        </div>

      </div>

      {/* SUGGESTIONS */}
      {renderList(suggestions).length > 0 && (

        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm">

          <div className="flex items-center gap-2 mb-4">

            <Lightbulb className="w-5 h-5 text-amber-500" />

            <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-50">
              Actionable Resume Suggestions
            </h4>

          </div>

          <div className="space-y-3">

            {renderList(suggestions).map(
              (item, index) => {

                const title =
                  typeof item === "string"
                    ? "Recommendation"
                    : item.title || "Recommendation";

                const detail =
                  typeof item === "string"
                    ? item
                    : item.detail || item.description || "";

                const impact =
                  typeof item === "object"
                    ? item.impact
                    : null;

                return (
                  <div
                    key={index}
                    className="p-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl flex items-start justify-between gap-3"
                  >

                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-zinc-50">
                        {title}
                      </p>

                      <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed mt-1">
                        {detail}
                      </p>
                    </div>

                    {impact && (
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20 shrink-0">
                        {impact}
                      </span>
                    )}

                  </div>
                );
              }
            )}

          </div>

        </div>

      )}

    </div>
  );
}

export default ResumeScore;