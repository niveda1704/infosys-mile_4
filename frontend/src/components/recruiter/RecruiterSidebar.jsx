import React, { useEffect, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  PlusCircle,
  Briefcase,
  Users,
  Building2,
  Bell,
  LogOut,
} from "lucide-react";

import { useApp } from "../../context/AppContext";
import { authService } from "../../services/authService";
import { jobService } from "../../services/jobService";

export function RecruiterSidebar({
  mobile = false,
  onClose,
}) {
  const { user, logout } = useApp();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(() => {
    try {
      const savedUser =
        localStorage.getItem("swipex_user");

      return savedUser
        ? JSON.parse(savedUser)
        : null;
    } catch {
      return null;
    }
  });

  const [jobCount, setJobCount] = useState(0);
  const [newApplicants, setNewApplicants] = useState(0); // applications still in "Applied" (not yet reviewed)

  // =========================
  // LOAD REAL RECRUITER DATA
  // =========================

  useEffect(() => {
    loadSidebarData();
  }, []);

  const loadSidebarData = async () => {
    try {
      const [profileResponse, jobsResponse, applicantsResponse] =
        await Promise.all([
          authService.getCurrentUser(),
          jobService.getRecruiterJobs(),
          jobService.getApplicants().catch(() => ({ applicants: [] })),
        ]);

      setNewApplicants(
        (applicantsResponse?.applicants || []).filter((a) => a.status === "Applied").length
      );

      // -------------------------
      // PROFILE
      // -------------------------

      const currentUser =
        profileResponse.user ||
        profileResponse;

      setProfile(currentUser);

      localStorage.setItem(
        "swipex_user",
        JSON.stringify(currentUser)
      );

      // -------------------------
      // JOB COUNT
      // -------------------------

      setJobCount(
        jobsResponse.count ??
          jobsResponse.jobs?.length ??
          0
      );
    } catch (error) {
      console.error(
        "Failed to load recruiter sidebar data:",
        error
      );

      // Fallback to AppContext user
      if (user) {
        setProfile((previous) => ({
          ...(previous || {}),
          ...user,
        }));
      }
    }
  };

  // =========================
  // KEEP USER IN SYNC
  // =========================

  useEffect(() => {
    if (user) {
      setProfile((previous) => ({
        ...(previous || {}),
        ...user,
      }));
    }
  }, [user]);

  // =========================
  // NAVIGATION
  // =========================

  const navLinks = [
    {
      to: "/recruiter",
      label: "Dashboard",
      icon: LayoutDashboard,
      end: true,
    },
    {
      to: "/recruiter/post-job",
      label: "Post a Job",
      icon: PlusCircle,
    },
    {
      to: "/recruiter/manage-jobs",
      label: "Manage Jobs",
      icon: Briefcase,
      badge: jobCount,
    },
    {
      to: "/recruiter/applicants",
      label: "Applicants",
      icon: Users,
      badge: newApplicants > 0 ? newApplicants : null,
    },
    {
      to: "/recruiter/profile",
      label: "Company Profile",
      icon: Building2,
    },
    {
      to: "/recruiter/notifications",
      label: "Notifications",
      icon: Bell,
    },
  ];

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error(
        "Logout failed:",
        error
      );
    } finally {
      navigate("/login");
    }
  };

  // =========================
  // PROFILE DATA
  // =========================

  const recruiterName =
    profile?.name || "Recruiter";

  const companyName =
    profile?.company_name ||
    profile?.companyName ||
    "Your Company";

  return (
    <aside
      className={`flex flex-col h-full bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 ${
        mobile ? "w-full" : "w-64"
      }`}
    >

      {/* =========================
          BRAND HEADER
      ========================= */}

      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-100 dark:border-zinc-800">

        <Link
          to="/recruiter"
          onClick={onClose}
          className="flex items-center gap-2.5 group"
        >

          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs font-bold text-sm">
            SX
          </div>

          <div className="flex flex-col">

            <div className="flex items-center gap-1.5">

              <span className="text-base font-bold text-slate-900 dark:text-zinc-50 tracking-tight">
                Swipe
                <span className="text-blue-600 dark:text-blue-400">
                  X
                </span>
              </span>

              <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/20 rounded text-[10px] font-bold">
                Recruiter
              </span>

            </div>

            <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">
              Employer Talent Portal
            </span>

          </div>
        </Link>

      </div>

      {/* =========================
          RECRUITER PROFILE CARD
      ========================= */}

      <div className="p-3 mx-3 mt-3 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80">

        <div className="flex items-center gap-2.5">

          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center shrink-0">

            <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />

          </div>

          <div className="flex-1 min-w-0">

            <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-50 truncate">
              {companyName}
            </h4>

            <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
              {recruiterName}
            </p>

          </div>

        </div>

      </div>

      {/* =========================
          NAVIGATION
      ========================= */}

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">

        <p className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Recruiting Suite
        </p>

        {navLinks.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold shadow-xs border border-blue-100 dark:border-blue-500/20"
                    : "text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-zinc-50 hover:bg-slate-100/80 dark:hover:bg-zinc-800/80"
                }`
              }
            >

              <div className="flex items-center gap-3">

                <Icon className="w-4 h-4" />

                <span>
                  {item.label}
                </span>

              </div>

              {item.badge !== null &&
                item.badge !== undefined && (
                  <span className="px-2 py-0.5 bg-blue-100/80 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 rounded-full text-[10px] font-bold">
                    {item.badge}
                  </span>
                )}

            </NavLink>
          );
        })}

      </nav>

      {/* =========================
          FOOTER
      ========================= */}

      <div className="p-3 border-t border-slate-200/80 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-950/50 space-y-2">

        <button
          type="button"
          onClick={handleLogout}
          id="btn-recruiter-logout"
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors"
        >

          <LogOut className="w-4 h-4" />

          <span>
            Sign Out
          </span>

        </button>

      </div>

    </aside>
  );
}

export default RecruiterSidebar;