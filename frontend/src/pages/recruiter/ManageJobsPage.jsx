import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  PlusCircle,
  Briefcase,
  Users,
  Edit2,
  Trash2,
  Eye,
  Power,
  XCircle,
  MapPin,
  X,
  AlertCircle,
} from "lucide-react";
import { jobService } from "../../services/jobService";

export function ManageJobsPage() {
  // =========================
  // STATE
  // =========================

  const [recruiterJobs, setRecruiterJobs] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [viewDetailsJob, setViewDetailsJob] = useState(null);

  const [editJob, setEditJob] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState(null); // { type: "success" | "error", text }

  // =========================
  // LOAD RECRUITER JOBS
  // =========================

  useEffect(() => {
    loadRecruiterJobs();
  }, []);

  const loadRecruiterJobs = async () => {
    setIsLoading(true);
    setLoadError("");

    try {
      const response = await jobService.getRecruiterJobs();

      const jobs = (response.jobs || []).map((job) => ({
        ...job,

        // Convert backend skills string into frontend array
        requiredSkills:
          typeof job.skills === "string"
            ? job.skills
                .split(",")
                .map((skill) => skill.trim())
                .filter(Boolean)
            : [],

        // Backend → frontend display names
        employmentType:
          job.employment_type || "Not specified",

        experienceLevel:
          job.experience_level || "Not specified",

        salaryRange:
          job.salary || "Not specified",

        workMode:
          job.work_mode || "Not specified",

        postedDate:
          job.created_at
            ? new Date(job.created_at).toLocaleDateString()
            : "Recently",

        applicantsCount: job.applicant_count ?? job.applicantCount ?? 0,
      }));

      setRecruiterJobs(jobs);
    } catch (error) {
      console.error(
        "Failed to load recruiter jobs:",
        error
      );

      setLoadError(
        error.response?.data?.message ||
          "Failed to load your job postings."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // =========================
  // SEARCH + STATUS FILTER
  // =========================

  const filteredJobs = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();

    return recruiterJobs.filter((job) => {
      const matchesSearch =
        !search ||
        job.title?.toLowerCase().includes(search) ||
        job.company?.toLowerCase().includes(search) ||
        job.location?.toLowerCase().includes(search) ||
        job.requiredSkills?.some((skill) =>
          skill.toLowerCase().includes(search)
        );

      const matchesStatus =
        statusFilter === "All" ||
        job.status?.toLowerCase() ===
          statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [recruiterJobs, searchQuery, statusFilter]);

  // =========================
  // DELETE JOB
  // =========================

  const handleDeleteJob = async () => {
    if (!deleteConfirmId) return;

    try {
      await jobService.deleteJob(deleteConfirmId);

      // Remove deleted job from UI immediately
      setRecruiterJobs((prev) =>
        prev.filter(
          (job) => job.id !== deleteConfirmId
        )
      );

      setDeleteConfirmId(null);

      // Close details modal if it was the deleted job
      if (
        viewDetailsJob?.id === deleteConfirmId
      ) {
        setViewDetailsJob(null);
      }
    } catch (error) {
      console.error(
        "Delete job failed:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to delete job."
      );
    }
  };

  // =========================
  // EDIT JOB / ACTIVATE-DEACTIVATE
  // =========================

  const patchLocal = (updated) =>
    setRecruiterJobs((prev) =>
      prev.map((j) =>
        j.id === updated.id
          ? {
              ...j,
              ...updated,
              requiredSkills: String(updated.skills || "").split(",").map((x) => x.trim()).filter(Boolean),
              employmentType: updated.employment_type || "Not specified",
              experienceLevel: updated.experience_level || "Not specified",
              salaryRange: updated.salary || "Not specified",
              workMode: updated.work_mode || "Not specified",
              applicantsCount: j.applicantsCount,
            }
          : j
      )
    );

  const openEdit = (job) => {
    setEditJob(job);
    setEditForm({
      title: job.title || "",
      company: job.company || "",
      location: job.location || "",
      salary: job.salary || "",
      skills: job.skills || "",
      employment_type: job.employment_type || "",
      work_mode: job.work_mode || "",
      experience_level: job.experience_level || "",
      description: job.description || "",
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await jobService.updateJob(editJob.id, editForm);
      patchLocal(res.job);
      setEditJob(null);
      setNotice({ type: "success", text: "Job updated." });
    } catch (error) {
      setNotice({ type: "error", text: error.response?.data?.message || "Could not update the job." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (job) => {
    const next = job.status === "Active" ? "Deactivated" : "Active";
    try {
      const res = await jobService.updateJob(job.id, { status: next });
      patchLocal(res.job);
      setNotice({
        type: "success",
        text: next === "Active" ? "Job is live again." : "Job deactivated. Seekers no longer see it.",
      });
    } catch (error) {
      setNotice({ type: "error", text: error.response?.data?.message || "Could not change the job status." });
    }
  };

  // =========================
  // RENDER
  // =========================

  return (
    <div className="space-y-6 animate-in fade-in duration-200">

      {/* =========================
          HEADER
      ========================= */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight">
            Manage Job Openings
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Monitor, view, and manage your company's
            job requisitions.
          </p>
        </div>

        <Link
          to="/recruiter/post-job"
          id="btn-manage-post-new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Post New Job</span>
        </Link>
      </div>

      {notice && (
        <div
          className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold border ${
            notice.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20"
              : "bg-rose-50 dark:bg-rose-500/10 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-500/20"
          }`}
        >
          <span>{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* =========================
          SEARCH + FILTER
      ========================= */}

      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

          <input
            type="text"
            placeholder="Search roles, companies, locations, skills..."
            value={searchQuery}
            onChange={(e) =>
              setSearchQuery(e.target.value)
            }
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {["All", "Active", "Inactive"].map(
            (status) => (
              <button
                key={status}
                type="button"
                onClick={() =>
                  setStatusFilter(status)
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                  statusFilter === status
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700"
                }`}
              >
                {status}
              </button>
            )
          )}
        </div>
      </div>

      {/* =========================
          CONTENT
      ========================= */}

      {isLoading ? (
        /* Loading */
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-12 text-center">
          <div className="w-8 h-8 border-4 border-blue-200 dark:border-blue-500/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />

          <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100">
            Loading your jobs...
          </h3>

          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Fetching your job postings from SwipeX.
          </p>
        </div>
      ) : loadError ? (
        /* Error */
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-rose-200 dark:border-rose-500/20 p-12 text-center">
          <XCircle className="w-12 h-12 text-rose-300 mx-auto mb-3" />

          <h3 className="text-base font-bold text-slate-800 dark:text-zinc-100">
            Unable to load jobs
          </h3>

          <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
            {loadError}
          </p>

          <button
            type="button"
            onClick={loadRecruiterJobs}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
          >
            Try Again
          </button>
        </div>
      ) : filteredJobs.length === 0 ? (
        /* Empty */
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-12 text-center">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />

          <h3 className="text-base font-bold text-slate-800 dark:text-zinc-100">
            {recruiterJobs.length === 0
              ? "No jobs posted yet"
              : "No jobs matched your criteria"}
          </h3>

          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
            {recruiterJobs.length === 0
              ? "Create your first job opening to start attracting candidates."
              : "Try adjusting your search query or status filter."}
          </p>

          {recruiterJobs.length === 0 && (
            <Link
              to="/recruiter/post-job"
              className="inline-flex items-center gap-2 mt-5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
            >
              <PlusCircle className="w-4 h-4" />
              Post Your First Job
            </Link>
          )}
        </div>
      ) : (
        /* Jobs */
        <div className="space-y-3">

          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-5 shadow-xs hover:border-blue-200 dark:hover:border-blue-500/20 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >

              {/* =========================
                  JOB INFO
              ========================= */}

              <div className="space-y-2 flex-1 min-w-0">

                <div className="flex flex-wrap items-center gap-2.5">

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-50 truncate">
                    {job.title}
                  </h3>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      job.status === "Active"
                        ? "bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-500/20"
                        : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        job.status === "Active"
                          ? "bg-brand-500"
                          : "bg-slate-400"
                      }`}
                    />

                    <span>
                      {job.status || "Unknown"}
                    </span>
                  </span>
                </div>

                {/* Company */}
                <p className="text-xs font-semibold text-slate-700 dark:text-zinc-200">
                  {job.company}
                </p>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-zinc-400">

                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {job.location}
                  </span>

                  <span>•</span>

                  <span>
                    {job.employmentType}
                  </span>

                  <span>•</span>

                  <span className="font-semibold text-slate-800 dark:text-zinc-100">
                    {job.salaryRange}
                  </span>

                  <span>•</span>

                  <span>
                    Posted {job.postedDate}
                  </span>
                </div>

                {/* Skills */}
                {job.requiredSkills?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {job.requiredSkills.map(
                      (skill) => (
                        <span
                          key={skill}
                          className="px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded-md text-[10px] font-medium"
                        >
                          {skill}
                        </span>
                      )
                    )}
                  </div>
                )}
              </div>

              {/* =========================
                  ACTIONS
              ========================= */}

              <div className="flex flex-wrap items-center gap-2 lg:border-l lg:border-slate-100 dark:lg:border-zinc-800 lg:pl-6 shrink-0">

                {/* Applicants */}
                <Link
                  to={`/recruiter/applicants?job=${job.id}`}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/15 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold transition-colors"
                >
                  <Users className="w-4 h-4" />

                  <span>
                    {job.applicantsCount} Applicants
                  </span>
                </Link>

                {/* View */}
                <button
                  type="button"
                  onClick={() =>
                    setViewDetailsJob(job)
                  }
                  className="p-2 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                  title="View Details"
                >
                  <Eye className="w-4 h-4" />
                </button>

                {/* Edit */}
                <button
                  type="button"
                  onClick={() => openEdit(job)}
                  className="p-2 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                  title="Edit Job"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                {/* Activate / Deactivate (admin-controlled statuses cannot be changed here) */}
                <button
                  type="button"
                  onClick={() => handleToggleStatus(job)}
                  disabled={job.status === "Pending Approval" || job.status === "Rejected"}
                  className="p-2 text-slate-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title={
                    job.status === "Pending Approval" || job.status === "Rejected"
                      ? `${job.status}: only an admin can change this`
                      : job.status === "Active"
                      ? "Deactivate Job"
                      : "Activate Job"
                  }
                >
                  <Power className="w-4 h-4" />
                </button>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() =>
                    setDeleteConfirmId(job.id)
                  }
                  className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors"
                  title="Delete Job"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* =========================
          EDIT MODAL
      ========================= */}

      {editJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <form
            onSubmit={handleSaveEdit}
            className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-zinc-50">Edit job</h3>
              <button type="button" onClick={() => setEditJob(null)} aria-label="Close"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                ["title", "Title", true],
                ["company", "Company", true],
                ["location", "Location", true],
                ["salary", "Salary", false],
                ["employment_type", "Employment type", false],
                ["work_mode", "Work mode", false],
                ["experience_level", "Experience level", false],
              ].map(([key, label, req]) => (
                <label key={key} className="text-xs font-bold text-slate-700 dark:text-zinc-300 space-y-1">
                  <span>{label}</span>
                  <input
                    name={key}
                    value={editForm[key] ?? ""}
                    required={req}
                    onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </label>
              ))}
            </div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 space-y-1">
              <span>Skills (comma separated)</span>
              <input
                name="skills"
                value={editForm.skills ?? ""}
                required
                onChange={(e) => setEditForm({ ...editForm, skills: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 space-y-1">
              <span>Description</span>
              <textarea
                name="description"
                rows={5}
                value={editForm.description ?? ""}
                required
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setEditJob(null)} className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl">Cancel</button>
              <button type="submit" id="btn-save-job" disabled={isSaving} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold">
                {isSaving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================
          DETAILS MODAL
      ========================= */}

      {viewDetailsJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">

          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200 dark:border-zinc-800 animate-in zoom-in-95">

            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-50">
                  {viewDetailsJob.title}
                </h3>

                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  {viewDetailsJob.company}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setViewDetailsJob(null)
                }
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>

            </div>

            <div className="space-y-4 text-xs">

              {/* Location */}
              <div>
                <p className="font-bold text-slate-500 dark:text-zinc-400 uppercase text-[10px]">
                  Location
                </p>

                <p className="text-slate-800 dark:text-zinc-100 font-semibold mt-0.5">
                  {viewDetailsJob.location}
                </p>
              </div>

              {/* Employment */}
              <div>
                <p className="font-bold text-slate-500 dark:text-zinc-400 uppercase text-[10px]">
                  Employment
                </p>

                <p className="text-slate-800 dark:text-zinc-100 font-semibold mt-0.5">
                  {viewDetailsJob.employmentType}
                  {" • "}
                  {viewDetailsJob.experienceLevel}
                  {" • "}
                  {viewDetailsJob.workMode}
                </p>
              </div>

              {/* Salary */}
              <div>
                <p className="font-bold text-slate-500 dark:text-zinc-400 uppercase text-[10px]">
                  Compensation
                </p>

                <p className="text-slate-800 dark:text-zinc-100 font-semibold mt-0.5">
                  {viewDetailsJob.salaryRange}
                </p>
              </div>

              {/* Deadline */}
              {viewDetailsJob.deadline && (
                <div>
                  <p className="font-bold text-slate-500 dark:text-zinc-400 uppercase text-[10px]">
                    Application Deadline
                  </p>

                  <p className="text-slate-800 dark:text-zinc-100 font-semibold mt-0.5">
                    {new Date(
                      viewDetailsJob.deadline
                    ).toLocaleDateString()}
                  </p>
                </div>
              )}

              {/* Description */}
              <div>
                <p className="font-bold text-slate-500 dark:text-zinc-400 uppercase text-[10px]">
                  Role Overview
                </p>

                <p className="text-slate-700 dark:text-zinc-200 leading-relaxed mt-0.5 whitespace-pre-line">
                  {viewDetailsJob.description ||
                    "No description provided."}
                </p>
              </div>

              {/* Qualifications */}
              <div>
                <p className="font-bold text-slate-500 dark:text-zinc-400 uppercase text-[10px]">
                  Qualifications
                </p>

                <p className="text-slate-700 dark:text-zinc-200 leading-relaxed mt-0.5 whitespace-pre-line">
                  {viewDetailsJob.qualifications ||
                    "No qualifications specified."}
                </p>
              </div>

              {/* Skills */}
              <div>
                <p className="font-bold text-slate-500 dark:text-zinc-400 uppercase text-[10px] mb-1">
                  Required Skills
                </p>

                <div className="flex flex-wrap gap-1">
                  {viewDetailsJob.requiredSkills?.map(
                    (skill) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 rounded text-[10px] font-bold"
                      >
                        {skill}
                      </span>
                    )
                  )}
                </div>
              </div>

            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex justify-end">

              <button
                type="button"
                onClick={() =>
                  setViewDetailsJob(null)
                }
                className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-bold transition-colors"
              >
                Close
              </button>

            </div>
          </div>
        </div>
      )}

      {/* =========================
          DELETE CONFIRMATION
      ========================= */}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">

          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-slate-200 dark:border-zinc-800 animate-in zoom-in-95 text-center">

            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-50">
                Delete Job Requisition?
              </h3>

              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
                Are you sure you want to delete this job
                posting? Candidates will no longer be able
                to discover or apply to this role.
              </p>
            </div>

            <div className="flex gap-2 pt-2">

              <button
                type="button"
                onClick={() =>
                  setDeleteConfirmId(null)
                }
                className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-bold transition-colors"
              >
                Keep Job
              </button>

              <button
                type="button"
                onClick={handleDeleteJob}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Delete
              </button>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default ManageJobsPage;