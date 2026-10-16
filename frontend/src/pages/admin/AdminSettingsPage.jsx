import React, { useEffect, useState } from "react";
import { Sliders, Save, Server } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { adminService } from "../../services/adminService";
import { API_BASE_URL } from "../../services/http";

export function AdminSettingsPage() {
  const { adminProfile, updateAdminProfile, addToast } = useApp();
  const [name, setName] = useState(adminProfile.name || "");
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [health, setHealth] = useState(null);

  useEffect(() => { setName(adminProfile.name || ""); }, [adminProfile.name]);
  useEffect(() => {
    adminService.settings().then(setSettings).catch(() => addToast("Could not load platform settings", "error"));
    fetch(`${API_BASE_URL}/health`).then((r) => r.json()).then(setHealth).catch(() => setHealth({ status: "down" }));
  }, [addToast]);

  const saveProfile = async (e) => {
    e.preventDefault();
    if (name.trim()) await updateAdminProfile({ name: name.trim() });
  };

  const savePolicies = async () => {
    setSaving(true);
    try {
      setSettings(await adminService.saveSettings(settings));
      addToast("Platform policies saved", "success");
    } catch (err) {
      addToast(err?.response?.data?.message || "Could not save settings", "error");
    } finally { setSaving(false); }
  };

  const toggle = (key, title, desc) => (
    <label className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-slate-200 dark:border-zinc-700/60 cursor-pointer">
      <div className="space-y-0.5"><p className="text-xs font-bold text-slate-900 dark:text-white">{title}</p><p className="text-[11px] text-slate-500 dark:text-slate-400">{desc}</p></div>
      <input type="checkbox" disabled={!settings} checked={!!settings?.[key]}
        onChange={(e) => setSettings({ ...settings, [key]: e.target.checked })}
        className="w-4 h-4 rounded text-purple-600 bg-slate-100 dark:bg-zinc-800 border-slate-600" />
    </label>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Settings</h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Your admin profile, platform policies and service health.</p>
      </div>

      <form onSubmit={saveProfile} className="bg-white dark:bg-zinc-900/90 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Admin profile</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Full name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-800/80 border border-slate-300 dark:border-zinc-700 rounded-xl text-xs text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Email (sign-in id)</label>
            <input value={adminProfile.email || ""} readOnly className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs text-slate-500 dark:text-slate-400" />
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" className="inline-flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold"><Save className="w-4 h-4" />Save profile</button>
        </div>
      </form>

      <div className="bg-white dark:bg-zinc-900/90 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2"><Sliders className="w-4 h-4 text-purple-600 dark:text-purple-400" />Platform policies</h3>
        {toggle("recruiter_registration_open", "Open recruiter registration", "When off, new recruiter sign-ups are rejected (job seekers are unaffected).")}
        {toggle("jobs_require_approval", "Require approval for new jobs", "New job postings start as Pending Approval and stay hidden from job seekers until you approve them.")}
        {toggle("recruiter_requires_approval", "Require approval for new recruiters", "New recruiters start as Pending and cannot post jobs until you approve them.")}
        <div className="flex justify-end">
          <button type="button" onClick={savePolicies} disabled={!settings || saving} className="inline-flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold"><Save className="w-4 h-4" />{saving ? "Saving..." : "Save policies"}</button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900/90 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2"><Server className="w-4 h-4 text-purple-600 dark:text-purple-400" />Service health</h3>
        {!health ? <p className="text-xs text-slate-500 dark:text-slate-400">Checking...</p> : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(health.services || { gateway: { status: health.status } }).map(([k, v]) => (
              <div key={k} className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-slate-700/60 text-xs">
                <p className="font-bold text-slate-900 dark:text-white capitalize">{k}</p>
                <p className={v.status === "ok" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>{v.status}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminSettingsPage;
