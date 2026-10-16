import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  GraduationCap,
  Sparkles,
  Download,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  MessageSquare,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { http } from "../../services/http";
import { useApp } from "../../context/AppContext";
import { jobService } from "../../services/jobService";
import { STATUS_COLORS, initials, toUiApplicant } from "../../utils/applicants";

export function ApplicantDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useApp();

  const [applicant, setApplicant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState(""); // optional text shown to the candidate in their notification
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    jobService
      .getApplication(id)
      .then((res) => {
        if (cancelled) return;
        const a = toUiApplicant(res.applicant);
        setApplicant(a);
        setNotes(a.recruiterNotes);
      })
      .catch(() => {
        if (!cancelled) setApplicant(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="text-center py-16 text-xs text-slate-500 dark:text-zinc-400">Loading candidate...</div>
    );
  }

  if (!applicant) {
    return (
      <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800">
        <h2 className="text-lg font-bold text-slate-800 dark:text-zinc-100">Candidate Not Found</h2>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
          This application does not exist or does not belong to one of your jobs.
        </p>
        <Link
          to="/recruiter/applicants"
          className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Applicants</span>
        </Link>
      </div>
    );
  }

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      await jobService.updateApplicationStatus(applicant.id, null, { notes });
      addToast("Internal recruiter notes saved", "success");
    } catch (err) {
      addToast(err?.response?.data?.message || "Could not save notes", "error");
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (newStatus === applicant.status || isUpdating) return;
    setIsUpdating(true);
    try {
      await jobService.updateApplicationStatus(applicant.id, newStatus, message.trim() ? { message: message.trim() } : {});
      setApplicant((a) => ({ ...a, status: newStatus }));
      setMessage("");
      addToast(`Moved to ${newStatus}. The candidate was notified.`, "success");
    } catch (err) {
      addToast(err?.response?.data?.message || "Could not update the application", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const statusColors = STATUS_COLORS;

  // Authenticated download (an <a href> cannot send the Bearer token)
  const downloadResume = async () => {
    if (!applicant?.resumeId) return;
    try {
      const res = await http.get(`/resumes/${applicant.resumeId}/file`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = applicant.resumeName || "resume";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      let msg = "Could not download the resume";
      try { msg = JSON.parse(await err.response.data.text()).message || msg; } catch { /* keep default */ }
      addToast(msg, "error");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          to="/recruiter/applicants"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Candidate Pipeline</span>
        </Link>

        {/* Current Stage Indicator */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Application Stage:</span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              statusColors[applicant.status] || "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200"
            }`}
          >
            {applicant.status}
          </span>
        </div>
      </div>

      {/* Main Grid: Left Candidate Dossier + Right Actions & Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Candidate Details */}
        <div className="lg:col-span-8 space-y-6">
          {/* Header Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div
                aria-hidden="true"
                className="w-20 h-20 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-2 border-slate-200 dark:border-zinc-800 shadow-xs flex items-center justify-center text-2xl font-extrabold"
              >
                {initials(applicant.name)}
              </div>

              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-zinc-50">
                    {applicant.name}
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      applicant.atsScore >= 85
                        ? "bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-500/20"
                        : "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/20"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{applicant.hasScore ? `${applicant.atsScore}% AI Match` : "Match pending"}</span>
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 font-medium">
                  Applied for: <span className="font-bold text-slate-900 dark:text-zinc-50">{applicant.appliedJobTitle}</span>
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-zinc-400 pt-1">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <a href={`mailto:${applicant.email}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                      {applicant.email}
                    </a>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{applicant.phone}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{applicant.location}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Candidate Summary */}
            <div className="pt-4 border-t border-slate-100 dark:border-zinc-800">
              <h3 className="text-xs font-bold text-slate-900 dark:text-zinc-50 uppercase tracking-wider mb-2">
                Executive Profile Summary
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">
                {applicant.summary || "This candidate has not written a profile summary."}
              </p>
            </div>

            {/* Core Competencies & Skills */}
            <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 space-y-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-zinc-50 uppercase tracking-wider">
                Technical Stack & Qualifications
              </h3>
              <div className="flex flex-wrap gap-2">
                {applicant.skills?.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 text-xs font-semibold rounded-xl"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* AI match analysis */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-50 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>AI Match for {applicant.appliedJobTitle}</span>
            </h3>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase text-emerald-600 dark:text-emerald-400 mb-2">Matching skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {applicant.matchingSkills.length === 0 && <span className="text-xs text-slate-400">None detected</span>}
                  {applicant.matchingSkills.map((s) => (
                    <span key={s} className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-semibold">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase text-amber-600 dark:text-amber-400 mb-2">Missing skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {applicant.missingSkills.length === 0 && <span className="text-xs text-slate-400">None</span>}
                  {applicant.missingSkills.map((s) => (
                    <span key={s} className="px-2.5 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-semibold">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 grid sm:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-zinc-300">
              <p><span className="font-bold text-slate-900 dark:text-zinc-50">Target role:</span> {applicant.desiredRole || "Not provided"}</p>
              <p><span className="font-bold text-slate-900 dark:text-zinc-50">Experience:</span> {applicant.experienceText || "Not provided"}</p>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Stage Actions + Resume Download + Internal Notes */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Stage Progression Controls */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-zinc-50 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-zinc-800">
              Pipeline Stage Decision
            </h3>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase">
                Message to candidate (optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                maxLength={300}
                placeholder="e.g. Interview on Monday 11am, check your email"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => handleStatusChange("Shortlisted")}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all ${
                  applicant.status === "Shortlisted"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-500/15"
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Shortlist Candidate</span>
                </div>
                {applicant.status === "Shortlisted" && <span>Selected</span>}
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange("Interview")}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all ${
                  applicant.status === "Interview"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-500/15"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Invite to Interview</span>
                </div>
                {applicant.status === "Interview" && <span>Scheduled</span>}
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange("Under Review")}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all ${
                  applicant.status === "Under Review"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/15"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Mark Under Review</span>
                </div>
                {applicant.status === "Under Review" && <span>Active</span>}
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange("Offered")}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all ${
                  applicant.status === "Offered"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/15"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  <span>Make Offer</span>
                </div>
                {applicant.status === "Offered" && <span>Sent</span>}
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange("Hired")}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all ${
                  applicant.status === "Hired"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/15"
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark as Hired</span>
                </div>
                {applicant.status === "Hired" && <span>Done</span>}
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange("Rejected")}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all ${
                  applicant.status === "Rejected"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-500/15"
                }`}
              >
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  <span>Reject Application</span>
                </div>
                {applicant.status === "Rejected" && <span>Archived</span>}
              </button>
            </div>
          </div>

          {/* Resume Download Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-zinc-50 uppercase tracking-wider">
              Resume Document
            </h3>

            <div className="p-3.5 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-zinc-50 truncate">
                    {applicant.resumeName || "No resume on file"}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400">PDF • Verified ATS parsed</p>
                </div>
              </div>

              <button
                type="button"
                onClick={downloadResume}
                disabled={!applicant.resumeId}
                className="disabled:opacity-40 disabled:cursor-not-allowed p-2 bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800 rounded-xl transition-colors shrink-0"
                title="Download Resume"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Internal Recruiter Notes */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-zinc-50 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
              <span>Internal Recruiter Notes</span>
            </h3>

            <textarea
              rows={4}
              placeholder="Add confidential observations, interview prep questions, or hiring manager feedback..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />

            <button
              type="button"
              onClick={handleSaveNotes}
              disabled={isSavingNotes}
              className="w-full py-2 bg-slate-800 dark:bg-zinc-700 hover:bg-slate-900 dark:hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
            >
              {isSavingNotes ? "Saving..." : "Save Internal Notes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApplicantDetailsPage;
