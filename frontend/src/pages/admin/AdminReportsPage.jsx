import React from "react";
import { AdminAnalytics } from "../../components/RoleAnalytics";

export function AdminReportsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Platform Growth & Analytics</h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Live figures from the platform database: users, jobs, applications, funnel and hiring trends.
        </p>
      </div>
      <AdminAnalytics />
    </div>
  );
}

export default AdminReportsPage;
