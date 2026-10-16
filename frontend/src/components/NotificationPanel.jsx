import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  Sparkles,
  Briefcase,
  FileText,
  Rocket,
  ExternalLink,
  X
} from "lucide-react";
import { useApp } from "../context/AppContext";

export function NotificationPanel({ isOpen, onClose }) {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotification,
    unreadNotificationsCount
  } = useApp();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const getIcon = (type) => {
    switch (type) {
      case "match":
        return <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />;
      case "opportunity":
        return <Rocket className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case "ats":
        return <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case "application":
        return <Briefcase className="w-4 h-4 text-teal-600 dark:text-teal-400" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600 dark:text-zinc-300" />;
    }
  };

  const handleNotificationClick = (notif) => {
    markNotificationRead(notif.id);
    if (notif.jobId) {
      navigate(`/jobs/${notif.jobId}`);
      onClose();
    } else if (notif.link) {
      navigate(notif.link);
      onClose();
    }
  };

  return (
    <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-slate-200 dark:border-zinc-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/70 dark:bg-zinc-950/70">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-50">Notifications</h3>
          {unreadNotificationsCount > 0 && (
            <span className="px-2 py-0.5 bg-brand-600 text-white rounded-full text-[10px] font-bold">
              {unreadNotificationsCount} new
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {unreadNotificationsCount > 0 && (
            <button
              type="button"
              onClick={markAllNotificationsRead}
              className="text-[11px] font-semibold text-brand-700 dark:text-brand-300 hover:text-brand-800 dark:hover:text-brand-300 flex items-center gap-1 p-1 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg transition-colors"
              title="Mark all as read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notifications list */}
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800">
        {notifications.length === 0 ? (
          <div className="py-8 text-center px-4">
            <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600 dark:text-zinc-300">No new notifications</p>
            <p className="text-[11px] text-slate-400">You're all caught up!</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                notif.read ? "bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800/50" : "bg-brand-50/50 dark:bg-brand-500/10 hover:bg-brand-100/60 dark:hover:bg-brand-500/15"
              }`}
            >
              <div className="p-2 bg-white dark:bg-zinc-900 rounded-xl shadow-xs border border-slate-100 dark:border-zinc-800 shrink-0 mt-0.5">
                {getIcon(notif.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <p className="text-xs font-bold text-slate-900 dark:text-zinc-50 truncate">{notif.title}</p>
                  <span className="text-[10px] text-slate-400 shrink-0">{notif.time}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-300 leading-snug line-clamp-2">{notif.message}</p>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearNotification(notif.id);
                }}
                className="p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors shrink-0"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 bg-slate-50 dark:bg-zinc-950 border-t border-slate-100 dark:border-zinc-800 text-center">
        <Link
          to="/notifications"
          onClick={onClose}
          className="text-xs font-bold text-brand-700 dark:text-brand-300 hover:text-brand-800 dark:hover:text-brand-300 transition-colors inline-flex items-center gap-1"
        >
          <span>View All Notifications</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

export default NotificationPanel;
