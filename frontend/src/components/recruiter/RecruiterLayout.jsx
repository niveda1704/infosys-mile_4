import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { RecruiterSidebar } from "./RecruiterSidebar";
import { RecruiterNavbar } from "./RecruiterNavbar";

export function RecruiterLayout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 flex">
      {/* Desktop Persistent Left Sidebar */}
      <div className="hidden lg:block w-64 shrink-0 h-screen sticky top-0 z-30">
        <RecruiterSidebar />
      </div>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 dark:bg-zinc-800/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-zinc-900 shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            <RecruiterSidebar
              mobile
              onClose={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <RecruiterNavbar
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isMobileMenuOpen={isMobileMenuOpen}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}

export default RecruiterLayout;
