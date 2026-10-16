import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, LayoutDashboard, Loader2, Lightbulb } from "lucide-react";
import { analyticsService } from "../services/notificationService";
import { Donut, Empty, Funnel, HBars, HiringTrends, Kpi, Panel, RangeSelect, TrendChart } from "../components/analytics";

export function DashboardPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [trends, setTrends] = useState(null);
  const [gap, setGap] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    setLoading(true);
    Promise.allSettled([
      analyticsService.seeker(days), analyticsService.trends({ days }),
      analyticsService.skillGap(), analyticsService.recommendationInsights(),
    ]).then(([a, t, g, r]) => {
      if (!live) return;
      if (a.status === "rejected") setError(a.reason?.response?.data?.message || "Could not load analytics.");
      else { setError(""); setData(a.value); }
      setTrends(t.status === "fulfilled" ? t.value : null);
      setGap(g.status === "fulfilled" ? g.value : null);
      setInsights(r.status === "fulfilled" ? r.value : null);
      setLoading(false);
    });
    return () => { live = false; };
  }, [days]);

  const t = data?.totals || {};
  const resumes = data?.resume_performance || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-brand-50 dark:bg-brand-500/10 rounded-xl"><LayoutDashboard className="w-5 h-5 text-brand-600 dark:text-brand-400" /></div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight">Career dashboard</h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">Your funnel, resume performance, skill gap and the hiring market.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <RangeSelect days={days} onChange={setDays} />
          <Link to="/" className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold">
            Find jobs <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {loading && <Loader2 className="w-6 h-6 animate-spin text-brand-600" />}
      {error && <p className="text-sm text-rose-600">{error}</p>}

      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi label="Applications" value={t.applications} />
            <Kpi label="Saved jobs" value={t.saved} />
            <Kpi label="Swiped right" value={t.swiped_right} hint="Right swipe = apply" />
            <Kpi label="Swiped left" value={t.swiped_left} hint="Skipped" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Panel title="Application funnel" subtitle="How far your applications got"><Funnel funnel={data.funnel} /></Panel>
            <Panel title="Applications over time" subtitle={`${data.range.from} to ${data.range.to}`} className="lg:col-span-2">
              <TrendChart data={data.applications_by_day} label="Applications" />
            </Panel>
          </div>

          <Panel title="Resume performance" subtitle="Which resume version gets shortlisted">
            {resumes.length === 0 ? <Empty>Upload a resume to compare versions.</Empty> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-xs uppercase text-slate-400">
                    <th className="py-2 pr-4">Resume</th><th className="pr-4">ATS</th><th className="pr-4">Applications</th>
                    <th className="pr-4">Shortlisted+</th><th className="pr-4">Interviews</th><th>Shortlist rate</th></tr></thead>
                  <tbody>{resumes.map((r) => (
                    <tr key={r.resume_id} className="border-t border-slate-100 dark:border-zinc-800 text-slate-700 dark:text-zinc-200">
                      <td className="py-2 pr-4 font-medium">{r.filename}</td>
                      <td className="pr-4 tabular-nums">{r.ats_score ?? "-"}</td>
                      <td className="pr-4 tabular-nums">{r.applications}</td>
                      <td className="pr-4 tabular-nums">{r.shortlisted_or_better}</td>
                      <td className="pr-4 tabular-nums">{r.interviews}</td>
                      <td className="tabular-nums">{r.shortlist_rate == null ? "-" : `${r.shortlist_rate}%`}</td>
                    </tr>))}</tbody>
                </table>
              </div>
            )}
          </Panel>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Panel title="Skill gap" subtitle={gap?.has_signal ? `You cover ${gap.coverage}% of the skills in the jobs you target` : undefined}>
              {!gap?.has_signal ? <Empty>{gap?.message || "Add skills to your profile or swipe on jobs to see your skill gap."}</Empty> : (
                <>
                  <p className="text-xs font-semibold text-slate-500 mb-2">Learn next</p>
                  <HBars color="#f59e0b" rows={gap.gaps.map((g) => ({ name: g.skill, value: g.demand_pct }))} />
                </>
              )}
            </Panel>
            <Panel title="Recommendation insights" subtitle="What your swipes taught the recommender">
              {!insights ? <Empty>Insights are unavailable right now.</Empty> : (
                <div className="space-y-4">
                  <Donut rows={[{ name: "Liked", value: insights.swipes.liked }, { name: "Skipped", value: insights.swipes.skipped }]} />
                  {insights.interests?.length > 0 && (
                    <HBars rows={insights.interests.map((i) => ({ name: i.family, value: i.score }))} height={Math.max(140, insights.interests.length * 32)} />
                  )}
                  {(insights.notes || []).map((n) => (
                    <p key={n} className="text-xs text-slate-600 dark:text-zinc-300 flex gap-2"><Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />{n}</p>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-50 pt-2">Hiring trends</h2>
          <HiringTrends trends={trends} />
        </>
      )}
    </div>
  );
}

export default DashboardPage;
