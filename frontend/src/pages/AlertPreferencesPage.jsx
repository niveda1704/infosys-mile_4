import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BellRing, Loader2, Save } from "lucide-react";
import { notificationService } from "../services/notificationService";
import { useApp } from "../context/AppContext";

const TYPES = [
  ["high_match", "High-match jobs", "A new job that matches your profile above your match threshold."],
  ["low_competition", "Low-competition jobs", "A matching job that few people have applied to yet."],
  ["startup_hiring", "Startup hiring", "Startups that are hiring for roles that fit you."],
  ["instant_job", "Every new job", "An alert for every new job in your field (can be noisy)."],
];
const CHANNELS = [
  ["channel_email", "Email", "Sent through the configured email backend."],
  ["channel_push", "Push", "Needs a push provider to be configured on the server."],
];

function Toggle({ checked, onChange, id }) {
  return (
    <button type="button" role="switch" aria-checked={checked} id={id} onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${checked ? "bg-brand-600" : "bg-slate-300 dark:bg-zinc-700"}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${checked ? "translate-x-5" : ""}`} />
    </button>
  );
}

export function AlertPreferencesPage() {
  const { addToast } = useApp();
  const [prefs, setPrefs] = useState(null);
  const [delivery, setDelivery] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    notificationService
      .getPreferences()
      .then((d) => { setPrefs(d.preferences); setDelivery(d.delivery || {}); })
      .catch(() => setError("Could not load your alert settings."));
  }, []);

  const set = (key, value) => setPrefs((p) => ({ ...p, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      const body = {
        ...Object.fromEntries([...TYPES, ...CHANNELS].map(([k]) => [k, !!prefs[k]])),
        match_threshold: Number(prefs.match_threshold),
        quiet_start: prefs.quiet_start || null,
        quiet_end: prefs.quiet_end || null,
        tz_offset_minutes: -new Date().getTimezoneOffset(),
      };
      const d = await notificationService.savePreferences(body);
      setPrefs(d.preferences);
      addToast?.("Alert preferences saved", "success");
    } catch (e) {
      addToast?.(e?.response?.data?.message || "Could not save preferences", "error");
    } finally {
      setSaving(false);
    }
  };

  const card = "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 mb-5";
  const row = "flex items-start justify-between gap-4 py-3 border-t first:border-t-0 border-slate-100 dark:border-zinc-800";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <Link to="/notifications" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-zinc-400 mb-4">
        <ArrowLeft className="w-4 h-4" /> Notifications
      </Link>
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-brand-50 dark:bg-brand-500/10 rounded-xl"><BellRing className="w-5 h-5 text-brand-600 dark:text-brand-400" /></div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-zinc-50">Alert preferences</h1>
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}
      {!prefs && !error && <Loader2 className="w-6 h-6 animate-spin text-brand-600" />}

      {prefs && (
        <>
          <div className={card}>
            <h2 className="font-bold text-slate-900 dark:text-zinc-50 mb-1">What should we alert you about?</h2>
            {TYPES.map(([key, label, hint]) => (
              <div key={key} className={row}>
                <div><p className="text-sm font-semibold text-slate-800 dark:text-zinc-100">{label}</p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">{hint}</p></div>
                <Toggle id={`pref-${key}`} checked={!!prefs[key]} onChange={(v) => set(key, v)} />
              </div>
            ))}
            <div className="pt-4 border-t border-slate-100 dark:border-zinc-800">
              <label className="text-sm font-semibold text-slate-800 dark:text-zinc-100" htmlFor="threshold">
                Minimum match for high-match alerts: {prefs.match_threshold}%
              </label>
              <input id="threshold" type="range" min="0" max="100" step="5" value={prefs.match_threshold}
                onChange={(e) => set("match_threshold", Number(e.target.value))} className="w-full accent-brand-600 mt-2" />
            </div>
          </div>

          <div className={card}>
            <h2 className="font-bold text-slate-900 dark:text-zinc-50 mb-1">Where should we send them?</h2>
            <div className={row}>
              <div><p className="text-sm font-semibold text-slate-800 dark:text-zinc-100">In-app</p>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Always on - shows in the bell and the notifications page.</p></div>
              <Toggle checked disabled onChange={() => {}} />
            </div>
            {CHANNELS.map(([key, label, hint]) => (
              <div key={key} className={row}>
                <div><p className="text-sm font-semibold text-slate-800 dark:text-zinc-100">{label}</p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">{hint}
                    {key === "channel_email" && delivery.email_backend === "console" && " (This server only logs emails - SMTP is not configured.)"}
                    {key === "channel_push" && !delivery.push_configured && " (Push is not configured on this server.)"}</p></div>
                <Toggle id={`pref-${key}`} checked={!!prefs[key]} onChange={(v) => set(key, v)} />
              </div>
            ))}
          </div>

          <div className={card}>
            <h2 className="font-bold text-slate-900 dark:text-zinc-50 mb-1">Quiet hours</h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-3">No email or push in this window. In-app alerts still arrive.</p>
            <div className="flex items-center gap-3">
              <input type="time" value={prefs.quiet_start || ""} onChange={(e) => set("quiet_start", e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm" />
              <span className="text-xs text-slate-500">to</span>
              <input type="time" value={prefs.quiet_end || ""} onChange={(e) => set("quiet_end", e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm" />
            </div>
          </div>

          <button type="button" onClick={save} disabled={saving} id="btn-save-prefs"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save preferences
          </button>
        </>
      )}
    </div>
  );
}

export default AlertPreferencesPage;
