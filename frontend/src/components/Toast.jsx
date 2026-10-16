import React from "react";
import {
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  Sparkles,
} from "lucide-react";
import { useApp } from "../context/AppContext";

export function ToastContainer() {
  const { toasts, removeToast } = useApp();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4">
      {toasts.map((toast) => {
        const getIcon = () => {
          switch (toast.type) {
            case "error":
              return (
                <AlertCircle className="w-4 h-4 text-rose-500" />
              );

            case "info":
              return (
                <Info className="w-4 h-4 text-blue-500" />
              );

            case "success":
            default:
              return (
                <Sparkles className="w-4 h-4 text-brand-400" />
              );
          }
        };

        const getBg = () => {
          switch (toast.type) {
            case "error":
              return "bg-slate-900 dark:bg-zinc-800 border-slate-800 text-white";

            case "info":
              return "bg-slate-900 dark:bg-zinc-800 border-slate-800 text-white";

            case "success":
            default:
              return "bg-slate-900 dark:bg-zinc-800 border-slate-800 text-white";
          }
        };

        return (
          <div
            key={toast.id}
            id={`toast-${toast.type}`}
            role="alert"
            aria-live="assertive"
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border shadow-lg animate-in slide-in-from-bottom-5 duration-200 ${getBg()}`}
          >
            <div className="flex items-center gap-2.5">
              {getIcon()}

              <p
                className="text-xs font-semibold"
                data-testid="toast-message"
              >
                {toast.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:opacity-75 rounded-lg transition-opacity"
              aria-label="Close notification"
            >
              <X className="w-3.5 h-3.5 opacity-80" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default ToastContainer;