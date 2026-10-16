import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Upload,
  ArrowRight,
  ArrowLeft,
  UserCheck,
  Building2,
  ShieldCheck,
  Building,
  Chrome,
} from "lucide-react";
import { useApp } from "../context/AppContext";

const ROLES = [
  {
    id: "seeker",
    label: "Job Seeker",
    icon: UserCheck,
    description:
      "Discover opportunities, swipe jobs, and track applications",
    color: "emerald",
    redirectPath: "/",
  },
  {
    id: "recruiter",
    label: "Recruiter",
    icon: Building2,
    description:
      "Post jobs, review candidate applicants, and hire talent",
    color: "blue",
    redirectPath: "/recruiter",
  },
  {
    id: "admin",
    label: "Admin",
    icon: ShieldCheck,
    description:
      "Platform governance, security, and administrative operations",
    color: "purple",
    redirectPath: "/admin",
  },
];

export function SignupPage() {
  const [searchParams] = useSearchParams();

  const initialRoleParam = searchParams.get("role");

  const initialRole =
    ROLES.find((r) => r.id === initialRoleParam)?.id ||
    "seeker";

  const [selectedRole, setSelectedRole] =
    useState(initialRole);

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] =
    useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",

    // Job seeker profile
    targetRole: "Full Stack Developer",
    experience: "Fresher",
    skills: "",
    preferredLocation: "",
    preferredSalary: "",
    bio: "",

    // Recruiter
    companyName: "",
    industry: "SaaS & Cloud Computing",
    companySize: "50-200",

    // Resume is handled separately by Resume Service
    resumeName: "",
  });

  const {
    signup,
    addToast,
  } = useApp();

  const navigate = useNavigate();

  const currentRoleData =
    ROLES.find((r) => r.id === selectedRole) ||
    ROLES[0];

  const handleInputChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRoleChange = (roleId) => {
    setSelectedRole(roleId);

    // Clear role-specific values when switching
    if (roleId === "seeker") {
      setFormData((prev) => ({
        ...prev,
        companyName: "",
        industry: "SaaS & Cloud Computing",
        companySize: "50-200",
      }));
    }

    if (roleId === "recruiter") {
      setFormData((prev) => ({
        ...prev,
        targetRole: "",
        experience: "",
        skills: "",
        preferredLocation: "",
        preferredSalary: "",
        bio: "",
      }));
    }
  };

  const handleResumeSelect = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    const maxSize =
      5 * 1024 * 1024;

    if (file.size > maxSize) {
      addToast(
        "Resume must be smaller than 5MB.",
        "error"
      );

      e.target.value = "";
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (
      !allowedTypes.includes(file.type)
    ) {
      addToast(
        "Please upload a PDF, DOC, or DOCX file.",
        "error"
      );

      e.target.value = "";
      return;
    }

    setFormData((prev) => ({
      ...prev,
      resumeName: file.name,
    }));

    addToast(
      `Selected ${file.name}`,
      "info"
    );

    /*
      IMPORTANT:
      This only selects the file.

      Actual upload should happen through:
      Resume Service -> POST /api/v1/resumes/analyze

      after account creation.
    */
  };

  const redirectUser = (user) => {
    const role =
      String(
        user?.role || "JOB_SEEKER"
      ).toUpperCase();

    if (role === "RECRUITER") {
      navigate("/recruiter", {
        replace: true,
      });
      return;
    }

    if (role === "ADMIN") {
      navigate("/admin", {
        replace: true,
      });
      return;
    }

    navigate("/discover", {
      replace: true,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedRole === "admin") {
      return;
    }

    setIsLoading(true);

    try {
      const accountRole =
        selectedRole === "recruiter"
          ? "RECRUITER"
          : "JOB_SEEKER";

      const createdUser =
        await signup({
          name: formData.name.trim(),
          email: formData.email
            .trim()
            .toLowerCase(),
          password: formData.password,

          // Actual account role
          accountType: accountRole,

          // Candidate profile
          targetRole:
            selectedRole === "seeker"
              ? formData.targetRole
              : null,

          experience:
            selectedRole === "seeker"
              ? formData.experience
              : null,

          skills:
            selectedRole === "seeker"
              ? formData.skills
              : [],

          preferredLocation:
            selectedRole === "seeker"
              ? formData.preferredLocation
              : null,

          preferredSalary:
            selectedRole === "seeker"
              ? formData.preferredSalary
              : null,

          bio:
            selectedRole === "seeker"
              ? formData.bio
              : null,

          // Recruiter data
          companyName:
            selectedRole === "recruiter"
              ? formData.companyName
              : null,

          industry:
            selectedRole === "recruiter"
              ? formData.industry
              : null,

          companySize:
            selectedRole === "recruiter"
              ? formData.companySize
              : null,
        });

      redirectUser(createdUser);
    } catch (error) {
      console.error(
        "Signup failed:",
        error
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    if (selectedRole === "admin") {
      addToast(
        "Admin accounts cannot be created through public registration.",
        "info"
      );
      return;
    }

    setIsGoogleLoading(true);

    const authBaseUrl =
      import.meta.env.VITE_AUTH_API_BASE_URL ||
      "http://127.0.0.1:5001/api/v1";

    const accountRole =
      selectedRole === "recruiter"
        ? "RECRUITER"
        : "JOB_SEEKER";

    const googleUrl =
      `${authBaseUrl}/auth/google` +
      `?role=${encodeURIComponent(accountRole)}`;

    window.location.href =
      googleUrl;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-md p-8 sm:p-10 space-y-7 animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-600 text-white font-bold text-xl shadow-xs mb-1">
            SX
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Create Your SwipeX Account
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            Choose your account role and create your
            SwipeX workspace.
          </p>
        </div>

        {/* Role Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 text-center">
            Choose Your Account Role
          </label>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 p-1.5 bg-slate-50 border border-slate-200 rounded-2xl">
            {ROLES.map((role) => {
              const Icon = role.icon;

              const isSelected =
                selectedRole === role.id;

              return (
                <button
                  key={role.id}
                  type="button"
                  id={`role-btn-${role.id}`}
                  onClick={() =>
                    handleRoleChange(role.id)
                  }
                  className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl text-center transition-all ${
                    isSelected
                      ? "bg-white text-slate-900 shadow-sm border border-slate-200/80 font-bold"
                      : "text-slate-500 hover:text-slate-800 font-semibold"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      isSelected
                        ? role.id === "recruiter"
                          ? "bg-blue-50 text-blue-600"
                          : role.id === "admin"
                          ? "bg-purple-50 text-purple-600"
                          : "bg-emerald-50 text-emerald-600"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <span className="text-xs leading-tight">
                    {role.label}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="text-center text-[11px] text-slate-400 mt-2">
            {currentRoleData.description}
          </p>
        </div>

        {/* Admin restriction */}
        {selectedRole === "admin" ? (
          <div className="border-t border-slate-100 pt-6 space-y-6">

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 text-center space-y-4">

              <div className="w-12 h-12 rounded-2xl bg-purple-100 border border-purple-200/80 text-purple-700 mx-auto flex items-center justify-center shadow-xs">
                <ShieldCheck className="w-6 h-6" />
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h2 className="text-sm font-bold uppercase tracking-wider text-purple-700">
                  Admin Account
                </h2>

                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  Admin accounts are created and managed by the platform administrator.
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Public registration is not available
                  for Admin accounts.
                </p>
              </div>

              <button
                type="button"
                id="btn-back-to-login"
                onClick={() =>
                  navigate("/login?role=admin")
                }
                className="inline-flex items-center justify-center gap-2 py-2.5 px-6 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Google Signup */}
            <button
              type="button"
              onClick={handleGoogleSignup}
              disabled={
                isGoogleLoading ||
                isLoading
              }
              id="btn-google-signup"
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-slate-50 disabled:opacity-50 border border-slate-300 text-slate-800 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all"
            >
              <Chrome className="w-4 h-4" />

              <span>
                {isGoogleLoading
                  ? "Connecting to Google..."
                  : `Continue with Google as ${currentRoleData.label}`}
              </span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />

              <span className="bg-white px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 absolute">
                Or register with email
              </span>
            </div>

            {/* Signup form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div className="border-t border-slate-100 pt-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
                  Enter {currentRoleData.label} Information
                </span>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>

                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Pushkar Vishwakarma"
                    required
                    autoComplete="name"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  {selectedRole === "recruiter"
                    ? "Work Email Address"
                    : "Email Address"}
                </label>

                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder={
                      selectedRole === "recruiter"
                        ? "recruiter@company.com"
                        : "you@example.com"
                    }
                    required
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Create Password
                </label>

                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="At least 8 characters"
                    minLength={8}
                    required
                    autoComplete="new-password"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Job Seeker */}
              {selectedRole === "seeker" && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                        Target Role
                      </label>

                      <input
                        type="text"
                        name="targetRole"
                        value={formData.targetRole}
                        onChange={handleInputChange}
                        placeholder="e.g. Backend Developer"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                        Experience
                      </label>

                      <select
                        name="experience"
                        value={formData.experience}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900"
                      >
                        <option value="Fresher">
                          Fresher / 0 Years
                        </option>

                        <option value="1-2 Years">
                          Junior (1-2 Years)
                        </option>

                        <option value="3-5 Years">
                          Mid-Level (3-5 Years)
                        </option>

                        <option value="5+ Years">
                          Senior (5+ Years)
                        </option>
                      </select>
                    </div>
                  </div>

                  {/* Skills */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      Skills
                    </label>

                    <input
                      type="text"
                      name="skills"
                      value={formData.skills}
                      onChange={handleInputChange}
                      placeholder="Java, Spring Boot, React, SQL"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900"
                    />

                    <p className="text-[10px] text-slate-400 mt-1">
                      Separate skills using commas.
                    </p>
                  </div>

                  {/* Location + Salary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                        Preferred Location
                      </label>

                      <input
                        type="text"
                        name="preferredLocation"
                        value={formData.preferredLocation}
                        onChange={handleInputChange}
                        placeholder="Bengaluru / Remote"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                        Preferred Salary
                      </label>

                      <input
                        type="text"
                        name="preferredSalary"
                        value={formData.preferredSalary}
                        onChange={handleInputChange}
                        placeholder="e.g. ₹6-10 LPA"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Resume */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      Resume / CV
                    </label>

                    <div className="relative border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-xl p-4 text-center bg-slate-50/50">

                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleResumeSelect}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />

                      <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-600">

                        <Upload className="w-4 h-4 text-emerald-600" />

                        <span>
                          {formData.resumeName ||
                            "Upload PDF or DOCX (Max 5MB)"}
                        </span>

                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Recruiter */}
              {selectedRole === "recruiter" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      Company Name
                    </label>

                    <div className="relative">
                      <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

                      <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        placeholder="e.g. TechCorp Global"
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      Company Size
                    </label>

                    <select
                      name="companySize"
                      value={formData.companySize}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900"
                    >
                      <option value="1-10">
                        1-10 Employees
                      </option>

                      <option value="11-50">
                        11-50 Employees
                      </option>

                      <option value="50-200">
                        50-200 Employees
                      </option>

                      <option value="200-1000">
                        200-1000 Employees
                      </option>

                      <option value="1000+">
                        1000+ Employees
                      </option>
                    </select>
                  </div>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={
                  isLoading ||
                  isGoogleLoading
                }
                id="btn-signup-submit"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs active:scale-98 transition-all mt-4"
              >
                <span>
                  {isLoading
                    ? "Creating account..."
                    : `Sign Up as ${currentRoleData.label}`}
                </span>

                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </>
        )}

        {/* Footer */}
        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Already have an account?{" "}

            <Link
              to={`/login?role=${selectedRole}`}
              className="text-emerald-700 font-bold hover:underline"
            >
              Sign in as{" "}
              {currentRoleData.label}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;