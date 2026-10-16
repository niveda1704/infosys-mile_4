import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { analyticsService } from "../services/notificationService";
import { Donut, Empty, Funnel, HBars, HiringTrends, Kpi, Panel, RangeSelect, TrendChart } from "./analytics";

function useAnalytics(kind, days) {
  const [state, setState] = useState({ data: null, trends: null, error: "", loading: true });
  useEffect(() => {
    let live = true;
    setState((s) => ({ ...s, loading: true }));
    Promise.allSettled([analyticsService[kind](days), analyticsService.trends({ days })]).then(([a, t]) => {
      if (!live) return;
      setState({
        data: a.status === "fulfilled" ? a.value : null,
        trends: t.status === "fulfilled" ? t.value : null,
        error: a.status === "rejected" ? a.reason?.response?.data?.message || "Could not load analytics." : "",
        loading: false,
      });
    });
    return () => { live = false; };
  }, [kind, days]);
  return state;
}

const shell = (title, days, setDays, body) => (
  <section className="space-y-5" aria-label={title}>
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-50">{title}</h2>
      <RangeSelect days={days} onChange={setDays} />
    </div>
    {body}
  </section>
);

export function RecruiterAnalytics() {
  const [days, setDays] = useState(30);
  const { data, trends, error, loading } = useAnalytics("recruiter", days);
  return shell("Hiring analytics", days, setDays, (
    <>
      {loading && <Loader2 className="w-5 h-5 animate-spin text-brand-600" />}
      {error && <p className="text-sm text-rose-600">{error}</p>}
      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <Kpi label="Jobs" value={data.totals.jobs} /><Kpi label="Active jobs" value={data.totals.active_jobs} />
            <Kpi label="Applicants" value={data.totals.applicants} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Panel title="Applicants per job" subtitle="Competition level shown next to each job" className="lg:col-span-2">
              {data.applicants_per_job.length === 0 ? <Empty>Post a job to see applicants.</Empty> : (
                <ul className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {data.applicants_per_job.map((j) => (
                    <li key={j.job_id} className="py-2 flex items-center justify-between gap-3 text-sm">
                      <span className="truncate text-slate-800 dark:text-zinc-100">{j.title}</span>
                      <span className="shrink-0 text-xs text-slate-500">{j.competition_level} - <strong className="tabular-nums text-slate-800 dark:text-zinc-100">{j.applicants}</strong></span>
                    </li>))}
                </ul>)}
            </Panel>
            <Panel title="Pipeline funnel"><Funnel funnel={data.funnel} /></Panel>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Panel title="Applications over time" className="lg:col-span-2"><TrendChart data={data.applications_by_day} label="Applications" /></Panel>
            <Panel title="Top applicant skills"><HBars rows={data.top_applicant_skills.map((s) => ({ name: s.skill, value: Number(s.n) }))} /></Panel>
          </div>
          <HiringTrends trends={trends} />
        </>
      )}
    </>
  ));
}

export function AdminAnalytics() {
  const [days, setDays] = useState(30);
  const { data, trends, error, loading } = useAnalytics("admin", days);
  return shell("Platform analytics", days, setDays, (
    <>
      {loading && <Loader2 className="w-5 h-5 animate-spin text-brand-600" />}
      {error && <p className="text-sm text-rose-600">{error}</p>}
      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Kpi label="Users" value={data.totals.users} /><Kpi label="Jobs" value={data.totals.jobs} />
            <Kpi label="Active jobs" value={data.totals.active_jobs} /><Kpi label="Applications" value={data.totals.applications} />
            <Kpi label="Resumes" value={data.totals.resumes} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Panel title="Users by role"><Donut rows={Object.entries(data.users_by_role).map(([name, value]) => ({ name, value }))} /></Panel>
            <Panel title="Application funnel"><Funnel funnel={data.funnel} /></Panel>
            <Panel title="Applications over time"><TrendChart data={data.applications_by_day} label="Applications" /></Panel>
            <Panel title="Sign-ups"><TrendChart data={data.signups_by_day} label="Sign-ups" /></Panel>
            <Panel title="Jobs posted" className="lg:col-span-2"><TrendChart data={data.jobs_by_day} label="Jobs" /></Panel>
          </div>
          <HiringTrends trends={trends} />
        </>
      )}
    </>
  ));
}
