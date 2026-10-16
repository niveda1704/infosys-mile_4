import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserCheck, Building2, ShieldCheck, ChevronDown, Check } from "lucide-react";
import { useApp } from "../context/AppContext";

export function RoleSwitcher({ className = "", compact = false }) {
  const { currentRole, switchRole } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const roles = [
    {
      id: "seeker",
      label: "Job Seeker",
      icon: UserCheck,
      path: "/",
      badge: "Candidate Portal",
      badgeColor: "bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-500/20"
    },
    {
      id: "recruiter",
      label: "Recruiter",
      icon: Building2,
      path: "/recruiter",
      badge: "Employer Portal",
      badgeColor: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/20"
    },
    {
      id: "admin",
      label: "Platform Admin",
      icon: ShieldCheck,
      path: "/admin",
      badge: "Super Admin",
      badgeColor: "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/20"
    }
  ];

  const currentRoleObj = roles.find((r) => r.id === currentRole) || roles[0];
  const CurrentIcon = currentRoleObj.icon;

  const handleSelectRole = (role) => {
    switchRole(role.id);
    setIsOpen(false);
    navigate(role.path);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        id="btn-role-switcher"
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-xs ${
          currentRole === "recruiter"
            ? "bg-blue-50/80 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-900 dark:text-blue-300 hover:bg-blue-100/80 dark:hover:bg-blue-500/15"
            : currentRole === "admin"
            ? "bg-purple-50/80 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20 text-purple-900 dark:text-purple-300 hover:bg-purple-100/80 dark:hover:bg-purple-500/15"
            : "bg-brand-50/80 dark:bg-brand-500/10 border-brand-200 dark:border-brand-500/20 text-brand-900 dark:text-brand-300 hover:bg-brand-100/80 dark:hover:bg-brand-500/15"
        }`}
        title="Switch user perspective (Job Seeker / Recruiter / Admin)"
      >
        <div
          className={`w-5 h-5 rounded-lg flex items-center justify-center text-white ${
            currentRole === "recruiter"
              ? "bg-blue-600"
              : currentRole === "admin"
              ? "bg-purple-600"
              : "bg-brand-600"
          }`}
        >
          <CurrentIcon className="w-3 h-3" />
        </div>

        <div className="flex flex-col text-left">
          <span className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase tracking-wider font-bold leading-none">
            Role
          </span>
          <span className="text-xs font-bold leading-tight">
            {compact ? currentRoleObj.label.split(" ")[0] : currentRoleObj.label}
          </span>
        </div>

        <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-64 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-slate-200 dark:border-zinc-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3.5 py-2 border-b border-slate-100 dark:border-zinc-800">
            <p className="text-xs font-bold text-slate-900 dark:text-zinc-50">Switch Workspace Role</p>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              Select an operational role to test or preview
            </p>
          </div>

          <div className="p-1.5 space-y-1">
            {roles.map((role) => {
              const Icon = role.icon;
              const isSelected = currentRole === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleSelectRole(role)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                    isSelected
                      ? "bg-slate-100 dark:bg-zinc-800 font-bold text-slate-900 dark:text-zinc-50"
                      : "hover:bg-slate-50 dark:hover:bg-zinc-800/50 text-slate-600 dark:text-zinc-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center border ${role.badgeColor}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-zinc-50">{role.label}</p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400">{role.badge}</p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-brand-600 dark:text-brand-400 stroke-[2.5]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default RoleSwitcher;
