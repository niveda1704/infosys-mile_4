import React, { useEffect, useState } from "react";
import { Bell, Building2, Check, CheckCheck, ShieldAlert, Trash2, UserX } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { adminService } from "../../services/adminService";
import { useApp } from "../../context/AppContext";

const tones = {
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
};

export function AdminNotificationsPage() {
  const { notifications, unreadNotificationsCount, markNotificationRead, markAllNotificationsRead, clearNotification } = useApp();
  const navigate = useNavigate();
  const [ov, setOv] = useState(null);
  const [err, setErr] = useState("");

  // Live queue counters come straight from the admin overview endpoint.
  useEffect(() => {
    const load = () => adminService.overview().then(setOv).catch(() => setErr("Could not load moderation queues"));
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const c = ov?.counts || {};
  const queues = [];
  if (c.pending_recruiters) queues.push({ id: "pr", icon: Building2, tone: "blue", title: "Recruiters awaiting approval", message: `${c.pending_recruiters} recruiter account(s) are Pending.`, link: "/admin/recruiters" });
  if (c.pending_jobs) queues.push({ id: "pj", icon: ShieldAlert, tone: "rose", title: "Jobs awaiting moderation", message: `${c.pending_jobs} job(s) are Pending Approval.`, link: "/admin/jobs" });
  if (c.suspended_users) queues.push({ id: "su", icon: UserX, tone: "amber", title: "Suspended accounts", message: `${c.suspended_users} account(s) are currently suspended.`, link: "/admin/users" });

  const open = (n) => {
    if (!n.read) markNotificationRead(n.id);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Alerts</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Live moderation queues and platform notifications.{" "}
            <span id="admin-unread-count" className="font-semibold text-purple-600 dark:text-purple-400">{unreadNotificationsCount} unread</span>
          </p>
        </div>
        <button
          type="button"
          id="btn-admin-mark-all-read"
          onClick={markAllNotificationsRead}
          disabled={unreadNotificationsCount === 0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <CheckCheck className="w-4 h-4" />Mark all read
        </button>
      </div>

      {queues.length > 0 && (
        <div className="grid sm:grid-cols-3 gap-3">
          {queues.map((a) => (
            <Link key={a.id} to={a.link} className={`p-4 rounded-2xl border flex items-start gap-3 hover:opacity-90 ${tones[a.tone]}`}>
              <a.icon className="w-5 h-5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold">{a.title}</p>
                <p className="text-[11px] mt-0.5 opacity-80">{a.message}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
      {err && <p className="text-xs text-rose-600 dark:text-rose-400">{err}</p>}

      <div id="admin-notification-feed" className="bg-white dark:bg-zinc-900/90 rounded-3xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden">
        {notifications.map((n) => (
          <div
            key={n.id}
            data-read={n.read ? "true" : "false"}
            className={`p-5 flex items-start gap-4 ${n.read ? "" : "bg-purple-50/70 dark:bg-purple-500/5"}`}
          >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${tones.purple}`}><Bell className="w-5 h-5" /></div>
            <button type="button" onClick={() => open(n)} className="flex-1 min-w-0 text-left">
              <div className="flex justify-between gap-2">
                <h3 className={`text-sm text-slate-900 dark:text-white ${n.read ? "font-semibold" : "font-bold"}`}>
                  {!n.read && <span className="inline-block w-2 h-2 rounded-full bg-purple-600 mr-2 align-middle" />}
                  {n.title}
                </h3>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 shrink-0">{n.time}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{n.message}</p>
            </button>
            <div className="flex items-center gap-1 shrink-0">
              {!n.read && (
                <button type="button" title="Mark as read" aria-label="Mark as read" data-action="mark-read" onClick={() => markNotificationRead(n.id)}
                  className="p-2 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-slate-100 dark:hover:bg-zinc-800"><Check className="w-4 h-4" /></button>
              )}
              <button type="button" title="Dismiss" aria-label="Dismiss" onClick={() => clearNotification(n.id)}
                className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-zinc-800"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
        {notifications.length === 0 && <p className="p-6 text-xs text-slate-500 dark:text-slate-400 text-center">No notifications yet. New sign-ups and jobs awaiting approval will appear here.</p>}
      </div>
    </div>
  );
}

export default AdminNotificationsPage;
