import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Mail,
  Lock,
  ArrowRight,
  UserCheck,
  Building2,
  ShieldCheck,
  Chrome,
  KeyRound,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { API_BASE_URL } from "../services/http";

const ROLES = [
  {
    id: "seeker",
    label: "Job Seeker",
    icon: UserCheck,
    description:
      "Discover opportunities, swipe jobs, and track applications",
    color: "emerald",
  },
  {
    id: "recruiter",
    label: "Recruiter",
    icon: Building2,
    description:
      "Post job openings, manage candidates, and track applicants",
    color: "blue",
  },
  {
    id: "admin",
    label: "Platform Admin",
    icon: ShieldCheck,
    description:
      "Monitor platform metrics, manage users, and review jobs",
    color: "purple",
  },
];

export function LoginPage() {
  const [searchParams] = useSearchParams();

  const initialRoleParam = searchParams.get("role");

  const initialRole =
    ROLES.find((r) => r.id === initialRoleParam)?.id ||
    "seeker";

  const [selectedRole, setSelectedRole] =
    useState(initialRole);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] =
    useState(false);

  const { login, addToast } = useApp();

  const navigate = useNavigate();

  const currentRoleData =
    ROLES.find((r) => r.id === selectedRole) ||
    ROLES[0];

  const handleRoleChange = (roleId) => {
    setSelectedRole(roleId);
    setEmail("");
    setPassword("");
  };

  /**
   * Redirect user according to backend role.
   */
  const redirectUser = (user) => {
    const role = String(
      user?.role || "JOB_SEEKER"
    ).toUpperCase();

    if (role === "RECRUITER" || role === "recruiter") {
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

  /**
   * Normal email/password login
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      addToast(
        "Please enter your email and password.",
        "error"
      );
      return;
    }

    setIsLoading(true);

    try {
      const loggedInUser = await login({
        email: email.trim().toLowerCase(),
        password,
        rememberMe,
      });

      redirectUser(loggedInUser);
    } catch (error) {
      // AppContext already handles the error toast.
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Google OAuth login
   *
   * The selected role is sent to the Auth Service.
   * For existing users, backend should preserve their
   * existing database role.
   */
  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);

    const authBaseUrl = API_BASE_URL;

    const accountRole =
      selectedRole === "recruiter"
        ? "RECRUITER"
        : selectedRole === "admin"
        ? "ADMIN"
        : "JOB_SEEKER";

    const googleUrl =
      `${authBaseUrl}/auth/google` +
      `?role=${encodeURIComponent(accountRole)}`;

    window.location.href = googleUrl;
  };

  return (
    <div className="min-h-[calc(100vh-3rem)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-md p-8 sm:p-10 space-y-5 animate-in fade-in zoom-in-80 duration-200">

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-600 text-white font-bold text-xl shadow-xs mb-1">
            SX
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight">
            Sign In to SwipeX
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
            Choose your account role and sign in to your
            SwipeX workspace.
          </p>
        </div>

        {/* Role Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2.5 text-center">
            Select Your Role
          </label>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 p-1.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl">
            {ROLES.map((role) => {
              const Icon = role.icon;

              const isSelected =
                selectedRole === role.id;

              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() =>
                    handleRoleChange(role.id)
                  }
                  id={`role-btn-${role.id}`}
                  className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl text-center transition-all ${
                    isSelected
                      ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-50 shadow-sm border border-slate-200/80 dark:border-zinc-800/80 font-bold"
                      : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-100 font-semibold"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                      isSelected
                        ? role.id === "recruiter"
                          ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                          : role.id === "admin"
                          ? "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400"
                          : "bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400"
                        : "bg-slate-100 dark:bg-zinc-800 text-slate-400"
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

        {/* Google Login */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading || isLoading}
          id="btn-google-login"
          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800/50 disabled:opacity-50 border border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-100 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all active:scale-[0.99]"
        >
          <Chrome className="w-4 h-4 text-slate-700 dark:text-zinc-200" />

          <span>
            {isGoogleLoading
              ? "Connecting to Google..."
              : `Continue with Google as ${currentRoleData.label}`}
          </span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 dark:border-zinc-800 w-full" />

          <span className="bg-white dark:bg-zinc-900 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 absolute">
            Or continue with email
          </span>
        </div>

        {/* Email Login */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              {selectedRole === "recruiter"
                ? "Work Email Address"
                : selectedRole === "admin"
                ? "Admin Email / Account ID"
                : "Email Address"}
            </label>

            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder={
                  selectedRole === "recruiter"
                    ? "recruiter@company.com"
                    : selectedRole === "admin"
                    ? "admin@swipex.io"
                    : "name@example.com"
                }
                required
                autoComplete="email"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-zinc-50 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 uppercase tracking-wider">
                {selectedRole === "admin"
                  ? "Admin Security Passkey"
                  : "Password"}
              </label>

              <button
                type="button"
                onClick={() =>
                  addToast(
                    "Password reset is available through the Forgot Password flow.",
                    "info"
                  )
                }
                className="text-xs font-semibold text-brand-700 dark:text-brand-300 hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <div className="relative">
              {selectedRole === "admin" ? (
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              ) : (
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              )}

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-zinc-50 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
              />
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) =>
                  setRememberMe(e.target.checked)
                }
                className="w-4 h-4 rounded accent-brand-600 border-slate-300 dark:border-zinc-700"
              />

              <span>
                Remember me on this browser
              </span>
            </label>
          </div>

          {/* Login */}
          <button
            type="submit"
            disabled={isLoading || isGoogleLoading}
            id="btn-login-submit"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs active:scale-98 transition-all"
          >
            <span>
              {isLoading
                ? "Signing in..."
                : `Sign In as ${currentRoleData.label}`}
            </span>

            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Signup */}
        <div className="text-center pt-2 border-t border-slate-100 dark:border-zinc-800">
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Don't have an account?{" "}

            <Link
              to={`/signup?role=${selectedRole}`}
              className="text-brand-700 dark:text-brand-300 font-bold hover:underline"
            >
              Sign up as{" "}
              {currentRoleData.label}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

