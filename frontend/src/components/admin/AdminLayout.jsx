import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";
import { AdminNavbar } from "./AdminNavbar";

export function AdminLayout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-slate-100 flex">
      {/* Desktop Persistent Left Sidebar */}
      <div className="hidden lg:block w-64 shrink-0 h-screen sticky top-0 z-30">
        <AdminSidebar />
      </div>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-zinc-900 shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            <AdminSidebar
              mobile
              onClose={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminNavbar
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

export default AdminLayout;
