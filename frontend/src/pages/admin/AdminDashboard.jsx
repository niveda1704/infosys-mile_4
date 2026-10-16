import React, { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";
import { AdminAnalytics } from "../../components/RoleAnalytics";
import { Link } from "react-router-dom";
import {
  Users,
  Building2,
  Briefcase,
  FileSpreadsheet,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Activity,
  UserCheck
} from "lucide-react";
import { useApp } from "../../context/AppContext";

export function AdminDashboard() {
  const {
    adminUsers,
    adminRecruiters,
    adminJobs,
    adminApplications
  } = useApp();
  const [ov, setOv] = useState(null);
  useEffect(() => {
    let live = true;
    const load = () => adminService.overview().then((d) => live && setOv(d)).catch(() => {});
    load();
    const t = setInterval(load, 30000);
    return () => { live = false; clearInterval(t); };
  }, []);
  const c = ov?.counts || {};

  const pendingRecruiterApprovals = adminRecruiters.filter(
    (r) => r.status === "Pending"
  ).length;

  const flaggedJobs = adminJobs.filter((j) => j.status === "Pending Approval").length;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-slate-900 dark:via-zinc-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white border border-purple-800/40 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/20 backdrop-blur-md rounded-full text-xs font-semibold text-purple-200 mb-3 border border-purple-400/30">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
            <span>SwipeX Admin Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Platform Overview
          </h1>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Monitor ecosystem health, review recruiter verification credentials, moderate job requisitions, and inspect user activity metrics.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <Link
              to="/admin/users"
              id="btn-admin-view-users"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95"
            >
              <Users className="w-4 h-4" />
              <span>Manage User Base ({adminUsers.length})</span>
            </Link>

            <Link
              to="/admin/recruiters"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 dark:bg-zinc-700/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-all"
            >
              <Building2 className="w-4 h-4" />
              <span>Verify Employers ({pendingRecruiterApprovals} Pending)</span>
            </Link>
          </div>
        </div>

        {/* Decorative glow */}
        <div className="absolute -right-12 -bottom-16 w-64 h-64 rounded-full bg-purple-600/20 blur-3xl pointer-events-none" />
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white dark:bg-zinc-900/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Registered Users</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{c.users ?? adminUsers.length}</h3>
            <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3" />
              <span>+{c.signups_7d ?? 0} this week</span>
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Recruiters & Orgs</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {c.recruiters ?? adminRecruiters.length}
            </h3>
            <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 mt-0.5 block">
              {pendingRecruiterApprovals} waiting review
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Moderated Jobs</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{adminJobs.length}</h3>
            <span className="text-[11px] font-medium text-brand-600 dark:text-brand-400 mt-0.5 block">
              {adminJobs.filter((j) => j.status === "Active").length} active now
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Applications</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {c.applications ?? adminApplications.length}
            </h3>
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-0.5 block">
              {c.suspended_users ?? 0} suspended accounts
            </span>
          </div>
        </div>
      </div>

      {/* Action queue + recent sign-ups (real data) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-white dark:bg-zinc-900/90 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Recent sign-ups</span>
            </h2>
            <Link to="/admin/users" className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1">
              <span>All users</span><ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {(ov?.recent_signups || []).map((u) => (
            <div key={u.id} className="flex items-center justify-between text-xs border-b border-slate-200 dark:border-slate-800 pb-2">
              <div><p className="font-bold text-slate-900 dark:text-white">{u.name}</p><p className="text-slate-500 dark:text-slate-400">{u.email}</p></div>
              <span className="text-purple-700 dark:text-purple-300 font-semibold">{u.role}</span>
            </div>
          ))}
          {ov && ov.recent_signups.length === 0 && <p className="text-xs text-slate-500 dark:text-slate-400">No users yet.</p>}
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Action Required</h2>
            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800/80 text-amber-700 dark:text-amber-300 rounded-full text-[10px] font-bold">
              {(c.pending_recruiters ?? pendingRecruiterApprovals) + (c.pending_jobs ?? flaggedJobs)} Items
            </span>
          </div>
          <div className="bg-white dark:bg-zinc-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-2">
            <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" /><span className="text-xs font-bold text-slate-900 dark:text-white">Employer approvals</span></div>
            <p className="text-xs text-slate-600 dark:text-slate-300">{c.pending_recruiters ?? 0} recruiter account(s) waiting for approval.</p>
            <div className="flex justify-end"><Link to="/admin/recruiters" className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold">Review</Link></div>
          </div>
          <div className="bg-white dark:bg-zinc-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-2">
            <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" /><span className="text-xs font-bold text-slate-900 dark:text-white">Job moderation</span></div>
            <p className="text-xs text-slate-600 dark:text-slate-300">{c.pending_jobs ?? 0} job(s) pending approval.</p>
            <div className="flex justify-end"><Link to="/admin/jobs" className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold">Moderate</Link></div>
          </div>
        </div>
      </div>

      <AdminAnalytics />
    </div>
  );
}

export default AdminDashboard;
