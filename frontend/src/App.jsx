import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import { AppProvider, useApp } from "./context/AppContext";

// =========================================================
// SHARED / JOB SEEKER COMPONENTS
// =========================================================

import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import { FilterModal } from "./components/FilterModal";
import { ApplyModal } from "./components/ApplyModal";
import { ToastContainer } from "./components/Toast";
import { SplashScreen } from "./components/SplashScreen";

// =========================================================
// JOB SEEKER PAGES
// =========================================================

import { DiscoverPage } from "./pages/DiscoverPage";
import { JobDetailsPage } from "./pages/JobDetailsPage";
import { SavedJobsPage } from "./pages/SavedJobsPage";
import { ApplicationsPage } from "./pages/ApplicationsPage";
import { RecommendationsPage } from "./pages/RecommendationsPage";
import { ResumeAnalysisPage } from "./pages/ResumeAnalysisPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { AlertPreferencesPage } from "./pages/AlertPreferencesPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProfilePage } from "./pages/ProfilePage";
import { CompaniesPage } from "./pages/CompaniesPage";
import { CompanyDetailsPage } from "./pages/CompanyDetailsPage";

// =========================================================
// AUTH PAGES
// =========================================================

import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";

// =========================================================
// RECRUITER
// =========================================================

import { RecruiterLayout } from "./components/recruiter/RecruiterLayout";
import { RecruiterDashboard } from "./pages/recruiter/RecruiterDashboard";
import { PostJobPage } from "./pages/recruiter/PostJobPage";
import { ManageJobsPage } from "./pages/recruiter/ManageJobsPage";
import { ApplicantsPage } from "./pages/recruiter/ApplicantsPage";
import { ApplicantDetailsPage } from "./pages/recruiter/ApplicantDetailsPage";
import { RecruiterProfilePage } from "./pages/recruiter/RecruiterProfilePage";
import { RecruiterNotificationsPage } from "./pages/recruiter/RecruiterNotificationsPage";

// =========================================================
// ADMIN
// =========================================================

import { AdminLayout } from "./components/admin/AdminLayout";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { UserManagementPage } from "./pages/admin/UserManagementPage";
import { RecruiterManagementPage } from "./pages/admin/RecruiterManagementPage";
import { JobManagementPage } from "./pages/admin/JobManagementPage";
import { ApplicationOverviewPage } from "./pages/admin/ApplicationOverviewPage";
import { AdminReportsPage } from "./pages/admin/AdminReportsPage";
import { AdminSettingsPage } from "./pages/admin/AdminSettingsPage";
import { AdminNotificationsPage } from "./pages/admin/AdminNotificationsPage";

import HomePage from "./pages/HomePage";


// =========================================================
// JWT HELPERS
// =========================================================

const ACCESS_TOKEN_KEY = "swipex_access_token";

function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}


/**
 * Checks whether the JWT exists and has not expired.
 *
 * This does NOT replace backend JWT validation.
 * The backend still verifies the signature.
 *
 * This is only used to prevent the frontend from
 * allowing navigation with an obviously expired token.
 */
function isTokenValid(token) {
  if (!token) {
    return false;
  }

  try {
    const parts = token.split(".");

    if (parts.length !== 3) {
      return false;
    }

    const payload = JSON.parse(
      atob(
        parts[1]
          .replace(/-/g, "+")
          .replace(/_/g, "/")
      )
    );

    // If JWT has an expiry time, check it.
    if (payload.exp) {
      const currentTime = Math.floor(
        Date.now() / 1000
      );

      if (payload.exp <= currentTime) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error(
      "Invalid JWT:",
      error
    );

    return false;
  }
}


// =========================================================
// ROLE FROM SESSION (token claim first, stored user as fallback)
// Case-insensitive so "Recruiter" / "recruiter" / "RECRUITER" all work.
// =========================================================

function getSessionRole(token) {
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const claim = JSON.parse(atob(part)).role;
    if (claim) return String(claim).toUpperCase();
  } catch {
    /* fall through to stored user */
  }
  try {
    const stored = JSON.parse(localStorage.getItem("swipex_user") || "null");
    if (stored?.role) return String(stored.role).toUpperCase();
  } catch {
    /* ignore */
  }
  return "JOB_SEEKER";
}


// =========================================================
// PROTECTED ROUTE
// =========================================================