// import React, { useState } from "react";
// import { Link, useNavigate, useSearchParams } from "react-router-dom";
// import {
//   Mail,
//   Lock,
//   ArrowRight,
//   Zap,
//   UserCheck,
//   Building2,
//   ShieldCheck,
//   CheckCircle2,
//   Building,
//   KeyRound
// } from "lucide-react";
// import { useApp } from "../context/AppContext";

// const ROLES = [
//   {
//     id: "seeker",
//     label: "Job Seeker",
//     icon: UserCheck,
//     description: "Discover opportunities, swipe jobs, and track applications",
//     color: "emerald",
//     badge: "Candidate",
//     demoUser: {
//       name: "Ashif Siddique",
//       email: "ashif.siddique@swipex.io",
//       role: "Full Stack Developer",
//       appRole: "seeker"
//     },
//     redirectPath: "/"
//   },
//   {
//     id: "recruiter",
//     label: "Recruiter",
//     icon: Building2,
//     description: "Post job openings, manage candidates, and track applicants",
//     color: "blue",
//     badge: "Employer",
//     demoUser: {
//       name: "Sarah Jenkins",
//       email: "sarah.j@techcorp.io",
//       role: "Lead Technical Recruiter",
//       company: "TechCorp Global",
//       appRole: "recruiter"
//     },
//     redirectPath: "/recruiter"
//   },
//   {
//     id: "admin",
//     label: "Platform Admin",
//     icon: ShieldCheck,
//     description: "Monitor platform metrics, manage users, and review jobs",
//     color: "purple",
//     badge: "Admin",
//     demoUser: {
//       name: "Alexander Vance",
//       email: "admin@swipex.io",
//       role: "Platform Administrator",
//       appRole: "admin"
//     },
//     redirectPath: "/admin"
//   }
// ];

// export function LoginPage() {
//   const [searchParams] = useSearchParams();
//   const initialRoleParam = searchParams.get("role");
//   const initialRole = ROLES.find((r) => r.id === initialRoleParam)?.id || "seeker";

//   const [selectedRole, setSelectedRole] = useState(initialRole);
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [rememberMe, setRememberMe] = useState(true);
//   const [isLoading, setIsLoading] = useState(false);

//   const { login, switchRole, addToast } = useApp();
//   const navigate = useNavigate();

//   const currentRoleData = ROLES.find((r) => r.id === selectedRole) || ROLES[0];

//   const handleRoleChange = (roleId) => {
//     setSelectedRole(roleId);
//     setEmail("");
//     setPassword("");
//   };

//   const handleSubmit = async (e) => {
//   e.preventDefault();

//   try {

//     const loggedInUser = await login({
//       email: formData.email,
//       password: formData.password,
//     });

//     const role =
//       String(loggedInUser.role || "")
//         .toUpperCase();

//     if (role === "RECRUITER") {
//       navigate("/recruiter", {
//         replace: true,
//       });
//     } else if (role === "ADMIN") {
//       navigate("/admin", {
//         replace: true,
//       });
//     } else {
//       navigate("/discover", {
//         replace: true,
//       });
//     }

//   } catch (error) {
//     // Toast is already handled
//   }
// };

//   const handleDemoLogin = () => {
//     setEmail(currentRoleData.demoUser.email);
//     setPassword("password123");
//     setIsLoading(true);

//     setTimeout(() => {
//       switchRole(selectedRole);
//       login(currentRoleData.demoUser);
//       setIsLoading(false);
//       navigate(currentRoleData.redirectPath);
//     }, 300);
//   };

//   return (
//     <div className="min-h-[calc(40vh-3rem)] flex items-center justify-center px-4 py-8">
//       <div className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-md p-8 sm:p-10 space-y-5 animate-in fade-in zoom-in-80 duration-200">
//         {/* Brand Header */}
//         <div className="text-center space-y-2">
//           <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-600 text-white font-bold text-xl shadow-xs mb-1">
//             SX
//           </div>
//           <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight">
//             Sign In to SwipeX
//           </h1>
//           <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
//             Choose your account role to access your dedicated workspace and tools
//           </p>
//         </div>

