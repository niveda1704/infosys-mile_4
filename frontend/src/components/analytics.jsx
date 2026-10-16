import React from "react";
import { useTheme } from "../context/ThemeContext";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

// One brand hue for the primary series, neutral greys for context, a small categorical set for part-of-whole.
export const C = { primary: "#4f46e5", soft: "#a5b4fc", muted: "#94a3b8", good: "#10b981", warn: "#f59e0b", bad: "#f43f5e" };
export const CATEGORICAL = ["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#a855f7", "#f43f5e"];
// Chart chrome follows the active theme (grid, ticks, tooltip), so charts never render light-on-dark.
export function useChartTheme() {
  const { theme } = useTheme();
  const dark = theme === "dark";
  return {
    grid: dark ? "#3f3f46" : "#e2e8f0",
    tick: { fontSize: 11, fill: dark ? "#a1a1aa" : "#64748b" },
    tip: {
      contentStyle: { borderRadius: 12, fontSize: 12, background: dark ? "#18181b" : "#ffffff", border: `1px solid ${dark ? "#3f3f46" : "#e2e8f0"}`, color: dark ? "#fafafa" : "#0f172a" },
      labelStyle: { color: dark ? "#fafafa" : "#0f172a" },
      itemStyle: { color: dark ? "#e4e4e7" : "#334155" },
      cursor: { fill: dark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.05)" },
    },
    track: dark ? "#27272a" : "#f1f5f9",
  };
}

export function Panel({ title, subtitle, children, className = "" }) {
  return (
    <section className={`bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-slate-200 dark:border-zinc-800 shadow-xs ${className}`}>
      {title && <h2 className="text-base font-bold text-slate-900 dark:text-zinc-50">{title}</h2>}
      {subtitle && <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">{subtitle}</p>}
      <div className={title ? "mt-4" : ""}>{children}</div>
    </section>
  );
}

export function Kpi({ label, value, hint }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-slate-200 dark:border-zinc-800 shadow-xs">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-zinc-50 tabular-nums">{value ?? "-"}</p>
      {hint && <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400">{hint}</p>}
    </div>
  );
}

export function RangeSelect({ days, onChange }) {
  return (
    <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-zinc-300">
      Date range
      <select value={days} onChange={(e) => onChange(Number(e.target.value))}
        className="px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs">
        {[7, 14, 30, 90, 180].map((d) => <option key={d} value={d}>Last {d} days</option>)}
      </select>
    </label>
  );
}

export function Empty({ children = "Nothing to show for this range yet." }) {
  return <p className="text-sm text-slate-500 dark:text-zinc-400 py-8 text-center">{children}</p>;
}

export function TrendChart({ data, label = "Count" }) {
  const t = useChartTheme();
  const total = (data || []).reduce((s, d) => s + d.count, 0);
  if (!data?.length || !total) return <Empty />;
  return (
    <div className="h-56" role="img" aria-label={`${label} per day`}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={t.grid} />
          <XAxis dataKey="date" tick={t.tick} tickFormatter={(d) => d.slice(5)} minTickGap={24} />
          <YAxis allowDecimals={false} tick={t.tick} />
          <Tooltip {...t.tip} labelFormatter={(d) => d} formatter={(v) => [v, label]} />
          <Area type="monotone" dataKey="count" stroke={C.primary} fill={C.primary} fillOpacity={0.15} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Horizontal bars: rows = [{name, value}] */
export function HBars({ rows, color = C.primary, height }) {
  const t = useChartTheme();
  if (!rows?.length) return <Empty />;
  return (
    <div style={{ height: height || Math.max(160, rows.length * 34) }}>
      <ResponsiveContainer>
        <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 24 }}>
          <XAxis type="number" allowDecimals={false} tick={t.tick} hide />
          <YAxis type="category" dataKey="name" width={110} tick={t.tick} interval={0} />
          <Tooltip {...t.tip} />
          <Bar dataKey="value" fill={color} radius={[0, 6, 6, 0]} label={{ position: "right", fontSize: 11, fill: t.tick.fill }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Funnel({ funnel }) {
  const rows = (funnel || []).filter((f) => f.stage !== "Rejected");
  const rejected = (funnel || []).find((f) => f.stage === "Rejected")?.count || 0;
  if (!rows.length || !rows[0].count) return <Empty>No applications in the funnel yet.</Empty>;
  return (
    <div>
      <HBars rows={rows.map((f) => ({ name: f.stage, value: f.count }))} />
      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Rejected: {rejected}</p>
    </div>
  );
}

export function Donut({ rows }) {
  const t = useChartTheme();
  const data = (rows || []).filter((r) => r.value > 0);
  if (!data.length) return <Empty />;
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="h-40 w-40">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={42} outerRadius={70} paddingAngle={2} stroke="none">
              {data.map((_, i) => <Cell key={i} fill={CATEGORICAL[i % CATEGORICAL.length]} />)}
            </Pie>
            <Tooltip {...t.tip} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="text-xs space-y-1.5">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2 text-slate-600 dark:text-zinc-300">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: CATEGORICAL[i % CATEGORICAL.length] }} />
            {d.name}: <strong className="tabular-nums">{d.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HiringTrends({ trends }) {
  if (!trends) return null;
  const types = (trends.company_type_activity || []).map((c) => ({ name: c.type, value: Number(c.jobs) }));
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <Panel title="Jobs posted" subtitle="New jobs per day" className="lg:col-span-2">
        <TrendChart data={trends.jobs_posted_by_day} label="Jobs" />
      </Panel>
      <Panel title="Startup vs MNC" subtitle="Jobs posted by company type">
        <Donut rows={types} />
      </Panel>
      <Panel title="In-demand skills" subtitle="Across jobs posted in this range" className="lg:col-span-3">
        <HBars rows={(trends.top_skills || []).map((s) => ({ name: s.skill, value: Number(s.n) }))} />
      </Panel>
    </div>
  );
}
