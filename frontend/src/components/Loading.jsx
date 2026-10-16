import React from "react";
import { Loader2, Sparkles } from "lucide-react";

export function Loading({ message = "Curating matched opportunities...", fullScreen = false }) {
  if (fullScreen) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-zinc-950 p-6 text-center select-none animate-in fade-in duration-300">
        <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center text-white mb-4 shadow-md font-bold text-xl">
          SX
        </div>
        <div className="flex items-center gap-2 mb-2">
          <Loader2 className="w-5 h-5 text-brand-600 dark:text-brand-400 animate-spin" />
          <p className="text-base font-bold text-slate-800 dark:text-zinc-100">{message}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
          <span>SwipeX • Intelligent Job Discovery & Career Assistant</span>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 flex flex-col items-center justify-center text-center">
      <Loader2 className="w-6 h-6 text-brand-600 dark:text-brand-400 animate-spin mb-2" />
      <p className="text-xs font-semibold text-slate-600 dark:text-zinc-300">{message}</p>
    </div>
  );
}

export function JobCardSkeleton() {
  return (
    <div className="w-full max-w-md h-[540px] bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-6 flex flex-col justify-between animate-pulse shadow-xs">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-200 dark:bg-zinc-700 rounded-2xl" />
            <div className="space-y-2">
              <div className="w-20 h-3 bg-slate-200 dark:bg-zinc-700 rounded" />
              <div className="w-36 h-5 bg-slate-200 dark:bg-zinc-700 rounded" />
            </div>
          </div>
          <div className="w-20 h-6 bg-brand-100 dark:bg-brand-500/15 rounded-full" />
        </div>

        <div className="grid grid-cols-3 gap-2 py-2">
          <div className="h-10 bg-slate-100 dark:bg-zinc-800 rounded-xl" />
          <div className="h-10 bg-brand-50 dark:bg-brand-500/10 rounded-xl" />
          <div className="h-10 bg-slate-100 dark:bg-zinc-800 rounded-xl" />
        </div>

        <div className="space-y-2 pt-2">
          <div className="w-full h-3 bg-slate-100 dark:bg-zinc-800 rounded" />
          <div className="w-5/6 h-3 bg-slate-100 dark:bg-zinc-800 rounded" />
          <div className="w-4/6 h-3 bg-slate-100 dark:bg-zinc-800 rounded" />
        </div>

        <div className="flex gap-2 pt-2">
          <div className="w-16 h-6 bg-slate-100 dark:bg-zinc-800 rounded-lg" />
          <div className="w-16 h-6 bg-slate-100 dark:bg-zinc-800 rounded-lg" />
          <div className="w-16 h-6 bg-slate-100 dark:bg-zinc-800 rounded-lg" />
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
        <div className="flex-1 h-11 bg-slate-100 dark:bg-zinc-800 rounded-xl" />
        <div className="w-12 h-11 bg-slate-100 dark:bg-zinc-800 rounded-xl" />
        <div className="flex-1 h-11 bg-brand-200 rounded-xl" />
      </div>
    </div>
  );
}

export default Loading;
