import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Briefcase,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Plus,
  X
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { jobService } from "../../services/jobService";

export function PostJobPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "Bangalore, India",
    employmentType: "Full Time",
    experienceLevel: "1-3 Years",
    salaryRange: "₹18–26 LPA",
    workMode: "Hybrid",
    deadline: "",
    status: "Active",
    description: "",
    qualifications: "",
    skillInput: "",
    skills: []
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddSkill = () => {
    const trimmed = formData.skillInput.trim();
    if (trimmed && !formData.skills.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, trimmed],
        skillInput: ""
      }));
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove)
    }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) {
      errs.title = "Job title is required.";
    } else if (formData.title.length < 3) {
      errs.title = "Job title must be at least 3 characters.";
    }

    if (!formData.company.trim()) {
      errs.company = "Company name is required.";
    }

    if (!formData.location.trim()) {
      errs.location = "Job location is required.";
    }

    if (!formData.salaryRange.trim()) {
      errs.salaryRange = "Salary range is required (e.g. ₹18–28 LPA).";
    }

    if (!formData.description.trim()) {
      errs.description = "Job description is required.";
    } else if (formData.description.length < 30) {
      errs.description = "Please provide a detailed description (at least 30 characters).";
    }

    if (!formData.qualifications.trim()) {
      errs.qualifications = "Qualifications and education requirements are required.";
    }

    if (formData.skills.length === 0) {
      errs.skills = "Please add at least one required skill tag.";
    }

    if (!formData.deadline) {
      errs.deadline = "Application deadline date is required.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validate()) return;

  setIsSubmitting(true);

  try {
    const response = await jobService.createJob({
      title: formData.title.trim(),
      company: formData.company.trim(),
      description: formData.description.trim(),
      location: formData.location.trim(),

      skills: formData.skills.join(", "),

      salary: formData.salaryRange.trim(),

      employment_type: formData.employmentType,
      experience_level: formData.experienceLevel,
      work_mode: formData.workMode,

      deadline: formData.deadline,

      qualifications: formData.qualifications.trim(),

      status: formData.status
    });

    console.log("Job created:", response);

    navigate("/recruiter/manage-jobs");

  } catch (error) {
    console.error("Create job failed:", error);

    const message =
      error.response?.data?.message ||
      "Failed to publish job. Please try again.";

    setErrors({
      submit: message
    });

  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/recruiter/manage-jobs"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-50 mb-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Job Listings</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight">
            Create a New Job Requisition
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Post an open opportunity to the SwipeX candidate discovery deck with ATS match scoring.
          </p>
        </div>
      </div>

      {/* Main Form Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-sm p-6 sm:p-8 space-y-8"
      >
        {/* Section 1: Basic Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-50 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Role Specifications</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {/* Job Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-200 mb-1.5">
                Job Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Senior Machine Learning Engineer"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border rounded-xl text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.title ? "border-rose-300 ring-1 ring-rose-200 dark:ring-rose-500/20" : "border-slate-200 dark:border-zinc-800"
                }`}
              />
              {errors.title && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.title}</span>
                </p>
              )}
            </div>

            {/* Company Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-200 mb-1.5">
                Company / Organization <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border rounded-xl text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.company ? "border-rose-300 ring-1 ring-rose-200 dark:ring-rose-500/20" : "border-slate-200 dark:border-zinc-800"
                }`}
              />
              {errors.company && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.company}</span>
                </p>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-200 mb-1.5">
                Location <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Bangalore, India / Remote"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border rounded-xl text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.location ? "border-rose-300 ring-1 ring-rose-200 dark:ring-rose-500/20" : "border-slate-200 dark:border-zinc-800"
                }`}
              />
              {errors.location && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.location}</span>
                </p>
              )}
            </div>

            {/* Employment Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-200 mb-1.5">
                Employment Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.employmentType}
                onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="Full Time">Full Time</option>
                <option value="Internship">Internship</option>
                <option value="Contract">Contract</option>
                <option value="Part Time">Part Time</option>
              </select>
            </div>

            {/* Experience Level */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-200 mb-1.5">
                Experience Level
              </label>
              <select
                value={formData.experienceLevel}
                onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="Fresher (0-1 Year)">Fresher (0-1 Year)</option>
                <option value="1-3 Years">1-3 Years</option>
                <option value="3-5 Years">3-5 Years</option>
                <option value="5+ Years (Senior)">5+ Years (Senior)</option>
              </select>
            </div>

            {/* Salary Range */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-200 mb-1.5">
                Compensation / Salary Range <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. ₹20–30 LPA or ₹50,000/mo"
                value={formData.salaryRange}
                onChange={(e) => setFormData({ ...formData, salaryRange: e.target.value })}
                className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border rounded-xl text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.salaryRange ? "border-rose-300 ring-1 ring-rose-200 dark:ring-rose-500/20" : "border-slate-200 dark:border-zinc-800"
                }`}
              />
              {errors.salaryRange && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.salaryRange}</span>
                </p>
              )}
            </div>

            {/* Application Deadline */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-200 mb-1.5">
                Application Deadline <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border rounded-xl text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.deadline ? "border-rose-300 ring-1 ring-rose-200 dark:ring-rose-500/20" : "border-slate-200 dark:border-zinc-800"
                }`}
              />
              {errors.deadline && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.deadline}</span>
                </p>
              )}
            </div>

            {/* Initial Job Status */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-200 mb-1.5">
                Posting Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="Active">Active (Immediately discoverable)</option>
                <option value="Draft">Draft (Save privately)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Required Skills (Tags) */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-700 dark:text-zinc-200">
            Required Skills (Used for ATS scoring) <span className="text-rose-500">*</span>
          </label>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Python, Docker, PyTorch (Press Add)"
              value={formData.skillInput}
              onChange={(e) => setFormData({ ...formData, skillInput: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
              className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="px-4 py-2 bg-slate-800 dark:bg-zinc-700 hover:bg-slate-900 dark:hover:bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>

          {/* Skill Tag Badges */}
          <div className="flex flex-wrap gap-2 pt-1">
            {formData.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-800 dark:text-blue-300 text-xs font-bold rounded-lg"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="p-0.5 hover:text-rose-600 dark:hover:text-rose-400 rounded-sm"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          {errors.skills && (
            <p className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>{errors.skills}</span>
            </p>
          )}
        </div>

        {/* Section 3: Job Description & Qualifications */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-200 mb-1.5">
              Job Description & Responsibilities <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Detail the day-to-day responsibilities, mission, and deliverables of this engineering role..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`w-full p-3.5 bg-slate-50 dark:bg-zinc-950 border rounded-xl text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all ${
                errors.description ? "border-rose-300 ring-1 ring-rose-200 dark:ring-rose-500/20" : "border-slate-200 dark:border-zinc-800"
              }`}
            />
            {errors.description && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>{errors.description}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-200 mb-1.5">
              Qualifications & Educational Requirements <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="e.g. B.Tech/M.Tech in CS or equivalent field with demonstrable web performance background..."
              value={formData.qualifications}
              onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
              className={`w-full p-3.5 bg-slate-50 dark:bg-zinc-950 border rounded-xl text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all ${
                errors.qualifications ? "border-rose-300 ring-1 ring-rose-200 dark:ring-rose-500/20" : "border-slate-200 dark:border-zinc-800"
              }`}
            />
            {errors.qualifications && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>{errors.qualifications}</span>
              </p>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-end gap-3">
          <Link
            to="/recruiter/manage-jobs"
            className="px-5 py-2.5 text-xs font-bold text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-zinc-50 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </Link>

          <button
            type="submit"
            id="btn-submit-post-job"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <span>Publishing...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Publish Job Opening</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PostJobPage;