function ProtectedRoute() {
  const location = useLocation();

  const token = getAccessToken();

  const authenticated = isTokenValid(
    token
  );

  // -------------------------------------------------------
  // NO VALID JWT
  // -------------------------------------------------------

  if (!authenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  return <Outlet />;
}


// =========================================================
// PUBLIC ONLY ROUTE
// =========================================================
//
// Prevent authenticated users from opening
// login/signup again.
// =========================================================

function PublicAuthRoute() {
  const token = getAccessToken();

  if (isTokenValid(token)) {
    // Send each role to its own home (otherwise admins/recruiters land on seeker pages)
    const role = getSessionRole(token);
    const home = role === "ADMIN" ? "/admin" : role === "RECRUITER" ? "/recruiter" : "/discover";
    return <Navigate to={home} replace />;
  }

  return <Outlet />;
}


// =========================================================
// JOB SEEKER LAYOUT
// =========================================================

function JobSeekerLayout() {
  const {
    isFilterModalOpen,
    setIsFilterModalOpen,
    applyModalJob,
    setApplyModalJob,
  } = useApp();

  // Desktop sidebar
  const [
    sidebarCollapsed,
    setSidebarCollapsed,
  ] = useState(false);

  // Mobile sidebar
  const [
    mobileSidebarOpen,
    setMobileSidebarOpen,
  ] = useState(false);

  const location = useLocation();

  // Close mobile sidebar whenever route changes
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 font-sans selection:bg-brand-600 selection:text-white">

      {/* ===================================================
          NAVBAR
          =================================================== */}

      <Navbar
        sidebarOpen={mobileSidebarOpen}
        onMenuClick={() =>
          setMobileSidebarOpen(
            (prev) => !prev
          )
        }
      />

      {/* ===================================================
          SIDEBAR + CONTENT
          =================================================== */}

      <div className="flex">

        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() =>
            setSidebarCollapsed(
              (prev) => !prev
            )
          }
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() =>
            setMobileSidebarOpen(false)
          }
        />

        {/* =================================================
            MAIN CONTENT
            ================================================= */}

        <main className="flex-1 min-w-0 min-h-[calc(100vh-4rem)]">

          <div className="w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>

          {/* =================================================
              FOOTER
              ================================================= */}

          <footer className="border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-6 mt-12">

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-zinc-400">

              <div className="flex items-center gap-2">

                <span className="font-extrabold text-slate-900 dark:text-zinc-50 text-sm tracking-tight">
                  SwipeX
                </span>

                <span className="text-slate-300">
                  •
                </span>

                <span className="font-medium text-slate-600 dark:text-zinc-300 text-center sm:text-left">
                  Intelligent Swipe-Based Career & Talent Acquisition Platform
                </span>

              </div>

              <div className="text-[11px] text-slate-400 font-medium">
                © {new Date().getFullYear()} SwipeX. All rights reserved.
              </div>

            </div>

          </footer>

        </main>

      </div>

      {/* ===================================================
          CANDIDATE MODALS
          =================================================== */}

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() =>
          setIsFilterModalOpen(false)
        }
      />

      <ApplyModal
        job={applyModalJob}
        isOpen={Boolean(applyModalJob)}
        onClose={() =>
          setApplyModalJob(null)
        }
      />

    </div>
  );
}


// =========================================================
// PUBLIC LAYOUT
// =========================================================

function PublicLayout() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-50 font-sans">

      <Navbar />

      <main>
        <Outlet />
      </main>

    </div>
  );
}


// =========================================================
// RECRUITER ROUTE GUARD
// =========================================================
//
// Requires JWT + recruiter role.
// =========================================================

