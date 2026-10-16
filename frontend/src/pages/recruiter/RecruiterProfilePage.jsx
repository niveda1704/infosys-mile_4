import React, { useEffect, useState } from "react";
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Users,
  Edit2,
  Save,
  XCircle,
  Briefcase,
} from "lucide-react";
import { authService } from "../../services/authService";

const EMPTY_PROFILE = {
  name: "",
  designation: "",
  companyName: "",
  email: "",
  phone: "",
  location: "",
  website: "",
  industry: "",
  companySize: "",
  description: "",
};

export function RecruiterProfilePage() {
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [formData, setFormData] = useState(EMPTY_PROFILE);

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // =========================
  // LOAD PROFILE
  // =========================

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await authService.getCurrentUser();

      const user = response.user || response;

      const normalizedProfile = {
        name: user.name || "",
        designation:
          user.designation || "",
        companyName:
          user.company_name ||
          user.companyName ||
          "",
        email: user.email || "",
        phone: user.phone || "",
        location: user.location || "",
        website: user.website || "",
        industry: user.industry || "",
        companySize:
          user.company_size ||
          user.companySize ||
          "",
        description:
          user.company_description ||
          user.description ||
          "",
      };

      setProfile(normalizedProfile);
      setFormData(normalizedProfile);
    } catch (err) {
      console.error(
        "Failed to load recruiter profile:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load your recruiter profile."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // =========================
  // EDIT / CANCEL
  // =========================

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing
      setFormData(profile);
      setError("");
      setSuccessMessage("");
      setIsEditing(false);
      return;
    }

    setFormData(profile);
    setError("");
    setSuccessMessage("");
    setIsEditing(true);
  };

  // =========================
  // FORM CHANGE
  // =========================

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // =========================
  // SAVE PROFILE
  // =========================

  const handleSave = async (e) => {
    e.preventDefault();

    setIsSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const response =
        await authService.updateProfile({
          name: formData.name.trim(),
          email: formData.email.trim(),

          phone: formData.phone.trim(),
          location: formData.location.trim(),

          designation:
            formData.designation.trim(),

          company_name:
            formData.companyName.trim(),

          website:
            formData.website.trim(),

          industry:
            formData.industry.trim(),

          company_size:
            formData.companySize.trim(),

          company_description:
            formData.description.trim(),
        });

      const updatedUser =
        response.user || response;

      const updatedProfile = {
        name: updatedUser.name ?? formData.name,
        designation:
          updatedUser.designation ??
          formData.designation,

        companyName:
          updatedUser.company_name ??
          updatedUser.companyName ??
          formData.companyName,

        email:
          updatedUser.email ??
          formData.email,

        phone:
          updatedUser.phone ??
          formData.phone,

        location:
          updatedUser.location ??
          formData.location,

        website:
          updatedUser.website ??
          formData.website,

        industry:
          updatedUser.industry ??
          formData.industry,

        companySize:
          updatedUser.company_size ??
          updatedUser.companySize ??
          formData.companySize,

        description:
          updatedUser.company_description ??
          updatedUser.description ??
          formData.description,
      };

      setProfile(updatedProfile);
      setFormData(updatedProfile);

      // Keep local cached user synchronized
      localStorage.setItem(
        "swipex_user",
        JSON.stringify(updatedUser)
      );

      setSuccessMessage(
        "Profile updated successfully."
      );

      setIsEditing(false);
    } catch (err) {
      console.error(
        "Failed to update recruiter profile:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to update your profile."
      );
    } finally {
      setIsSaving(false);
    }
  };

  // =========================
  // LOADING
  // =========================

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-12 text-center">
          <div className="w-8 h-8 border-4 border-blue-200 dark:border-blue-500/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />

          <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100">
            Loading recruiter profile...
          </h3>

          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Fetching your profile from SwipeX.
          </p>
        </div>
      </div>
    );
  }

  // =========================
  // PAGE
  // =========================

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">

      {/* =========================
          HEADER
      ========================= */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight">
            Employer & Recruiter Profile
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Manage your organization's presence seen by candidates.
          </p>
        </div>

        <button
          type="button"
          onClick={handleEditToggle}
          disabled={isSaving}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
            isEditing
              ? "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-700"
              : "bg-blue-600 hover:bg-blue-700 text-white active:scale-95"
          }`}
        >
          {isEditing ? (
            <XCircle className="w-4 h-4" />
          ) : (
            <Edit2 className="w-4 h-4" />
          )}

          <span>
            {isEditing
              ? "Cancel Edit"
              : "Edit Profile"}
          </span>
        </button>
      </div>

      {/* =========================
          SUCCESS / ERROR
      ========================= */}

      {successMessage && (
        <div className="flex items-center gap-2 px-4 py-3 bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20 rounded-xl text-xs font-semibold text-brand-700 dark:text-brand-300">
          <span className="w-2 h-2 rounded-full bg-brand-500" />
          {successMessage}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300">
          <XCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* =========================
          PROFILE
      ========================= */}

      <form
        onSubmit={handleSave}
        className="space-y-6"
      >

        {/* Branding Card */}

        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-zinc-800 shadow-sm">

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">

            <div className="w-20 h-20 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border-2 border-blue-100 dark:border-blue-500/20 flex items-center justify-center">
              <Building2 className="w-9 h-9 text-blue-600 dark:text-blue-400" />
            </div>

            <div className="space-y-1 min-w-0">

              <div className="flex flex-wrap items-center gap-2">

                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-zinc-50">
                  {profile.companyName ||
                    "Your Company"}
                </h2>

                <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/20 rounded-full text-[10px] font-bold">
                  Recruiter
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-zinc-300 font-medium">
                Managed by{" "}
                <span className="font-bold text-slate-900 dark:text-zinc-50">
                  {profile.name ||
                    "Recruiter"}
                </span>

                {profile.designation && (
                  <>
                    {" "}
                    ({profile.designation})
                  </>
                )}
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-zinc-400 pt-1">

                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {profile.location}
                  </span>
                )}

                {profile.website && (
                  <>
                    <span>•</span>

                    <span className="flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />

                      <a
                        href={
                          profile.website.startsWith(
                            "http"
                          )
                            ? profile.website
                            : `https://${profile.website}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-blue-600 dark:hover:text-blue-400 truncate max-w-[250px]"
                      >
                        {profile.website}
                      </a>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Organization Details */}

        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-6">

          <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-50 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Organization Specifications
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">

            {/* Name */}

            <ProfileField
              label="Primary Contact Name"
              value={formData.name}
              editing={isEditing}
              onChange={(value) =>
                handleChange("name", value)
              }
            />

            {/* Designation */}

            <ProfileField
              label="Designation / Position"
              value={formData.designation}
              editing={isEditing}
              onChange={(value) =>
                handleChange(
                  "designation",
                  value
                )
              }
            />

            {/* Email */}

            <ProfileField
              label="Work Email Address"
              type="email"
              value={formData.email}
              editing={isEditing}
              onChange={(value) =>
                handleChange("email", value)
              }
            />

            {/* Phone */}

            <ProfileField
              label="Contact Phone"
              value={formData.phone}
              editing={isEditing}
              onChange={(value) =>
                handleChange("phone", value)
              }
            />

            {/* Company */}

            <ProfileField
              label="Company Name"
              value={formData.companyName}
              editing={isEditing}
              onChange={(value) =>
                handleChange(
                  "companyName",
                  value
                )
              }
            />

            {/* Industry */}

            <ProfileField
              label="Industry Sector"
              value={formData.industry}
              editing={isEditing}
              onChange={(value) =>
                handleChange(
                  "industry",
                  value
                )
              }
            />

            {/* Company Size */}

            <ProfileField
              label="Company Headcount"
              value={formData.companySize}
              editing={isEditing}
              onChange={(value) =>
                handleChange(
                  "companySize",
                  value
                )
              }
            />

            {/* Location */}

            <ProfileField
              label="Company Location"
              value={formData.location}
              editing={isEditing}
              onChange={(value) =>
                handleChange(
                  "location",
                  value
                )
              }
            />

            {/* Website */}

            <ProfileField
              label="Company Website"
              value={formData.website}
              editing={isEditing}
              onChange={(value) =>
                handleChange(
                  "website",
                  value
                )
              }
            />
          </div>

          {/* Description */}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-200 mb-1.5">
              Company Description & Mission
            </label>

            <textarea
              rows={5}
              disabled={!isEditing}
              value={formData.description}
              onChange={(e) =>
                handleChange(
                  "description",
                  e.target.value
                )
              }
              placeholder="Tell candidates about your company, culture and mission..."
              className={`w-full p-3.5 rounded-xl text-xs font-medium transition-all leading-relaxed resize-none ${
                isEditing
                  ? "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  : "bg-slate-50 dark:bg-zinc-950 border border-transparent text-slate-700 dark:text-zinc-200"
              }`}
            />
          </div>

          {/* Save */}

          {isEditing && (
            <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex justify-end">

              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95"
              >
                {isSaving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 dark:border-zinc-800/40 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Profile Updates
                  </>
                )}
              </button>

            </div>
          )}
        </div>

      </form>
    </div>
  );
}

// =========================
// REUSABLE FIELD
// =========================

function ProfileField({
  label,
  value,
  type = "text",
  editing,
  onChange,
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 dark:text-zinc-200 mb-1.5">
        {label}
      </label>

      <input
        type={type}
        disabled={!editing}
        value={value || ""}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
          editing
            ? "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            : "bg-slate-50 dark:bg-zinc-950 border border-transparent text-slate-700 dark:text-zinc-200"
        }`}
      />
    </div>
  );
}

export default RecruiterProfilePage;