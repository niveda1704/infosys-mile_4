import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  Building2,
  Bell,
  Menu,
  X,
  ChevronDown,
  User,
  LogOut,
  SlidersHorizontal,
  ArrowRight,
  Briefcase,
} from "lucide-react";

import { useApp } from "../context/AppContext";
import { NotificationPanel } from "./NotificationPanel";
import { RoleSwitcher } from "./RoleSwitcher";
import { ThemeToggle } from "./ThemeToggle";

export function Navbar({ onMenuClick, sidebarOpen }) {
  const {
    user,
    isAuthenticated,
    logout,
    unreadNotificationsCount,
    setIsFilterModalOpen,
    searchQuery,
    setSearchQuery,
  } = useApp();

  const location = useLocation();
  const navigate = useNavigate();

  const [searchMode, setSearchMode] = useState(
    location.pathname.startsWith("/companies") ? "companies" : "jobs"
  );

  const [searchValue, setSearchValue] = useState(searchQuery || "");
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Keep search mode synced with URL
  useEffect(() => {
    if (location.pathname.startsWith("/companies")) {
      setSearchMode("companies");
    } else if (location.pathname.startsWith("/discover")) {
      setSearchMode("jobs");
    }
  }, [location.pathname]);

  // Keep the input in sync if searchQuery changes elsewhere
  // (e.g. cleared from DiscoverPage's empty state, or set from a URL param)
  useEffect(() => {
    setSearchValue(searchQuery || "");
  }, [searchQuery]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleModeChange = (mode) => {
    setSearchMode(mode);
    setSearchValue("");

    if (mode === "jobs") {
      setSearchQuery("");
      navigate("/discover");
    } else {
      navigate("/companies");
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchValue.trim();

    if (searchMode === "jobs") {
      // This is what actually drives DiscoverPage's fetch —
      // the URL below is just for shareable links / back-forward.
      setSearchQuery(query);
      navigate(
        query ? `/discover?search=${encodeURIComponent(query)}` : "/discover"
      );
    } else {
      navigate(
        query ? `/companies?search=${encodeURIComponent(query)}` : "/companies"
      );
    }
  };

  const handleFilters = () => {
    if (searchMode === "jobs") {
      if (setIsFilterModalOpen) {
        setIsFilterModalOpen(true);
      } else {
        const button = document.getElementById("btn-open-filters");
        if (button) button.click();
        else navigate("/discover");
      }
      return;
    }

    const companyButton = document.getElementById("btn-company-filters");
    if (companyButton) {
      companyButton.click();
    } else {
      navigate("/companies");
    }
  };

  const placeholder =
    searchMode === "jobs"
      ? "Search jobs, skills, roles..."
      : "Search companies, industries...";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md transition-all">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        
        {/* Top Navbar Row */}
        <div className="flex h-16 items-center justify-between gap-2.5 sm:gap-4 lg:gap-6">
          
          {/* LEFT - BRAND & MOBILE TOGGLE */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={onMenuClick}
              aria-label="Toggle navigation menu"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 dark:text-zinc-300 transition-colors hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-50 active:scale-95 lg:hidden"
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>

            <Link
              to="/"
              className="group flex items-center gap-2.5 outline-none rounded-xl focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-linear-to-tr from-brand-600 to-amber-500 text-white font-extrabold text-sm sm:text-base tracking-wider shadow-sm shadow-brand-500/20 transition-transform group-hover:scale-105">
                SX
              </div>

              <div className="hidden sm:flex flex-col">
                <span className="text-lg font-black tracking-tight text-slate-900 dark:text-zinc-50 leading-none">
                  Swipe<span className="text-brand-600 dark:text-brand-400">X</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-400 mt-0.5 tracking-tight">
                  Career Assistant
                </span>
              </div>
            </Link>
          </div>

          {/* CENTER - SEARCH BAR */}
          <div className="hidden md:flex flex-1 items-center justify-center max-w-xl min-w-0">
            <form onSubmit={handleSearch} className="w-full">
              <div className="group relative flex items-center rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950/70 p-1 transition-all duration-200 hover:border-slate-300 dark:hover:border-zinc-700 focus-within:border-brand-500 focus-within:bg-white dark:focus-within:bg-zinc-900 focus-within:ring-4 focus-within:ring-brand-500/10">
                
                {/* Mode Selector Pill */}
                <div className="flex items-center rounded-xl bg-slate-200/50 dark:bg-zinc-700/50 p-0.5 mr-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleModeChange("jobs")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      searchMode === "jobs"
                        ? "bg-white dark:bg-zinc-900 text-brand-700 dark:text-brand-300 shadow-sm"
                        : "text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-zinc-50"
                    }`}
                  >
                    <Briefcase className="h-3.5 w-3.5" />
                    Jobs
                  </button>

                  <button
                    type="button"
                    onClick={() => handleModeChange("companies")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      searchMode === "companies"
                        ? "bg-white dark:bg-zinc-900 text-brand-700 dark:text-brand-300 shadow-sm"
                        : "text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-zinc-50"
                    }`}
                  >
                    <Building2 className="h-3.5 w-3.5" />
                    Companies
                  </button>
                </div>

                {/* Input leading icon */}
                <div className="pl-2 pr-1 text-slate-400 group-focus-within:text-brand-600 dark:group-focus-within:text-brand-400 transition-colors">
                  <Search className="h-4 w-4" />
                </div>

                {/* Search Text Input */}
                <input
                  type="text"
                  id="job-search-input"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder={placeholder}
                  className="w-full min-w-0 bg-transparent py-1.5 pr-2 text-sm text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none"
                />

                {/* Filter Trigger Button */}
                <button
                  type="button"
                  id="btn-open-filters"
                  onClick={handleFilters}
                  aria-label="Open search filters"
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-zinc-300 shadow-xs transition-colors hover:border-brand-200 dark:hover:border-brand-500/20 hover:bg-brand-50 dark:hover:bg-brand-500/10 hover:text-brand-700 dark:hover:text-brand-300 active:scale-95 shrink-0"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>Filters</span>
                </button>

                {/* Submit Arrow Button */}
                <button
                  type="submit"
                  aria-label="Submit search"
                  className="ml-1 flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 text-white shadow-xs transition-all hover:bg-brand-700 active:scale-90 shrink-0"
                >
                  <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT SIDE - ROLE, NOTIFICATIONS, PROFILE (AVATAR + NAME + ROLE) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <ThemeToggle />
            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <div ref={notifRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setIsNotifOpen((prev) => !prev)}
                    className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl text-slate-600 dark:text-zinc-300 transition-colors hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-50 active:scale-95"
                    aria-label="Notifications"
                  >
                    <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                    {unreadNotificationsCount > 0 && (
                      <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-white dark:ring-zinc-900">
                        {unreadNotificationsCount > 9
                          ? "9+"
                          : unreadNotificationsCount}
                      </span>
                    )}
                  </button>

                  <NotificationPanel
                    isOpen={isNotifOpen}
                    onClose={() => setIsNotifOpen(false)}
                  />
                </div>

                {/* User Dropdown with Avatar, Name & Role */}
                <div ref={profileRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setIsProfileOpen((prev) => !prev)}
                    className="flex items-center gap-2 rounded-xl p-1.5 transition-all hover:bg-slate-100 dark:hover:bg-zinc-800 border border-transparent hover:border-slate-200/80 dark:hover:border-zinc-800/80 focus-visible:ring-2 focus-visible:ring-brand-500"
                  >
                    {/* Avatar */}
                    <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-brand-50 dark:bg-brand-500/10 ring-1 ring-brand-600/20 shrink-0">
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name || "Profile"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                      )}
                    </div>

                    {/* Name & Role */}
                    <div className="hidden sm:flex flex-col text-left max-w-32.5 md:max-w-37.5 leading-tight">
                      <span className="truncate text-xs font-bold text-slate-900 dark:text-zinc-50">
                        {user?.name || "ashif.siddique"}
                      </span>
                      <span className="truncate text-[10px] font-medium text-slate-400 mt-0.5">
                        {user?.role || "Full Stack Developer"}
                      </span>
                    </div>

                    <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform duration-150" />
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 top-12 w-64 origin-top-right rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1.5 shadow-xl ring-1 ring-slate-900/5 dark:ring-white/10 focus:outline-none z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="rounded-xl bg-slate-50 dark:bg-zinc-950 px-3.5 py-3 border border-slate-100 dark:border-zinc-800 mb-1">
                        <p className="truncate text-xs font-bold text-slate-900 dark:text-zinc-50">
                          {user?.name || "Candidate"}
                        </p>
                        <p className="truncate text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                          {user?.email}
                        </p>
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-200 transition-colors hover:bg-slate-50 dark:hover:bg-zinc-800/50 hover:text-slate-900 dark:hover:text-zinc-50"
                      >
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        Profile Settings
                      </Link>

                      <div className="my-1 border-t border-slate-100 dark:border-zinc-800" />

                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileOpen(false);
                          logout();
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 transition-colors hover:bg-rose-50 dark:hover:bg-rose-500/10"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  to="/login"
                  className="rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-zinc-200 transition-colors hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-950 dark:hover:text-zinc-50"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-brand-700 active:scale-95"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM MOBILE SEARCH BAR */}
        <div className="block md:hidden pb-3 pt-0.5">
          <div className="grid grid-cols-2 p-1 mb-2 bg-slate-100/90 dark:bg-zinc-800/90 rounded-xl">
            <button
              type="button"
              onClick={() => handleModeChange("jobs")}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                searchMode === "jobs"
                  ? "bg-white dark:bg-zinc-900 text-brand-700 dark:text-brand-300 shadow-xs"
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-100"
              }`}
            >
              <Briefcase className="h-3.5 w-3.5" />
              Jobs
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("companies")}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                searchMode === "companies"
                  ? "bg-white dark:bg-zinc-900 text-brand-700 dark:text-brand-300 shadow-xs"
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-100"
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              Companies
            </button>
          </div>

          <form onSubmit={handleSearch} className="w-full">
            <div className="flex items-center h-10 w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-950/80 p-1 focus-within:border-brand-500 focus-within:bg-white dark:focus-within:bg-zinc-900 focus-within:ring-2 focus-within:ring-brand-500/10 transition-all">
              <div className="pl-2 pr-1 text-slate-400">
                <Search className="h-4 w-4" />
              </div>

              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={placeholder}
                className="w-full min-w-0 bg-transparent py-1 px-1.5 text-xs text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none"
              />

              <button
                type="button"
                id="btn-open-filters-mobile"
                onClick={handleFilters}
                aria-label="Open search filters"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 transition-colors hover:bg-slate-50 dark:hover:bg-zinc-800/50 active:scale-95 shrink-0"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
              </button>

              <button
                type="submit"
                aria-label="Submit search"
                className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white shadow-xs transition-colors hover:bg-brand-700 active:scale-90 shrink-0"
              >
                <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
              </button>
            </div>
          </form>
        </div>

      </div>
    </header>
  );
}

export default Navbar;