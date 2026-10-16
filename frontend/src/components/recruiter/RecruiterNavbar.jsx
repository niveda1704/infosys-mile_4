import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Bell,
  PlusCircle,
  Building2,
  LogOut,
  User,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { authService } from "../../services/authService";
import { ThemeToggle } from "../ThemeToggle";

export function RecruiterNavbar({
  onToggleMobileMenu,
  isMobileMenuOpen,
}) {
  const { user, logout } = useApp();

  const [isProfileOpen, setIsProfileOpen] =
    useState(false);

  const [profile, setProfile] = useState(() => {
    try {
      const cachedUser =
        localStorage.getItem("swipex_user");

      return cachedUser
        ? JSON.parse(cachedUser)
        : null;
    } catch {
      return null;
    }
  });

  const navigate = useNavigate();

  // =========================
  // LOAD CURRENT USER
  // =========================

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response =
        await authService.getCurrentUser();

      const currentUser =
        response.user || response;

      setProfile(currentUser);

      localStorage.setItem(
        "swipex_user",
        JSON.stringify(currentUser)
      );
    } catch (error) {
      console.error(
        "Failed to load recruiter profile:",
        error
      );

      // Fall back to AppContext user
      if (user) {
        setProfile(user);
      }
    }
  };

  // =========================
  // KEEP CONTEXT USER IN SYNC
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
  // DISPLAY VALUES
  // =========================

  const recruiterName =
    profile?.name || "Recruiter";

  const recruiterEmail =
    profile?.email || "";

  const companyName =
    profile?.company_name ||
    profile?.companyName ||
    "Your Company";

  const recruiterLogo =
    profile?.logo ||
    profile?.avatar ||
    null;

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = async () => {
    setIsProfileOpen(false);

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

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800 shadow-xs h-16">
      <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">

        {/* =========================
            LEFT SIDE
        ========================= */}

        <div className="flex items-center gap-3">

          {/* Mobile Menu */}

          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="p-2 text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-zinc-50 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl lg:hidden"
            aria-label="Toggle Navigation"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>

          {/* Breadcrumb */}

          <div className="hidden sm:flex items-center gap-2">

            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
              Employer Portal
            </span>

            <span className="text-slate-300">
              /
            </span>

            <span className="text-xs font-bold text-slate-800 dark:text-zinc-100 max-w-[220px] truncate">
              {companyName}
            </span>

          </div>
        </div>

        {/* =========================
            RIGHT SIDE
        ========================= */}

        <div className="flex items-center gap-2.5 sm:gap-3">

          {/* Post Job */}

          <Link
            to="/recruiter/post-job"
            id="btn-nav-post-job"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />

            <span className="hidden sm:inline">
              Post a Job
            </span>
          </Link>

          <ThemeToggle />

          {/* Notifications */}

          <Link
            to="/recruiter/notifications"
            className="relative p-2 text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-zinc-50 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />

            <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white dark:ring-zinc-900" />
          </Link>

          {/* =========================
              PROFILE DROPDOWN
          ========================= */}

          <div className="relative">

            <button
              type="button"
              onClick={() =>
                setIsProfileOpen(
                  (previous) => !previous
                )
              }
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all"
              aria-label="Open recruiter profile menu"
            >

              {recruiterLogo ? (
                <img
                  src={recruiterLogo}
                  alt={recruiterName}
                  className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-zinc-800"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
              )}

            </button>

            {isProfileOpen && (
              <div className="absolute right-0 top-11 w-60 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-slate-200 dark:border-zinc-800 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">

                {/* User Info */}

                <div className="px-4 py-3 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950/70">

                  <p className="text-xs font-bold text-slate-900 dark:text-zinc-50 truncate">
                    {recruiterName}
                  </p>

                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                    {recruiterEmail}
                  </p>

                  <div className="flex items-center gap-1 mt-2">

                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />

                    <span className="text-[10px] font-bold text-brand-700 dark:text-brand-300">
                      Recruiter
                    </span>

                  </div>
                </div>

                {/* Company Profile */}

                <Link
                  to="/recruiter/profile"
                  onClick={() =>
                    setIsProfileOpen(false)
                  }
                  className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <Building2 className="w-4 h-4 text-slate-400" />

                  <span>
                    Company Profile
                  </span>
                </Link>

                {/* Divider */}

                <div className="my-1 border-t border-slate-100 dark:border-zinc-800" />

                {/* Logout */}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />

                  <span>
                    Sign Out
                  </span>
                </button>

              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}

export default RecruiterNavbar;