function RecruiterRoute() {
  const token = getAccessToken();

  if (!isTokenValid(token)) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  try {
    const parts = token.split(".");

    const payload = JSON.parse(
      atob(
        parts[1]
          .replace(/-/g, "+")
          .replace(/_/g, "/")
      )
    );

    if (getSessionRole(token) !== "RECRUITER") {
      return (
        <Navigate
          to="/discover"
          replace
        />
      );
    }

  } catch (error) {
    console.error(
      "Unable to read recruiter JWT:",
      error
    );

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return <Outlet />;
}


// =========================================================
// ADMIN ROUTE GUARD
// =========================================================
//
// Requires JWT + ADMIN role.
// =========================================================

function AdminRoute() {
  const token = getAccessToken();

  if (!isTokenValid(token)) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  try {
    const parts = token.split(".");

    const payload = JSON.parse(
      atob(
        parts[1]
          .replace(/-/g, "+")
          .replace(/_/g, "/")
      )
    );

    if (getSessionRole(token) !== "ADMIN") {
      return (
        <Navigate
          to="/discover"
          replace
        />
      );
    }

  } catch (error) {
    console.error(
      "Unable to read admin JWT:",
      error
    );

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return <Outlet />;
}


// =========================================================
// APP CONTENT
// =========================================================

function AppContent() {
  const {
    currentRole,
    switchRole,
  } = useApp();

  const location = useLocation();

  // -------------------------------------------------------
  // KEEP ROLE SYNCHRONIZED WITH URL
  // -------------------------------------------------------

  useEffect(() => {

    if (
      location.pathname.startsWith(
        "/recruiter"
      ) &&
      currentRole !== "recruiter"
    ) {
      switchRole("recruiter", { silent: true });

    } else if (
      location.pathname.startsWith(
        "/admin"
      ) &&
      currentRole !== "admin"
    ) {
      switchRole("admin", { silent: true });

    } else if (
      !location.pathname.startsWith(
        "/recruiter"
      ) &&
      !location.pathname.startsWith(
        "/admin"
      ) &&
      currentRole !== "seeker"
    ) {
      switchRole("seeker", { silent: true });
    }

  }, [
    location.pathname,
    currentRole,
    switchRole,
  ]);


  return (
    <>
      <Routes>

        {/* =================================================
            PUBLIC ROUTES
            ================================================= */}

        <Route element={<PublicLayout />}>

          {/* Homepage is PUBLIC */}
          <Route
            path="/"
            element={<HomePage />}
          />

        </Route>


        {/* =================================================
            LOGIN / SIGNUP
            ================================================= */}

        <Route element={<PublicAuthRoute />}>

          <Route
            path="/login"
            element={<LoginPage />}
          />

          <Route
            path="/signup"
            element={<SignupPage />}
          />

        </Route>


        {/* =================================================
            AUTHENTICATED JOB SEEKER
            ================================================= */}

        <Route element={<ProtectedRoute />}>

          <Route
            element={<JobSeekerLayout />}
          >

            <Route
              path="/discover"
              element={<DiscoverPage />}
            />

            <Route
              path="/jobs/:id"
              element={<JobDetailsPage />}
            />

            <Route
              path="/saved"
              element={<SavedJobsPage />}
            />

            <Route
              path="/applications"
              element={<ApplicationsPage />}
            />

            <Route
              path="/recommendations"
              element={<RecommendationsPage />}
            />

            <Route
              path="/companies"
              element={<CompaniesPage />}
            />

            <Route
              path="/companies/:id"
              element={<CompanyDetailsPage />}
            />

            <Route
              path="/resume-analysis"
              element={<ResumeAnalysisPage />}
            />

            <Route
              path="/notifications"
              element={<NotificationsPage />}
            />

            <Route
              path="/notifications/preferences"
              element={<AlertPreferencesPage />}
            />

            <Route
              path="/dashboard"
              element={<DashboardPage />}
            />

            <Route
              path="/profile"
              element={<ProfilePage />}
            />

          </Route>


          {/* =================================================
              RECRUITER
              ================================================= */}

          <Route element={<RecruiterRoute />}>

            <Route
              path="/recruiter"
              element={<RecruiterLayout />}
            >

              <Route
                index
                element={
                  <RecruiterDashboard />
                }
              />

              <Route
                path="post-job"
                element={<PostJobPage />}
              />

              <Route
                path="manage-jobs"
                element={
                  <ManageJobsPage />
                }
              />

              <Route
                path="applicants"
                element={
                  <ApplicantsPage />
                }
              />

              <Route
                path="applicants/:id"
                element={
                  <ApplicantDetailsPage />
                }
              />

              <Route
                path="profile"
                element={
                  <RecruiterProfilePage />
                }
              />

              <Route
                path="notifications"
                element={
                  <RecruiterNotificationsPage />
                }
              />

            </Route>

          </Route>


          {/* =================================================
              ADMIN
              ================================================= */}

          <Route element={<AdminRoute />}>

            <Route
              path="/admin"
              element={<AdminLayout />}
            >

              <Route
                index
                element={
                  <AdminDashboard />
                }
              />

              <Route
                path="users"
                element={
                  <UserManagementPage />
                }
              />

              <Route
                path="recruiters"
                element={
                  <RecruiterManagementPage />
                }
              />

              <Route
                path="jobs"
                element={
                  <JobManagementPage />
                }
              />

              <Route
                path="applications"
                element={
                  <ApplicationOverviewPage />
                }
              />

              <Route
                path="reports"
                element={
                  <AdminReportsPage />
                }
              />

              <Route
                path="settings"
                element={
                  <AdminSettingsPage />
                }
              />

              <Route
                path="notifications"
                element={
                  <AdminNotificationsPage />
                }
              />

            </Route>

          </Route>

        </Route>


        {/* =================================================
            UNKNOWN ROUTE
            ================================================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>


      {/* ===================================================
          GLOBAL TOAST
          =================================================== */}

      <ToastContainer />

    </>
  );
}


// =========================================================
// ROOT APP
// =========================================================

export function App() {

  // const [
  //   showSplash,
  //   setShowSplash,
  // ] = useState(true);


  // -------------------------------------------------------
  // SPLASH SCREEN
  // -------------------------------------------------------

  // useEffect(() => {

  //   const splashShown =
  //     sessionStorage.getItem(
  //       "swipex_splash_shown"
  //     );

  //   if (splashShown) {
  //     setShowSplash(false);
  //   }

  // }, []);


  // const handleSplashComplete = () => {

  //   sessionStorage.setItem(
  //     "swipex_splash_shown",
  //     "true"
  //   );

  //   setShowSplash(false);

  // };


  return (
    <AppProvider>

      {/* {showSplash && (
        <SplashScreen
          onComplete={
            handleSplashComplete
          }
        />
      )} */}

      <Router>

        <AppContent />

      </Router>

    </AppProvider>
  );
}


export default App;


// import React, { useEffect, useState } from "react";
// import {
//   BrowserRouter as Router,
//   Routes,
//   Route,
//   Navigate,
//   Outlet,
//   useLocation,
// } from "react-router-dom";

// import { AppProvider, useApp } from "./context/AppContext";

// // Job Seeker Shared Components
// import { Navbar } from "./components/Navbar";
// import { Sidebar } from "./components/Sidebar";
// import { FilterModal } from "./components/FilterModal";
// import { ApplyModal } from "./components/ApplyModal";
// import { ToastContainer } from "./components/Toast";
// import { SplashScreen } from "./components/SplashScreen";

// // Job Seeker Pages
// import { DiscoverPage } from "./pages/DiscoverPage";
// import { JobDetailsPage } from "./pages/JobDetailsPage";
// import { SavedJobsPage } from "./pages/SavedJobsPage";
// import { ApplicationsPage } from "./pages/ApplicationsPage";
// import { RecommendationsPage } from "./pages/RecommendationsPage";
// import { ResumeAnalysisPage } from "./pages/ResumeAnalysisPage";
// import { NotificationsPage } from "./pages/NotificationsPage";
// import { DashboardPage } from "./pages/DashboardPage";
// import { ProfilePage } from "./pages/ProfilePage";
// import { CompaniesPage } from "./pages/CompaniesPage";
// import { CompanyDetailsPage } from "./pages/CompanyDetailsPage";
// import { LoginPage } from "./pages/LoginPage";
// import { SignupPage } from "./pages/SignupPage";

// // Recruiter Portal Components & Pages
// import { RecruiterLayout } from "./components/recruiter/RecruiterLayout";
// import { RecruiterDashboard } from "./pages/recruiter/RecruiterDashboard";
// import { PostJobPage } from "./pages/recruiter/PostJobPage";
// import { ManageJobsPage } from "./pages/recruiter/ManageJobsPage";
// import { ApplicantsPage } from "./pages/recruiter/ApplicantsPage";
// import { ApplicantDetailsPage } from "./pages/recruiter/ApplicantDetailsPage";
// import { RecruiterProfilePage } from "./pages/recruiter/RecruiterProfilePage";
// import { RecruiterNotificationsPage } from "./pages/recruiter/RecruiterNotificationsPage";

// // Admin Portal Components & Pages
// import { AdminLayout } from "./components/admin/AdminLayout";
// import { AdminDashboard } from "./pages/admin/AdminDashboard";
// import { UserManagementPage } from "./pages/admin/UserManagementPage";
// import { RecruiterManagementPage } from "./pages/admin/RecruiterManagementPage";
// import { JobManagementPage } from "./pages/admin/JobManagementPage";
// import { ApplicationOverviewPage } from "./pages/admin/ApplicationOverviewPage";
// import { AdminReportsPage } from "./pages/admin/AdminReportsPage";
// import { AdminSettingsPage } from "./pages/admin/AdminSettingsPage";
// import { AdminNotificationsPage } from "./pages/admin/AdminNotificationsPage";
// import HomePage from "./pages/HomePage";

// /**
//  * =========================================================
//  * JOB SEEKER LAYOUT
//  * =========================================================
//  *
//  * Desktop:
//  * Navbar
//  * Sidebar + Content
//  *
//  * Mobile:
//  * Navbar
//  * Slide-out Sidebar
//  * Content
//  */
// function JobSeekerLayout() {
//   const {
//     isFilterModalOpen,
//     setIsFilterModalOpen,
//     applyModalJob,
//     setApplyModalJob,
//   } = useApp();
  

//   // Desktop sidebar state
//   const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

//   // Mobile sidebar state
//   const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

//   const location = useLocation();


//   // Close mobile sidebar whenever route changes
//   useEffect(() => {
//     setMobileSidebarOpen(false);
//   }, [location.pathname]);

//   return (
//     <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 font-sans selection:bg-brand-600 selection:text-white">
//       {/* =====================================================
//           TOP NAVBAR
//           ===================================================== */}
//       <Navbar
//         sidebarOpen={mobileSidebarOpen}
//         onMenuClick={() => setMobileSidebarOpen((prev) => !prev)}
//       />

//       {/* =====================================================
//           SIDEBAR + MAIN CONTENT
//           ===================================================== */}
//       <div className="flex">
//         <Sidebar
//           collapsed={sidebarCollapsed}
//           onToggle={() => setSidebarCollapsed((prev) => !prev)}
//           mobileOpen={mobileSidebarOpen}
//           onMobileClose={() => setMobileSidebarOpen(false)}
//         />

//         {/* ===================================================
//             MAIN CONTENT
//             =================================================== */}
//         <main className="flex-1 min-w-0 min-h-[calc(100vh-4rem)]">
//           <div className="w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
//             <Outlet />
//           </div>

//           {/* =================================================
//               FOOTER
//               ================================================= */}
//           <footer className="border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-6 mt-12">
//             <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-zinc-400">
//               <div className="flex items-center gap-2">
//                 <span className="font-extrabold text-slate-900 dark:text-zinc-50 text-sm tracking-tight">
//                   SwipeX
//                 </span>

//                 <span className="text-slate-300">•</span>

//                 <span className="font-medium text-slate-600 dark:text-zinc-300 text-center sm:text-left">
//                   Intelligent Swipe-Based Career & Talent Acquisition Platform
//                 </span>
//               </div>

//               <div className="text-[11px] text-slate-400 font-medium">
//                 © {new Date().getFullYear()} SwipeX. All rights reserved.
//               </div>
//             </div>
//           </footer>
//         </main>
//       </div>

//       {/* =====================================================
//           CANDIDATE MODALS
//           ===================================================== */}

//       <FilterModal
//         isOpen={isFilterModalOpen}
//         onClose={() => setIsFilterModalOpen(false)}
//       />

//       <ApplyModal
//         job={applyModalJob}
//         isOpen={Boolean(applyModalJob)}
//         onClose={() => setApplyModalJob(null)}
//       />
//     </div>
//   );
// }
// function PublicLayout() {
//     return (
//       <div className="min-h-screen bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-50 font-sans">
//         <Navbar />
//         <main>
//           <Outlet />
//         </main>
//       </div>
//     );
//   }
// /**
//  * =========================================================
//  * APP CONTENT
//  * =========================================================
//  */
// function AppContent() {
//   const { currentRole, switchRole } = useApp();

//   const location = useLocation();

//   // Keep currentRole synchronized with URL
//   useEffect(() => {
//     if (
//       location.pathname.startsWith("/recruiter") &&
//       currentRole !== "recruiter"
//     ) {
//       switchRole("recruiter");
//     } else if (
//       location.pathname.startsWith("/admin") &&
//       currentRole !== "admin"
//     ) {
//       switchRole("admin");
//     } else if (
//       !location.pathname.startsWith("/recruiter") &&
//       !location.pathname.startsWith("/admin") &&
//       currentRole !== "seeker"
//     ) {
//       switchRole("seeker");
//     }
//   }, [location.pathname, currentRole, switchRole]);

//   return (
//     <>
//       <Routes>
//         {/* ================================================
//       JOB SEEKER APPLICATION
//       ================================================ */}

//         <Route element={<JobSeekerLayout />}>
//           <Route path="/discover" element={<DiscoverPage />} />

//           <Route path="/jobs/:id" element={<JobDetailsPage />} />

//           <Route path="/saved" element={<SavedJobsPage />} />

//           <Route path="/applications" element={<ApplicationsPage />} />

//           <Route path="/recommendations" element={<RecommendationsPage />} />

//           <Route path="/companies" element={<CompaniesPage />} />

//           <Route path="/companies/:id" element={<CompanyDetailsPage />} />

//           <Route path="/resume-analysis" element={<ResumeAnalysisPage />} />

//           <Route path="/notifications" element={<NotificationsPage />} />

//           <Route path="/dashboard" element={<DashboardPage />} />

//           <Route path="/profile" element={<ProfilePage />} />
//         </Route>

//         {/* ================================================
//       PUBLIC HOMEPAGE
//       ================================================ */}

//         <Route element={<PublicLayout />}>
//           <Route path="/" element={<HomePage />} />
//           <Route path="/login" element={<LoginPage />} />

//         <Route path="/signup" element={<SignupPage />} />
//         </Route>

//         {/* ================================================
//       AUTH
//       ================================================ */}

        

//         {/* ================================================
//       RECRUITER
//       ================================================ */}

//         <Route path="/recruiter" element={<RecruiterLayout />}>
//           <Route index element={<RecruiterDashboard />} />

//           <Route path="post-job" element={<PostJobPage />} />

//           <Route path="manage-jobs" element={<ManageJobsPage />} />

//           <Route path="applicants" element={<ApplicantsPage />} />

//           <Route path="applicants/:id" element={<ApplicantDetailsPage />} />

//           <Route path="profile" element={<RecruiterProfilePage />} />

//           <Route
//             path="notifications"
//             element={<RecruiterNotificationsPage />}
//           />
//         </Route>

//         {/* ================================================
//       ADMIN
//       ================================================ */}

//         <Route path="/admin" element={<AdminLayout />}>
//           <Route index element={<AdminDashboard />} />

//           <Route path="users" element={<UserManagementPage />} />

//           <Route path="recruiters" element={<RecruiterManagementPage />} />

//           <Route path="jobs" element={<JobManagementPage />} />

//           <Route path="applications" element={<ApplicationOverviewPage />} />

//           <Route path="reports" element={<AdminReportsPage />} />

//           <Route path="settings" element={<AdminSettingsPage />} />

//           <Route path="notifications" element={<AdminNotificationsPage />} />
//         </Route>

//         {/* ================================================
//       CATCH ALL
//       ================================================ */}

//         <Route path="*" element={<Navigate to="/" replace />} />
//       </Routes>

//       {/* Global Toast */}
//       <ToastContainer />
//     </>
//   );
// }

// /**
//  * =========================================================
//  * ROOT APP
//  * =========================================================
//  */
// export function App() {
//   const [showSplash, setShowSplash] = useState(true);

//   useEffect(() => {
//     const splashShown = sessionStorage.getItem(
//       "swipex_splash_shown"
//     );

//     if (splashShown) {
//       setShowSplash(false);
//     }
//   }, []);

//   const handleSplashComplete = () => {
//     sessionStorage.setItem(
//       "swipex_splash_shown",
//       "true"
//     );

//     setShowSplash(false);
//   };

//   return (
//     <AppProvider>

//       {showSplash && (
//         <SplashScreen
//           onComplete={handleSplashComplete}
//         />
//       )}

//       <Router>
//         <AppContent />
//       </Router>

//     </AppProvider>
//   );
// }

// export default App;

// // import React, { useEffect } from "react";
// // import {
// //   BrowserRouter as Router,
// //   Routes,
// //   Route,
// //   Navigate,
// //   Outlet,
// //   useLocation
// // } from "react-router-dom";
// // import { AppProvider, useApp } from "./context/AppContext";

// // // Job Seeker Shared Components
// // import { Navbar } from "./components/Navbar";
// // import { FilterModal } from "./components/FilterModal";
// // import { ApplyModal } from "./components/ApplyModal";
// // import { ToastContainer } from "./components/Toast";

// // // Job Seeker Pages
// // import { DiscoverPage } from "./pages/DiscoverPage";
// // import { JobDetailsPage } from "./pages/JobDetailsPage";
// // import { SavedJobsPage } from "./pages/SavedJobsPage";
// // import { ApplicationsPage } from "./pages/ApplicationsPage";
// // import { RecommendationsPage } from "./pages/RecommendationsPage";
// // import { ResumeAnalysisPage } from "./pages/ResumeAnalysisPage";
// // import { NotificationsPage } from "./pages/NotificationsPage";
// // import { DashboardPage } from "./pages/DashboardPage";
// // import { ProfilePage } from "./pages/ProfilePage";
// // import { CompaniesPage } from "./pages/CompaniesPage";
// // import { CompanyDetailsPage } from "./pages/CompanyDetailsPage";
// // import { LoginPage } from "./pages/LoginPage";
// // import { SignupPage } from "./pages/SignupPage";

// // // Recruiter Portal Components & Pages
// // import { RecruiterLayout } from "./components/recruiter/RecruiterLayout";
// // import { RecruiterDashboard } from "./pages/recruiter/RecruiterDashboard";
// // import { PostJobPage } from "./pages/recruiter/PostJobPage";
// // import { ManageJobsPage } from "./pages/recruiter/ManageJobsPage";
// // import { ApplicantsPage } from "./pages/recruiter/ApplicantsPage";
// // import { ApplicantDetailsPage } from "./pages/recruiter/ApplicantDetailsPage";
// // import { RecruiterProfilePage } from "./pages/recruiter/RecruiterProfilePage";
// // import { RecruiterNotificationsPage } from "./pages/recruiter/RecruiterNotificationsPage";

// // // Admin Portal Components & Pages
// // import { AdminLayout } from "./components/admin/AdminLayout";
// // import { AdminDashboard } from "./pages/admin/AdminDashboard";
// // import { UserManagementPage } from "./pages/admin/UserManagementPage";
// // import { RecruiterManagementPage } from "./pages/admin/RecruiterManagementPage";
// // import { JobManagementPage } from "./pages/admin/JobManagementPage";
// // import { ApplicationOverviewPage } from "./pages/admin/ApplicationOverviewPage";
// // import { AdminReportsPage } from "./pages/admin/AdminReportsPage";
// // import { AdminSettingsPage } from "./pages/admin/AdminSettingsPage";
// // import { AdminNotificationsPage } from "./pages/admin/AdminNotificationsPage";

// // /**
// //  * JobSeekerLayout wraps the existing Candidate experience:
// //  * Header Navbar, Main body Outlet, Footer, FilterModal, ApplyModal.
// //  * The existing styling and swipe experience are 100% preserved.
// //  */
// // function JobSeekerLayout() {
// //   const { isFilterModalOpen, setIsFilterModalOpen, applyModalJob, setApplyModalJob } = useApp();

// //   return (
// //     <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 flex flex-col font-sans selection:bg-brand-600 selection:text-white">
// //       <Navbar />

// //       <main className="flex-1">
// //         <Outlet />
// //       </main>

// //       <footer className="border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-6 mt-12">
// //         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-zinc-400">
// //           <div className="flex items-center gap-2">
// //             <span className="font-extrabold text-slate-900 dark:text-zinc-50 text-sm tracking-tight">SwipeX</span>
// //             <span className="text-slate-300">•</span>
// //             <span className="font-medium text-slate-600 dark:text-zinc-300">
// //               Intelligent Swipe-Based Career & Talent Acquisition Platform
// //             </span>
// //           </div>
// //           <div className="text-[11px] text-slate-400 font-medium">
// //             © {new Date().getFullYear()} SwipeX. All rights reserved.
// //           </div>
// //         </div>
// //       </footer>

// //       {/* Candidate Modals */}
// //       <FilterModal
// //         isOpen={isFilterModalOpen}
// //         onClose={() => setIsFilterModalOpen(false)}
// //       />

// //       <ApplyModal
// //         job={applyModalJob}
// //         isOpen={Boolean(applyModalJob)}
// //         onClose={() => setApplyModalJob(null)}
// //       />
// //     </div>
// //   );
// // }

// // function AppContent() {
// //   const { currentRole, switchRole } = useApp();
// //   const location = useLocation();

// //   // Keep currentRole in context in sync with browser path
// //   useEffect(() => {
// //     if (location.pathname.startsWith("/recruiter") && currentRole !== "recruiter") {
// //       switchRole("recruiter");
// //     } else if (location.pathname.startsWith("/admin") && currentRole !== "admin") {
// //       switchRole("admin");
// //     } else if (
// //       !location.pathname.startsWith("/recruiter") &&
// //       !location.pathname.startsWith("/admin") &&
// //       currentRole !== "seeker"
// //     ) {
// //       switchRole("seeker");
// //     }
// //   }, [location.pathname, currentRole, switchRole]);

// //   return (
// //     <>
// //       <Routes>
// //         {/* ========================================================= */}
// //         {/* JOB SEEKER PORTAL (Preserved exactly with full functionality) */}
// //         {/* ========================================================= */}
// //         <Route element={<JobSeekerLayout />}>
// //           <Route path="/" element={<DiscoverPage />} />
// //           <Route path="/jobs/:id" element={<JobDetailsPage />} />
// //           <Route path="/saved" element={<SavedJobsPage />} />
// //           <Route path="/applications" element={<ApplicationsPage />} />
// //           <Route path="/recommendations" element={<RecommendationsPage />} />
// //           <Route path="/companies" element={<CompaniesPage />} />
// //           <Route path="/companies/:id" element={<CompanyDetailsPage />} />
// //           <Route path="/resume-analysis" element={<ResumeAnalysisPage />} />
// //           <Route path="/notifications" element={<NotificationsPage />} />
// //           <Route path="/dashboard" element={<DashboardPage />} />
// //           <Route path="/profile" element={<ProfilePage />} />
// //           <Route path="/login" element={<LoginPage />} />
// //           <Route path="/signup" element={<SignupPage />} />
// //         </Route>

// //         {/* ========================================================= */}
// //         {/* RECRUITER / EMPLOYER PORTAL */}
// //         {/* ========================================================= */}
// //         <Route path="/recruiter" element={<RecruiterLayout />}>
// //           <Route index element={<RecruiterDashboard />} />
// //           <Route path="post-job" element={<PostJobPage />} />
// //           <Route path="manage-jobs" element={<ManageJobsPage />} />
// //           <Route path="applicants" element={<ApplicantsPage />} />
// //           <Route path="applicants/:id" element={<ApplicantDetailsPage />} />
// //           <Route path="profile" element={<RecruiterProfilePage />} />
// //           <Route path="notifications" element={<RecruiterNotificationsPage />} />
// //         </Route>

// //         {/* ========================================================= */}
// //         {/* PLATFORM ADMIN PORTAL */}
// //         {/* ========================================================= */}
// //         <Route path="/admin" element={<AdminLayout />}>
// //           <Route index element={<AdminDashboard />} />
// //           <Route path="users" element={<UserManagementPage />} />
// //           <Route path="recruiters" element={<RecruiterManagementPage />} />
// //           <Route path="jobs" element={<JobManagementPage />} />
// //           <Route path="applications" element={<ApplicationOverviewPage />} />
// //           <Route path="reports" element={<AdminReportsPage />} />
// //           <Route path="settings" element={<AdminSettingsPage />} />
// //           <Route path="notifications" element={<AdminNotificationsPage />} />
// //         </Route>

// //         {/* Catch-all route */}
// //         <Route path="*" element={<Navigate to="/" replace />} />
// //       </Routes>

// //       {/* Global Toast Feedback Container (Active across all 3 portals) */}
// //       <ToastContainer />
// //     </>
// //   );
// // }

// // export function App() {
// //   return (
// //     <AppProvider>
// //       <Router>
// //         <AppContent />
// //       </Router>
// //     </AppProvider>
// //   );
// // }

// // export default App;