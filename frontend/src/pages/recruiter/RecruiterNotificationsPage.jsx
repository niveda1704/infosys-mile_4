import React, { useCallback, useEffect, useState } from "react";
import { Bell, Briefcase, Sparkles, CheckCheck, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { notificationService, toUiNotification } from "../../services/notificationService";

/** Recruiter inbox: new applicants and other activity, stored by the job service. */
export function RecruiterNotificationsPage() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const { notifications } = await notificationService.list({ limit: 100 });
      setItems(notifications.map(toUiNotification));
      setError(null);
    } catch {
      setError("Unable to load notifications.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, [load]);

  const markAll = async () => {
    setItems((list) => list.map((n) => ({ ...n, read: true })));
    notificationService.markAllRead().catch(load);
  };

  const open = (n) => {
    if (!n.read) {
      setItems((list) => list.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      notificationService.markRead(n.id).catch(load);
    }
  };

  const remove = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    setItems((list) => list.filter((n) => n.id !== id));
    notificationService.remove(id).catch(load);
  };

  const unread = items.filter((n) => !n.read).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight">
            Recruiter Notifications
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
            New applicants and activity on your job postings.
          </p>
        </div>
        {unread > 0 && (
          <button
            type="button"
            onClick={markAll}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-700"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {isLoading && <p className="text-xs text-slate-500 text-center py-10">Loading...</p>}
      {error && <p className="text-xs text-rose-600 text-center py-4">{error}</p>}

      {!isLoading && !error && items.length === 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-12 text-center">
          <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-zinc-100">No notifications yet</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            You will be notified when candidates apply to your jobs.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {items.map((n) => (
          <Link
            key={n.id}
            to={n.link || "/recruiter/applicants"}
            onClick={() => open(n)}
            className={`flex items-start gap-4 p-4 rounded-2xl border transition-colors ${
              n.read
                ? "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800"
                : "bg-blue-50/60 dark:bg-blue-500/5 border-blue-200 dark:border-blue-500/20"
            }`}
          >
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
              {n.type === "match" ? <Sparkles className="w-5 h-5" /> : <Briefcase className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-50">{n.title}</h3>
                <span className="text-[11px] text-slate-400 font-medium shrink-0">{n.time}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-300 mt-1 leading-relaxed">{n.message}</p>
            </div>
            <button
              type="button"
              onClick={(e) => remove(e, n.id)}
              aria-label="Dismiss notification"
              className="p-1.5 text-slate-400 hover:text-rose-500 shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default RecruiterNotificationsPage;
