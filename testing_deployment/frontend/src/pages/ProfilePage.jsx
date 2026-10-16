import React, { useState } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  IndianRupee,
  FileText,
  CheckCircle2,
  X,
  Save,
  Sparkles
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { aiService } from "../services/aiService";

export function ProfilePage() {
  const { user, updateUserProfile, addToast } = useApp();

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    location: user?.location || "",
    role: user?.desired_role || "",
    experience: user?.experience || "",
    preferredSalary: user?.preferred_salary || "",
    bio: user?.bio || "",
    skills: [...(user?.skills || [])]
  });

  // Latest stored resume (from the resume service) for the "Attached Resume" card
  const [resume, setResume] = useState(null);
  useEffect(() => {
    let cancelled = false;
    aiService
      .listResumes()
      .then((list) => {
        if (!cancelled) setResume(list[0] || null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const [newSkill, setNewSkill] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    if (formData.skills.includes(newSkill.trim())) {
      addToast("Skill already added", "info");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      skills: [...prev.skills, newSkill.trim()]
    }));
    setNewSkill("");
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await updateUserProfile({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      location: formData.location,
      desired_role: formData.role,
      experience: formData.experience,
      preferred_salary: formData.preferredSalary,
      bio: formData.bio,
      skills: formData.skills,
    });
    if (ok) {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-200 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 rounded-xl">
              <User className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight">
              Candidate Profile
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
            Manage your skills, target salary, experience, and contact information
          </p>
        </div>

        {/* Profile Strength indicator */}
        <div className="bg-white dark:bg-zinc-900 px-4 py-3 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-bold text-slate-900 dark:text-zinc-50">Profile Strength</p>
            <p className="text-[11px] text-brand-700 dark:text-brand-300 font-semibold">
              {user?.profileCompletion || 85}% Complete
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold text-xs border border-brand-200 dark:border-brand-500/20">
            {user?.profileCompletion || 85}%
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal & Contact Details Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-zinc-800 shadow-xs space-y-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-zinc-50 flex items-center gap-2">
            <User className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            Personal & Contact Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-slate-900 dark:text-zinc-50 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-slate-900 dark:text-zinc-50 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-slate-900 dark:text-zinc-50 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Current Location (City, Country)
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-slate-900 dark:text-zinc-50 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Career & Role Preferences */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-zinc-800 shadow-xs space-y-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-zinc-50 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            Career Focus & Expectations
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Desired Job Title
              </label>
              <input
                type="text"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-slate-900 dark:text-zinc-50 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Experience Level
              </label>
              <select
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-slate-900 dark:text-zinc-50 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                <option value="Fresher">Fresher (0 Years)</option>
                <option value="0-1 Year">0-1 Year</option>
                <option value="1-3 Years">1-3 Years</option>
                <option value="3-5 Years">3-5 Years</option>
                <option value="5+ Years">5+ Years</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Expected CTC / Salary
              </label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="preferredSalary"
                  value={formData.preferredSalary}
                  onChange={handleInputChange}
                  placeholder="e.g. ₹12 - ₹18 LPA"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-slate-900 dark:text-zinc-50 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
              Professional Summary
            </label>
            <textarea
              name="bio"
              rows={3}
              value={formData.bio}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-slate-900 dark:text-zinc-50 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 leading-relaxed"
            />
          </div>
        </div>

        {/* Skills Tag Management */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-zinc-50 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              Technical Skills ({formData.skills.length})
            </h2>
            <span className="text-xs text-slate-400">Used for match scoring</span>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {formData.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-500/20 rounded-xl text-xs font-semibold"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="hover:text-rose-600 dark:hover:text-rose-400 p-0.5 rounded transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>

          {/* Add skill input */}
          <div className="pt-3 flex gap-2 max-w-md">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="Add skill (e.g. Next.js, Docker, Tailwind)"
              className="flex-1 px-4 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Add Skill
            </button>
          </div>
        </div>

        {/* Resume Status Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-zinc-50 flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              Attached Resume
            </h2>
            <span className="px-2.5 py-1 bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 rounded-lg text-xs font-bold border border-brand-200 dark:border-brand-500/20">
              Active
            </span>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-500/20 rounded-xl">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-zinc-50">
                  {resume ? resume.filename : "No resume uploaded yet"}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  {resume
                    ? `${(resume.skills || []).length} skills detected`
                    : "Your profile skills already drive your recommendations"}
                </p>
              </div>
            </div>

            <a
              href="/resume-analysis"
              className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-brand-700 dark:text-brand-300 hover:bg-slate-50 dark:hover:bg-zinc-800/50 rounded-xl text-xs font-semibold transition-colors"
            >
              {resume ? "Check ATS Score" : "Upload Resume"}
            </a>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-4">
          {isSaved && (
            <span className="text-xs font-bold text-brand-700 dark:text-brand-300 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              Profile updated successfully!
            </span>
          )}

          <button
            type="submit"
            id="btn-save-profile"
            className="flex items-center gap-2 px-8 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProfilePage;
