import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  Trash2,
  Sparkles,
  Briefcase,
  FileText,
  Rocket,
  ExternalLink,
  ArrowRight
} from "lucide-react";
import { useApp } from "../context/AppContext";

export function NotificationsPage() {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotification,
    unreadNotificationsCount
  } = useApp();
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    return true;
  });

  const getIcon = (type) => {
    switch (type) {
      case "match":
        return <Sparkles className="w-5 h-5 text-brand-600 dark:text-brand-400" />;
      case "opportunity":
        return <Rocket className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      case "ats":
        return <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case "application":
        return <Briefcase className="w-5 h-5 text-teal-600 dark:text-teal-400" />;
      default:
        return <Bell className="w-5 h-5 text-slate-500 dark:text-zinc-400" />;
    }
  };

  const handleNotificationClick = (notif) => {
    markNotificationRead(notif.id);
    if (notif.jobId) {
      navigate(`/jobs/${notif.jobId}`);
    } else if (notif.link) {
      navigate(notif.link);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 rounded-xl">
              <Bell className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight">
              Notifications
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
            {unreadNotificationsCount} unread alerts, job recommendations, and recruiter updates
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            to="/notifications/preferences"
            id="link-alert-prefs"
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-zinc-800"
          >
            <Bell className="w-4 h-4" />
            <span>Alert settings</span>
          </Link>
          {unreadNotificationsCount > 0 && (
            <button
              type="button"
              onClick={markAllNotificationsRead}
              id="btn-mark-all-read"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-50 dark:bg-brand-500/10 hover:bg-brand-100 dark:hover:bg-brand-500/15 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-500/20 rounded-xl text-xs font-semibold transition-all"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark All as Read</span>
            </button>
          )}

          <div className="flex items-center p-1 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === "all"
                  ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-50 shadow-2xs font-bold"
                  : "text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-zinc-50"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter("unread")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === "unread"
                  ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-50 shadow-2xs font-bold"
                  : "text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-zinc-50"
              }`}
            >
              Unread
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs p-12 text-center max-w-md mx-auto my-8">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-50 mb-1">
            No notifications
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed mb-6">
            You're all caught up! New job alerts, interview notifications, and ATS suggestions will appear here.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            <span>Explore Jobs</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                notif.read
                  ? "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 shadow-2xs"
                  : "bg-brand-50/40 dark:bg-brand-500/10 border-brand-200 dark:border-brand-500/20 hover:bg-brand-50/70 dark:hover:bg-brand-500/10 shadow-xs"
              }`}
            >
              <div className="p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-2xs shrink-0">
                {getIcon(notif.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-50">{notif.title}</h3>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-brand-600" />
                    )}
                  </div>
                  <span className="text-xs text-slate-400 font-medium">{notif.time}</span>
                </div>

                <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">{notif.message}</p>

                {(notif.jobId || notif.link) && (
                  <div className="mt-2.5 flex items-center gap-1 text-xs font-bold text-brand-700 dark:text-brand-300 hover:text-brand-800 dark:hover:text-brand-300">
                    <span>{notif.jobId ? "View Job Match" : "View Details"}</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearNotification(notif.id);
                  }}
                  className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                  title="Dismiss notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;