//         {/* Step 1: Role Selection Tabs */}
//         <div>
//           <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2.5 text-center">
//             Step 1: Select Your Role
//           </label>
//           <div className="grid grid-cols-3 gap-2.5 sm:gap-3 p-1.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl">
//             {ROLES.map((role) => {
//               const Icon = role.icon;
//               const isSelected = selectedRole === role.id;

//               return (
//                 <button
//                   key={role.id}
//                   type="button"
//                   onClick={() => handleRoleChange(role.id)}
//                   id={`role-btn-${role.id}`}
//                   className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl text-center transition-all ${
//                     isSelected
//                       ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-50 shadow-sm border border-slate-200/80 dark:border-zinc-800/80 font-bold"
//                       : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-100 font-semibold"
//                   }`}
//                 >
//                   <div
//                     className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
//                       isSelected
//                         ? role.id === "recruiter"
//                           ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
//                           : role.id === "admin"
//                           ? "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400"
//                           : "bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400"
//                         : "bg-slate-100 dark:bg-zinc-800 text-slate-400"
//                     }`}
//                   >
//                     <Icon className="w-4 h-4" />
//                   </div>
//                   <span className="text-xs leading-tight">{role.label}</span>
//                 </button>
//               );
//             })}
//           </div>
//           <p className="text-center text-[11px] text-slate-400 mt-2">
//             {currentRoleData.description}
//           </p>
//         </div>

//         {/* Demo Fast Login Trigger tailored to selected role */}
//         <button
//           type="button"
//           onClick={handleDemoLogin}
//           id="btn-demo-login"
//           className="w-full flex items-center justify-center gap-2 p-3 bg-brand-50 dark:bg-brand-500/10 hover:bg-brand-100 dark:hover:bg-brand-500/15 border border-brand-200 dark:border-brand-500/20 text-brand-900 dark:text-brand-300 rounded-xl text-xs font-bold transition-all group"
//         >
//           <Zap className="w-4 h-4 text-brand-600 dark:text-brand-400 fill-brand-600 group-hover:scale-110 transition-transform" />
//           <span>One-Click Demo {currentRoleData.label} Login</span>
//         </button>

//         <div className="relative flex items-center justify-center">
//           <div className="border-t border-slate-200 dark:border-zinc-800 w-full" />
//           <span className="bg-white dark:bg-zinc-900 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 absolute">
//             Or sign in with {currentRoleData.label} credentials
//           </span>
//         </div>

//         {/* Step 2: Login Form for selected role */}
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div>
//             <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
//               {selectedRole === "recruiter"
//                 ? "Work Email Address"
//                 : selectedRole === "admin"
//                 ? "Admin Email / Account ID"
//                 : "Email Address"}
//             </label>
//             <div className="relative">
//               <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
//               <input
//                 type="email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 placeholder={
//                   selectedRole === "recruiter"
//                     ? "sarah@company.com"
//                     : selectedRole === "admin"
//                     ? "admin@swipex.io"
//                     : "name@example.com"
//                 }
//                 required
//                 className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-zinc-50 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
//               />
//             </div>
//           </div>

//           <div>
//             <div className="flex items-center justify-between mb-1.5">
//               <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 uppercase tracking-wider">
//                 {selectedRole === "admin" ? "Admin Security Passkey" : "Password"}
//               </label>
//               <button
//                 type="button"
//                 onClick={() => addToast("Password reset link sent to registered email.", "info")}
//                 className="text-xs font-semibold text-brand-700 dark:text-brand-300 hover:underline"
//               >
//                 Forgot password?
//               </button>
//             </div>
//             <div className="relative">
//               {selectedRole === "admin" ? (
//                 <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
//               ) : (
//                 <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
//               )}
//               <input
//                 type="password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 placeholder="••••••••"
//                 required
//                 className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-zinc-50 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
//               />
//             </div>
//           </div>

//           <div className="flex items-center">
//             <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-zinc-300 cursor-pointer">
//               <input
//                 type="checkbox"
//                 checked={rememberMe}
//                 onChange={(e) => setRememberMe(e.target.checked)}
//                 className="w-4 h-4 rounded accent-brand-600 border-slate-300 dark:border-zinc-700"
//               />
//               <span>Remember me on this browser</span>
//             </label>
//           </div>

//           <button
//             type="submit"
//             disabled={isLoading}
//             id="btn-login-submit"
//             className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs active:scale-98 transition-all"
//           >
//             <span>{isLoading ? `Authenticating as ${currentRoleData.label}...` : `Sign In as ${currentRoleData.label}`}</span>
//             <ArrowRight className="w-4 h-4" />
//           </button>
//         </form>

//         {/* Footer Link */}
//         <div className="text-center pt-2 border-t border-slate-100 dark:border-zinc-800">
//           <p className="text-xs text-slate-500 dark:text-zinc-400">
//             Don't have an account?{" "}
//             <Link
//               to={`/signup?role=${selectedRole}`}
//               className="text-brand-700 dark:text-brand-300 font-bold hover:underline"
//             >
//               Sign up as {currentRoleData.label}
//             </Link>
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default LoginPage;
