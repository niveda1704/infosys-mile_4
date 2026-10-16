/** Backend applicant payload (job service) -> the shape the recruiter pages render. */
export const STAGES = ["Applied", "Under Review", "Shortlisted", "Interview", "Offered", "Hired", "Rejected"];

export const STATUS_COLORS = {
  Applied: "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border-slate-200 dark:border-zinc-800",
  "Under Review": "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/20",
  Shortlisted: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/20",
  Interview: "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/20",
  Offered: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/20",
  Hired: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20",
  Rejected: "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/20",
};

export function initials(name = "") {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join("") || "?"
  );
}

export function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(/[zZ]|[+-]\d\d:\d\d$/.test(iso) ? iso : iso + "Z");
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function toUiApplicant(a) {
  const c = a.candidate || {};
  return {
    id: a.application_id ?? a.id,
    jobId: a.job?.id,
    name: c.name || "Candidate",
    email: c.email || "",
    phone: c.phone || "Not provided",
    location: c.location || "Not provided",
    appliedJobTitle: a.job?.title || "",
    company: a.job?.company || "",
    atsScore: a.match_score ?? 0,
    hasScore: a.match_score !== null && a.match_score !== undefined,
    matchingSkills: a.matching_skills || [],
    missingSkills: a.missing_skills || [],
    status: a.status,
    appliedDate: formatDate(a.applied_at),
    skills: c.skills || [],
    summary: c.bio || "",
    desiredRole: c.desired_role || "",
    experienceText: c.experience || "",
    recruiterNotes: a.recruiter_notes || "",
    resumeName: a.resume?.filename || "",
    resumeId: a.resume?.id || null,
  };
}
