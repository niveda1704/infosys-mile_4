import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Bell,
  Shield,
  Settings,
  LogOut,
  Search
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { RoleSwitcher } from "../RoleSwitcher";
import { ThemeToggle } from "../ThemeToggle";

export function AdminNavbar({ onToggleMobileMenu, isMobileMenuOpen }) {
  const { adminProfile, logout, unreadNotificationsCount } = useApp();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs h-16 text-slate-900 dark:text-white">
      <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left Side: Mobile Menu Button & Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl lg:hidden"
            aria-label="Toggle Navigation"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Platform Control</span>
            <span className="text-slate-600 dark:text-zinc-300">/</span>
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              SwipeX
            </span>
          </div>
        </div>

        {/* Right Side: Role Switcher + Notifications + Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Role Switcher */}
          <RoleSwitcher />

          <ThemeToggle />

          {/* System Alerts */}
          <Link
            to="/admin/notifications"
            className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
            aria-label="System Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span id="admin-bell-badge" className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-purple-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-zinc-900">
                {unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount}
              </span>
            )}
          </Link>

          {/* Admin Avatar Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all"
            >
              <span className="w-8 h-8 rounded-lg bg-purple-600 text-white text-xs font-bold flex items-center justify-center">{(adminProfile.name || "A").trim().slice(0, 1).toUpperCase()}</span>
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 top-11 w-56 bg-white dark:bg-zinc-800 rounded-2xl shadow-xl border border-slate-200 dark:border-zinc-700 py-1.5 z-50 text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2.5 border-b border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {adminProfile.name}
                  </p>
                  <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium truncate">
                    {adminProfile.role}
                  </p>
                </div>

                <Link
                  to="/admin/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-700 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>Admin Settings</span>
                </Link>

                <div className="my-1 border-t border-slate-200 dark:border-slate-800" />

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                    navigate("/login");
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default AdminNavbar;
