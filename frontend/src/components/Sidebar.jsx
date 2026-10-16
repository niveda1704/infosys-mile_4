import React from "react";
import { NavLink, Link } from "react-router-dom";
import {
  Compass,
  Bookmark,
  Briefcase,
  Sparkles,
  FileCheck,
  LayoutDashboard,
  User,
  Award,
  ChevronRight,
  ChevronLeft,
  Settings,
  LogOut,
  X,
  TrendingUp,
} from "lucide-react";

import { useApp } from "../context/AppContext";

export function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}) {
  const {
    savedJobs,
    applications,
    resumeAnalysis,
    logout,
  } = useApp();

  const navItems = [
    {
      to: "/discover",
      label: "Discover",
      icon: Compass,
    },
    {
      to: "/saved",
      label: "Saved Jobs",
      icon: Bookmark,
      // badge: savedJobs?.length > 0 ? savedJobs.length : null,
    },
    {
      to: "/applications",
      label: "Applications",
      icon: Briefcase,
      // badge: applications?.length > 0 ? applications.length : null,
    },
    {
      to: "/recommendations",
      label: "AI Matches",
      icon: Sparkles,
      // badge: "4",
      highlightBadge: true,
    },
    {
      to: "/resume-analysis",
      label: "Resume ATS",
      icon: FileCheck,
    },
    {
      to: "/dashboard",
      label: "Career Dashboard",
      icon: LayoutDashboard,
    },
  ];

  const bottomItems = [
    {
      to: "/profile",
      label: "Profile & Skills",
      icon: User,
    },
    {
      to: "/settings",
      label: "Settings",
      icon: Settings,
    },
  ];

  const NavItem = ({ item }) => {
    const Icon = item.icon;

    return (
      <NavLink
        to={item.to}
        end={item.to === "/"}
        onClick={onMobileClose}
        title={collapsed ? item.label : undefined}
        className={({ isActive }) =>
          `group relative flex items-center ${
            collapsed ? "justify-center px-0 h-10 w-10 mx-auto" : "justify-between px-3 py-2.5"
          } rounded-xl text-sm font-semibold transition-all duration-150 ${
            isActive
              ? "bg-brand-600 text-white shadow-md shadow-brand-600/25 font-bold dark:bg-zinc-800 dark:shadow-none"
              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100"
          }`
        }
      >
        {({ isActive }) => (
          <>
            <div
              className={`flex items-center ${
                collapsed ? "justify-center" : "gap-3 min-w-0"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive
                    ? "text-white"
                    : "text-slate-400 group-hover:text-slate-700 dark:group-hover:text-zinc-200"
                }`}
              />

              {!collapsed && (
                <span className="truncate text-[13px]">{item.label}</span>
              )}
            </div>

            {!collapsed && item.badge !== null && item.badge !== undefined && (
              <span
                className={`min-w-5 h-5 px-1.5 flex items-center justify-center rounded-full text-[10px] font-bold ${
                  item.highlightBadge
                    ? "bg-brand-100 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300"
                    : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300"
                }`}
              >
                {item.badge}
              </span>
            )}

            {collapsed && (
              <span className="fixed left-20 ml-2 px-2.5 py-1 bg-slate-900 dark:bg-zinc-800 text-white text-[11px] font-medium rounded-lg whitespace-nowrap shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                {item.label}
              </span>
            )}
          </>
        )}
      </NavLink>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 dark:bg-zinc-800/40 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 lg:top-16 left-0 z-50 lg:z-30 h-screen lg:h-[calc(100vh-4rem)] bg-white dark:bg-zinc-900 border-r border-slate-200/80 dark:border-zinc-800/80 flex flex-col transition-all duration-300 ease-in-out select-none ${
          collapsed ? "lg:w-[72px]" : "lg:w-64"
        } ${
          mobileOpen
            ? "translate-x-0 w-72 shadow-2xl lg:shadow-none"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between px-4 h-16 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-amber-500 text-white flex items-center justify-center font-black text-xs shadow-xs">
              SX
            </div>
            <span className="font-extrabold text-sm text-slate-900 dark:text-zinc-50 tracking-tight">
              Swipe<span className="text-brand-600 dark:text-brand-400">X</span>
            </span>
          </div>

          <button
            type="button"
            onClick={onMobileClose}
            aria-label="Close navigation"
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Center Area (Starts immediately with Menu) */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
          <nav className="space-y-1">
            {!collapsed && (
              <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Menu
              </p>
            )}

            {navItems.map((item) => (
              <NavItem key={item.to} item={item} />
            ))}
          </nav>

          {/* ATS Score Card */}
          {/* {!collapsed ? (
            <div className="rounded-2xl bg-slate-900 dark:bg-zinc-800 text-white p-3.5 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-brand-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                    ATS Score
                  </span>
                </div>
                <span className="text-xs font-black px-2 py-0.5 rounded-md bg-brand-500/20 text-brand-400 ring-1 ring-brand-500/30">
                  {resumeAnalysis?.atsScore || 82}%
                </span>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Resume is well optimized for modern tech roles.
              </p>

              <Link
                to="/resume-analysis"
                onClick={onMobileClose}
                className="flex items-center justify-between w-full py-1.5 px-3 bg-brand-600 hover:bg-brand-500 rounded-lg text-xs font-bold transition-colors"
              >
                <span>Improve ATS</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <Link
              to="/resume-analysis"
              title="Resume ATS Score"
              onClick={onMobileClose}
              className="flex justify-center p-2.5 rounded-xl bg-slate-900 dark:bg-zinc-800 text-brand-400 hover:bg-slate-800 dark:hover:bg-zinc-700 transition-colors mx-auto w-10 h-10 items-center"
            >
              <Award className="w-4 h-4" />
            </Link>
          )} */}

          {/* Quick Analytics Link */}
          {/* {!collapsed && (
            <div className="pt-2">
              <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Quick Analytics
              </p>
              <Link
                to="/dashboard"
                onClick={onMobileClose}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/50 hover:text-slate-900 dark:hover:text-zinc-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                  <span>Market Trends</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>
          )} */}
        </div>

        {/* Bottom Section: Settings & Sign Out */}
        <div className="p-3 border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1">
          {bottomItems.map((item) => (
            <NavItem key={item.to} item={item} />
          ))}

          {/* Sign Out */}
          <button
            type="button"
            onClick={logout}
            title={collapsed ? "Sign Out" : undefined}
            className={`group w-full flex items-center ${
              collapsed ? "justify-center h-10 w-10 mx-auto" : "gap-3 px-3 py-2.5"
            } rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors`}
          >
            <LogOut className="w-4 h-4 shrink-0 transition-transform group-hover:-translate-x-0.5" />
            {!collapsed && <span className="text-[13px]">Sign Out</span>}

            {collapsed && (
              <span className="fixed left-20 ml-2 px-2.5 py-1 bg-slate-900 dark:bg-zinc-800 text-white text-[11px] font-medium rounded-lg whitespace-nowrap shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                Sign Out
              </span>
            )}
          </button>

          {/* Collapse Toggle */}
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden lg:flex w-full items-center justify-center gap-2 mt-2 py-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/70 dark:border-zinc-800/70 text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-800 dark:hover:text-zinc-100 transition-all text-xs font-bold"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;



// import React from "react";
// import { NavLink, Link } from "react-router-dom";
// import {
//   Compass,
//   Bookmark,
//   Briefcase,
//   Sparkles,
//   FileCheck,
//   LayoutDashboard,
//   User,
//   Award,
//   ChevronRight,
//   ChevronLeft,
//   Settings,
//   LogOut,
//   X,
//   TrendingUp,
// } from "lucide-react";

// import { useApp } from "../context/AppContext";

// export function Sidebar({
//   collapsed,
//   onToggle,
//   mobileOpen,
//   onMobileClose,
// }) {
//   const {
//     user,
//     savedJobs,
//     applications,
//     resumeAnalysis,
//     logout,
//   } = useApp();

//   const navItems = [
//     {
//       to: "/",
//       label: "Discover",
//       icon: Compass,
//     },
//     {
//       to: "/saved",
//       label: "Saved Jobs",
//       icon: Bookmark,
//       badge: savedJobs?.length > 0 ? savedJobs.length : null,
//     },
//     {
//       to: "/applications",
//       label: "Applications",
//       icon: Briefcase,
//       badge: applications?.length > 0 ? applications.length : null,
//     },
//     {
//       to: "/recommendations",
//       label: "AI Matches",
//       icon: Sparkles,
//       badge: "4",
//       highlightBadge: true,
//     },
//     {
//       to: "/resume-analysis",
//       label: "Resume ATS",
//       icon: FileCheck,
//     },
//     {
//       to: "/dashboard",
//       label: "Career Dashboard",
//       icon: LayoutDashboard,
//     },
//   ];

//   const bottomItems = [
//     {
//       to: "/profile",
//       label: "Profile & Skills",
//       icon: User,
//     },
//     {
//       to: "/settings",
//       label: "Settings",
//       icon: Settings,
//     },
//   ];

//   const NavItem = ({ item }) => {
//     const Icon = item.icon;

//     return (
//       <NavLink
//         to={item.to}
//         end={item.to === "/"}
//         onClick={onMobileClose}
//         title={collapsed ? item.label : undefined}
//         className={({ isActive }) =>
//           `group relative flex items-center ${
//             collapsed ? "justify-center px-0 h-10 w-10 mx-auto" : "justify-between px-3 py-2.5"
//           } rounded-xl text-sm font-semibold transition-all duration-150 ${
//             isActive
//               ? "bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 shadow-2xs font-bold"
//               : "text-slate-600 dark:text-zinc-300 hover:bg-slate-100/70 dark:hover:bg-zinc-800/70 hover:text-slate-900 dark:hover:text-zinc-50"
//           }`
//         }
//       >
//         {({ isActive }) => (
//           <>
//             <div
//               className={`flex items-center ${
//                 collapsed ? "justify-center" : "gap-3 min-w-0"
//               }`}
//             >
//               <Icon
//                 className={`w-4 h-4 shrink-0 transition-colors ${
//                   isActive
//                     ? "text-brand-600 dark:text-brand-400"
//                     : "text-slate-400 group-hover:text-slate-700 dark:group-hover:text-zinc-200"
//                 }`}
//               />

//               {!collapsed && (
//                 <span className="truncate text-[13px]">{item.label}</span>
//               )}
//             </div>

//             {!collapsed && item.badge !== null && item.badge !== undefined && (
//               <span
//                 className={`min-w-5 h-5 px-1.5 flex items-center justify-center rounded-full text-[10px] font-bold ${
//                   item.highlightBadge
//                     ? "bg-brand-100 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300"
//                     : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300"
//                 }`}
//               >
//                 {item.badge}
//               </span>
//             )}

//             {/* Tooltip for desktop collapsed view */}
//             {collapsed && (
//               <span className="fixed left-20 ml-2 px-2.5 py-1 bg-slate-900 dark:bg-zinc-800 text-white text-[11px] font-medium rounded-lg whitespace-nowrap shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
//                 {item.label}
//               </span>
//             )}
//           </>
//         )}
//       </NavLink>
//     );
//   };

//   return (
//     <>
//       {/* Mobile Backdrop */}
//       {mobileOpen && (
//         <div
//           className="fixed inset-0 bg-slate-900/40 dark:bg-zinc-800/40 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
//           onClick={onMobileClose}
//           aria-hidden="true"
//         />
//       )}

//       <aside
//         className={`fixed lg:sticky top-0 lg:top-16 left-0 z-50 lg:z-30 h-screen lg:h-[calc(100vh-4rem)] bg-white dark:bg-zinc-900 border-r border-slate-200/80 dark:border-zinc-800/80 flex flex-col transition-all duration-300 ease-in-out select-none ${
//           collapsed ? "lg:w-[72px]" : "lg:w-64"
//         } ${
//           mobileOpen
//             ? "translate-x-0 w-72 shadow-2xl lg:shadow-none"
//             : "-translate-x-full lg:translate-x-0"
//         }`}
//       >
//         {/* Mobile-Only Drawer Header */}
//         <div className="lg:hidden flex items-center justify-between px-4 h-16 border-b border-slate-100 dark:border-zinc-800">
//           <div className="flex items-center gap-2.5">
//             <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-violet-500 text-white flex items-center justify-center font-black text-xs shadow-xs">
//               SX
//             </div>
//             <span className="font-extrabold text-sm text-slate-900 dark:text-zinc-50 tracking-tight">
//               Swipe<span className="text-brand-600 dark:text-brand-400">X</span>
//             </span>
//           </div>

//           <button
//             type="button"
//             onClick={onMobileClose}
//             aria-label="Close navigation"
//             className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors"
//           >
//             <X className="w-5 h-5" />
//           </button>
//         </div>

//         {/* Scrollable Center Area */}
//         <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
//           {/* User Profile Tile */}
//           <Link
//             to="/profile"
//             onClick={onMobileClose}
//             title={collapsed ? "Profile" : undefined}
//             className={`group flex items-center ${
//               collapsed ? "justify-center p-1.5" : "gap-3 p-2.5"
//             } rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800/60 hover:border-brand-300 hover:bg-brand-50/30 dark:hover:bg-brand-500/10 transition-all`}
//           >
//             <div className="w-9 h-9 rounded-xl bg-brand-100 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300 flex items-center justify-center overflow-hidden shrink-0 font-bold ring-1 ring-brand-600/10">
//               {user?.avatar ? (
//                 <img
//                   src={user.avatar}
//                   alt={user.name || "User Avatar"}
//                   className="w-full h-full object-cover"
//                 />
//               ) : (
//                 <User className="w-4 h-4 text-brand-600 dark:text-brand-400" />
//               )}
//             </div>

//             {!collapsed && (
//               <div className="min-w-0 flex-1">
//                 <p className="text-xs font-bold text-slate-900 dark:text-zinc-50 truncate">
//                   {user?.name || "Candidate"}
//                 </p>
//                 <p className="text-[11px] text-slate-400 truncate">
//                   {user?.role || "Job Seeker"}
//                 </p>
//               </div>
//             )}

//             {collapsed && (
//               <span className="fixed left-20 ml-2 px-2.5 py-1 bg-slate-900 dark:bg-zinc-800 text-white text-[11px] font-medium rounded-lg whitespace-nowrap shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
//                 {user?.name || "Profile"}
//               </span>
//             )}
//           </Link>

//           {/* Navigation Items */}
//           <nav className="space-y-1">
//             {!collapsed && (
//               <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
//                 Menu
//               </p>
//             )}

//             {navItems.map((item) => (
//               <NavItem key={item.to} item={item} />
//             ))}
//           </nav>

//           {/* ATS Score Card */}
//           {!collapsed ? (
//             <div className="rounded-2xl bg-slate-900 dark:bg-zinc-800 text-white p-3.5 space-y-2.5 shadow-sm">
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-1.5">
//                   <Award className="w-4 h-4 text-brand-400" />
//                   <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
//                     ATS Score
//                   </span>
//                 </div>
//                 <span className="text-xs font-black px-2 py-0.5 rounded-md bg-brand-500/20 text-brand-400 ring-1 ring-brand-500/30">
//                   {resumeAnalysis?.atsScore || 82}%
//                 </span>
//               </div>

//               <p className="text-[11px] text-slate-400 leading-relaxed">
//                 Resume is well optimized for modern tech roles.
//               </p>

//               <Link
//                 to="/resume-analysis"
//                 onClick={onMobileClose}
//                 className="flex items-center justify-between w-full py-1.5 px-3 bg-brand-600 hover:bg-brand-500 rounded-lg text-xs font-bold transition-colors"
//               >
//                 <span>Improve ATS</span>
//                 <ChevronRight className="w-3.5 h-3.5" />
//               </Link>
//             </div>
//           ) : (
//             <Link
//               to="/resume-analysis"
//               title="Resume ATS Score"
//               onClick={onMobileClose}
//               className="flex justify-center p-2.5 rounded-xl bg-slate-900 dark:bg-zinc-800 text-brand-400 hover:bg-slate-800 dark:hover:bg-zinc-700 transition-colors mx-auto w-10 h-10 items-center"
//             >
//               <Award className="w-4 h-4" />
//             </Link>
//           )}

//           {/* Quick Analytics Link */}
//           {!collapsed && (
//             <div className="pt-2">
//               <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
//                 Quick Analytics
//               </p>
//               <Link
//                 to="/dashboard"
//                 onClick={onMobileClose}
//                 className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/50 hover:text-slate-900 dark:hover:text-zinc-50 transition-colors"
//               >
//                 <div className="flex items-center gap-2.5">
//                   <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
//                   <span>Market Trends</span>
//                 </div>
//                 <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
//               </Link>
//             </div>
//           )}
//         </div>

//         {/* Bottom Section: Settings & Sign Out */}
//         <div className="p-3 border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1">
//           {bottomItems.map((item) => (
//             <NavItem key={item.to} item={item} />
//           ))}

//           {/* Sign Out */}
//           <button
//             type="button"
//             onClick={logout}
//             title={collapsed ? "Sign Out" : undefined}
//             className={`group w-full flex items-center ${
//               collapsed ? "justify-center h-10 w-10 mx-auto" : "gap-3 px-3 py-2.5"
//             } rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors`}
//           >
//             <LogOut className="w-4 h-4 shrink-0 transition-transform group-hover:-translate-x-0.5" />
//             {!collapsed && <span className="text-[13px]">Sign Out</span>}

//             {collapsed && (
//               <span className="fixed left-20 ml-2 px-2.5 py-1 bg-slate-900 dark:bg-zinc-800 text-white text-[11px] font-medium rounded-lg whitespace-nowrap shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
//                 Sign Out
//               </span>
//             )}
//           </button>

//           {/* Desktop Collapse Toggle */}
//           <button
//             type="button"
//             onClick={onToggle}
//             aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
//             className="hidden lg:flex w-full items-center justify-center gap-2 mt-2 py-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/70 dark:border-zinc-800/70 text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-800 dark:hover:text-zinc-100 transition-all text-xs font-bold"
//           >
//             {collapsed ? (
//               <ChevronRight className="w-4 h-4" />
//             ) : (
//               <>
//                 <ChevronLeft className="w-4 h-4" />
//                 <span>Collapse</span>
//               </>
//             )}
//           </button>
//         </div>
//       </aside>
//     </>
//   );
// }

// export default Sidebar;

// import React from "react";
// import { Link } from "react-router-dom";
// import {
//   Bookmark,
//   Briefcase,
//   Sparkles,
//   User,
//   TrendingUp,
//   Award,
//   ChevronRight
// } from "lucide-react";
// import { useApp } from "../context/AppContext";

// export function Sidebar() {
//   const { user, savedJobs, applications, resumeAnalysis } = useApp();

//   return (
//     <aside className="w-72 hidden xl:flex flex-col gap-5 shrink-0 py-6 pr-6">
//       {/* Profile Card */}
//       <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-slate-200 dark:border-zinc-800 shadow-xs">
//         <div className="flex items-center gap-3 mb-4">
//           <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300 font-bold overflow-hidden shrink-0 flex items-center justify-center">
//             {user?.avatar ? (
//               <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
//             ) : (
//               <User className="w-6 h-6 text-brand-700 dark:text-brand-300" />
//             )}
//           </div>
//           <div className="min-w-0">
//             <h3 className="font-bold text-slate-900 dark:text-zinc-50 text-sm truncate">{user?.name || "Candidate"}</h3>
//             <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">{user?.role || "Software Developer"}</p>
//           </div>
//         </div>

//         {/* Profile Completion Gauge */}
//         <div className="space-y-1.5 mb-4 bg-slate-50 dark:bg-zinc-950 p-3 rounded-xl border border-slate-100 dark:border-zinc-800">
//           <div className="flex items-center justify-between text-xs font-semibold">
//             <span className="text-slate-600 dark:text-zinc-300">Profile Readiness</span>
//             <span className="text-brand-700 dark:text-brand-300 font-bold">{user?.profileCompletion || 85}%</span>
//           </div>
//           <div className="h-1.5 bg-slate-200 dark:bg-zinc-700 rounded-full overflow-hidden">
//             <div
//               className="h-full bg-brand-600 rounded-full transition-all duration-500"
//               style={{ width: `${user?.profileCompletion || 85}%` }}
//             />
//           </div>
//         </div>

//         {/* Quick Stats Grid */}
//         <div className="grid grid-cols-2 gap-2 text-center">
//           <Link
//             to="/saved"
//             className="p-2.5 bg-slate-50 dark:bg-zinc-950 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-800 transition-colors group"
//           >
//             <p className="text-xl font-extrabold text-slate-900 dark:text-zinc-50 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
//               {savedJobs?.length || 0}
//             </p>
//             <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Saved Jobs</p>
//           </Link>

//           <Link
//             to="/applications"
//             className="p-2.5 bg-slate-50 dark:bg-zinc-950 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-800 transition-colors group"
//           >
//             <p className="text-xl font-extrabold text-slate-900 dark:text-zinc-50 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
//               {applications?.length || 0}
//             </p>
//             <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Applications</p>
//           </Link>
//         </div>
//       </div>

//       {/* ATS Optimizer Card */}
//       <div className="bg-slate-900 dark:bg-zinc-800 text-white rounded-2xl p-5 shadow-sm space-y-3 border border-slate-800">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-2">
//             <Award className="w-4 h-4 text-brand-400" />
//             <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
//               ATS Score
//             </span>
//           </div>
//           <span className="text-xs font-bold bg-slate-800 dark:bg-zinc-700 px-2.5 py-0.5 rounded-lg text-brand-400 border border-slate-700">
//             {resumeAnalysis?.atsScore || 82}%
//           </span>
//         </div>

//         <p className="text-xs text-slate-300 leading-relaxed">
//           Your resume matches <strong>Full Stack & Frontend Developer</strong> roles well. 2 quick keyword improvements available.
//         </p>

//         <Link
//           to="/resume-analysis"
//           className="flex items-center justify-between w-full py-2 px-3 bg-brand-600 hover:bg-brand-700 rounded-xl text-xs font-bold text-white transition-colors"
//         >
//           <span>Run Resume ATS Check</span>
//           <ChevronRight className="w-3.5 h-3.5" />
//         </Link>
//       </div>

//       {/* Quick Shortcuts */}
//       <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-slate-200 dark:border-zinc-800 shadow-xs space-y-1">
//         <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
//           Quick Shortcuts
//         </p>

//         <Link
//           to="/recommendations"
//           className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-zinc-800/50 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-200 transition-colors"
//         >
//           <div className="flex items-center gap-2.5">
//             <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
//             <span>AI Role Matches</span>
//           </div>
//           <span className="text-[10px] font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-500/10 px-2 py-0.5 rounded-md border border-brand-100 dark:border-brand-500/20">
//             4 New
//           </span>
//         </Link>

//         <Link
//           to="/dashboard"
//           className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-zinc-800/50 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-200 transition-colors"
//         >
//           <div className="flex items-center gap-2.5">
//             <TrendingUp className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
//             <span>Career Analytics</span>
//           </div>
//           <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
//         </Link>
//       </div>
//     </aside>
//   );
// }

// export default Sidebar;
