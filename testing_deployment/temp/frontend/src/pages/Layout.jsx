import React, { useState } from "react";
import { Outlet } from "react-router-dom";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false);

  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Navbar */}
      <Navbar
        sidebarOpen={mobileSidebarOpen}
        onMenuClick={() =>
          setMobileSidebarOpen((prev) => !prev)
        }
      />

      {/* Main Area */}
      <div className="flex">

        {/* Sidebar */}
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() =>
            setSidebarCollapsed((prev) => !prev)
          }
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() =>
            setMobileSidebarOpen(false)
          }
        />

        {/* Content */}
        <main className="flex-1 min-w-0">
          <div className="w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}