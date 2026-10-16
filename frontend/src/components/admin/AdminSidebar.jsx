import React, { useEffect, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  ShieldAlert,
  Users,
  Building2,
  Briefcase,
  FileSpreadsheet,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  ExternalLink,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { RoleSwitcher } from "../RoleSwitcher";
import { API_BASE_URL } from "../../services/http";

export function AdminSidebar({ mobile = false, onClose }) {
  const { adminUsers, adminRecruiters, adminJobs, adminApplications, logout, adminProfile, unreadNotificationsCount } = useApp();
  const [health, setHealth] = useState(null); // null = checking, otherwise {ok, down:[]}
  useEffect(() => {
    let alive = true;
    const check = () =>
      fetch(`${API_BASE_URL}/health`).then((r) => r.json()).then((d) => {
        if (!alive) return;
        const svc = d.services || {};
        const down = Object.keys(svc).filter((k) => svc[k]?.status !== "ok");
        setHealth({ ok: down.length === 0, down });
      }).catch(() => alive && setHealth({ ok: false, down: ["gateway"] }));
    check();
    const t = setInterval(check, 30000);
    return () => { alive = false; clearInterval(t); };
  }, []);
  const navigate = useNavigate();

  const navLinks = [
    {
      to: "/admin",
      label: "Overview",
      icon: BarChart3,
      end: true
    },
    {
      to: "/admin/users",
      label: "User Management",
      icon: Users,
      badge: adminUsers?.length || null
    },
    {
      to: "/admin/recruiters",
      label: "Recruiters & Orgs",
      icon: Building2,
      badge: adminRecruiters?.length || null
    },
    {
      to: "/admin/jobs",
      label: "Job Moderation",
      icon: Briefcase,
      badge: adminJobs?.length || null
    },
    {
      to: "/admin/applications",
      label: "Applications",
      icon: FileSpreadsheet,
      badge: adminApplications?.length || null
    },
    {
      to: "/admin/reports",
      label: "Platform Analytics",
      icon: BarChart3
    },
    {
      to: "/admin/notifications",
      label: "System Alerts",
      icon: Bell,
      badge: unreadNotificationsCount || null
    },
    {
      to: "/admin/settings",
      label: "Admin Settings",
      icon: Settings
    }
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside
      className={`flex flex-col h-full bg-white dark:bg-zinc-900 text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 ${
        mobile ? "w-full" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <Link
          to="/admin"
          onClick={onClose}
          className="flex items-center gap-2.5 group"
        >
          <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-xs font-bold text-sm">
            SX
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Swipe<span className="text-purple-600 dark:text-purple-400">X</span>
              </span>
              <span className="px-1.5 py-0.2 bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700/60 rounded text-[10px] font-bold">
                Admin
              </span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              Platform Control Center
            </span>
          </div>
        </Link>
      </div>

      {/* Admin Status Pill */}
      <div className="p-3 mx-3 mt-3 bg-slate-50 dark:bg-zinc-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{adminProfile?.name || "Admin"}</p>
            <p id="admin-health" className={`text-[10px] ${health?.ok ? "text-emerald-600 dark:text-emerald-400" : health ? "text-rose-600 dark:text-rose-400" : "text-slate-500"}`}>
              {!health ? "Checking services..." : health.ok ? "All services healthy" : `Degraded: ${health.down.join(", ")}`}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 pb-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Administration
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
                    ? "bg-purple-600 text-white font-bold shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-800/80"
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
              {item.badge !== null && item.badge !== undefined && (
                <span
                  className="px-2 py-0.5 bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-slate-200 rounded-full text-[10px] font-bold border border-slate-300 dark:border-slate-600"
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}

        <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
          <p className="px-3 pb-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Workspace Mode
          </p>
          <div className="px-1">
            <RoleSwitcher className="w-full" />
          </div>
        </div>
      </nav>

      {/* Footer / Quick Actions */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-zinc-800/80 space-y-1.5">
        <Link
          to="/"
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Job Seeker App</span>
          </span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          id="btn-admin-logout"
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

export default AdminSidebar;
