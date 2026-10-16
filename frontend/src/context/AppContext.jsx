import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import {
  INITIAL_JOBS,
  INITIAL_APPLICATIONS,
  INITIAL_RECOMMENDATIONS,
} from "../utils/mockData";
import {
  INITIAL_RECRUITER_PROFILE,
  INITIAL_RECRUITER_JOBS,
  INITIAL_RECRUITER_APPLICANTS,
  RECRUITER_OVERVIEW_STATS
} from "../utils/recruiterMockData";
import { adminService } from "../services/adminService";
import { recordSwipe, getSwipeHistory, undoSwipe } from "../services/swipeService";
import confetti from "canvas-confetti";

import { authService } from "../services/authService";
import { notificationService, toUiNotification } from "../services/notificationService";

export const AppContext = createContext();

const STORAGE_KEYS = {
  USER: "swipex_user",
  AUTH: "swipex_auth",
  ACTIVE_ROLE: "swipex_active_role", // "seeker" | "recruiter" | "admin"
  SAVED_JOBS: "swipex_saved_jobs",
  APPLICATIONS: "swipex_applications",
  SWIPED_JOBS: "swipex_swiped_jobs",
  SWIPE_HISTORY: "swipex_swipe_history",
  NOTIFICATIONS: "swipex_notifications",
  RESUME_ANALYSIS: "swipex_resume_analysis",
  RECRUITER_PROFILE: "swipex_recruiter_profile",
  RECRUITER_JOBS: "swipex_recruiter_jobs",
  RECRUITER_APPLICANTS: "swipex_recruiter_applicants",
  ADMIN_USERS: "swipex_admin_users",
  ADMIN_RECRUITERS: "swipex_admin_recruiters",
  ADMIN_JOBS: "swipex_admin_jobs",
  ADMIN_APPLICATIONS: "swipex_admin_applications",
  ADMIN_PROFILE: "swipex_admin_profile"
};

export function AppProvider({ children }) {
  // Active Role: "seeker" | "recruiter" | "admin"
  const [currentRole, setCurrentRole] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_ROLE);
    return saved ? JSON.parse(saved) : "seeker";
  });

  // 1. User & Authentication
  const [user, setUser] = useState(() => {
  const saved = localStorage.getItem(
    STORAGE_KEYS.USER
  );

  return saved
    ? JSON.parse(saved)
    : null;
});

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
  return Boolean(
    localStorage.getItem("swipex_access_token")
  );
});

  // 2. Recruiter States
  const [recruiterProfile, setRecruiterProfile] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RECRUITER_PROFILE);
    return saved ? JSON.parse(saved) : INITIAL_RECRUITER_PROFILE;
  });

  const [recruiterJobs, setRecruiterJobs] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RECRUITER_JOBS);
    return saved ? JSON.parse(saved) : INITIAL_RECRUITER_JOBS;
  });

  const [recruiterApplicants, setRecruiterApplicants] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RECRUITER_APPLICANTS);
    return saved ? JSON.parse(saved) : INITIAL_RECRUITER_APPLICANTS;
  });

  // 3. Admin States
  // Admin data comes from the database through /admin/* (loaded when an ADMIN is signed in)
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminRecruiters, setAdminRecruiters] = useState([]);
  const [adminJobs, setAdminJobs] = useState([]);
  const [adminApplications, setAdminApplications] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");

  const [savedJobs, setSavedJobs] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SAVED_JOBS);
    return saved ? JSON.parse(saved) : [INITIAL_JOBS[0], INITIAL_JOBS[2]];
  });

  // 3. Swiped Jobs state tracking: { skipped: string[], liked: string[] }
  const [swipedState, setSwipedState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SWIPED_JOBS);
    return saved ? JSON.parse(saved) : { skipped: [], liked: [] };
  });

  // 3b. Detailed Swipe History: Array of { jobId, action: "skipped" | "interested", timestamp }
  const [swipeHistory, setSwipeHistory] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SWIPE_HISTORY);
    return saved ? JSON.parse(saved) : [];
  });

  // 4. Job Applications
  const [applications, setApplications] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.APPLICATIONS);
    return saved ? JSON.parse(saved) : INITIAL_APPLICATIONS;
  });

  // 5. Notifications
  // Notifications come from the backend (job service) and are polled; nothing is mocked or cached locally.
  const [notifications, setNotifications] = useState([]);

  // 6. Resume ATS Analysis
  const [resumeAnalysis, setResumeAnalysis] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RESUME_ANALYSIS);
    return saved ? JSON.parse(saved) : null;
  });

  // 7. Search and Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilterPill, setActiveFilterPill] = useState("All");
  const [filters, setFilters] = useState({
    companyType: "All",
    jobType: "All",
    workMode: "All",
    experienceLevel: "All",
    location: "All",
    competition: "All",
    minSalary: 0,
    isRemote: false,
    isInternship: false,
    isFresherFriendly: false,
    isNewlyFounded: false,
    recentlyPosted: false,
    lowCompetition: false,
    selectedSkill: "All"
  });

  // 8. Modals and Overlays
  const [applyModalJob, setApplyModalJob] = useState(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ROLE, JSON.stringify(currentRole));
  }, [currentRole]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }, [user]);

  // useEffect(() => {
  //   localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(isAuthenticated));
  // }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SAVED_JOBS, JSON.stringify(savedJobs));
  }, [savedJobs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SWIPED_JOBS, JSON.stringify(swipedState));
  }, [swipedState]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SWIPE_HISTORY, JSON.stringify(swipeHistory));
  }, [swipeHistory]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(applications));
  }, [applications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RESUME_ANALYSIS, JSON.stringify(resumeAnalysis));
  }, [resumeAnalysis]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RECRUITER_PROFILE, JSON.stringify(recruiterProfile));
  }, [recruiterProfile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RECRUITER_JOBS, JSON.stringify(recruiterJobs));
  }, [recruiterJobs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RECRUITER_APPLICANTS, JSON.stringify(recruiterApplicants));
  }, [recruiterApplicants]);

  // Toast trigger
  const addToast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Role switching
  const switchRole = useCallback((newRole, { silent = false } = {}) => {
    setCurrentRole(newRole);
    if (silent) return; // automatic URL sync (login/redirect) should not toast
    const roleLabels = {
      seeker: "Job Seeker",
      recruiter: "Recruiter",
      admin: "Platform Admin"
    };
    addToast(`Switched workspace to ${roleLabels[newRole] || newRole} Mode`, "info");
  }, [addToast]);


  // ============================================================
// LOGIN
// Auth Service :5001
// ============================================================

  // Everything below belongs to ONE account: clear it when the account changes so a new user
  // never inherits the previous user's swipes, saved jobs, applications or resume analysis.
  const resetUserScopedState = useCallback(() => {
    setSavedJobs([]);
    setSwipedState({ skipped: [], liked: [] });
    setSwipeHistory([]);
    setApplications([]);
    setNotifications([]);
    setResumeAnalysis(null);
    [STORAGE_KEYS.SAVED_JOBS, STORAGE_KEYS.SWIPED_JOBS, STORAGE_KEYS.SWIPE_HISTORY,
     STORAGE_KEYS.APPLICATIONS, STORAGE_KEYS.RESUME_ANALYSIS].forEach((k) => localStorage.removeItem(k));
  }, []);

const login = useCallback(
  async (credentials) => {
    try {
      // --------------------------------------------------------
      // Support both:
      // login({ email, password })
      // and old:
      // login(email, password)
      // --------------------------------------------------------

      const email =
        typeof credentials === "object"
          ? credentials.email
          : credentials;

      const password =
        typeof credentials === "object"
          ? credentials.password
          : arguments[1];

      if (!email || !password) {
        throw new Error(
          "Email and password are required."
        );
      }

      // --------------------------------------------------------
      // Call Auth Service
      // --------------------------------------------------------

      const res = await authService.login({
        email: email.trim().toLowerCase(),
        password,
      });

      console.log(
        "LOGIN RESPONSE:",
        res
      );

      // --------------------------------------------------------
      // Validate response
      // --------------------------------------------------------

      if (
        !res ||
        !res.access_token ||
        !res.refresh_token ||
        !res.user
      ) {
        throw new Error(
          "Invalid login response from authentication service."
        );
      }

      // --------------------------------------------------------
      // Store JWT
      // --------------------------------------------------------

      localStorage.setItem(
        "swipex_access_token",
        res.access_token
      );

      localStorage.setItem(
        "swipex_refresh_token",
        res.refresh_token
      );

      // --------------------------------------------------------
      // Get actual backend user
      // --------------------------------------------------------

      const loggedInUser = {
        ...res.user,
        role: String(
          res.user.role || "JOB_SEEKER"
        ).toUpperCase(),
      };

      console.log(
        "LOGGED IN USER:",
        loggedInUser
      );

      console.log(
        "LOGGED IN ROLE:",
        loggedInUser.role
      );

      // --------------------------------------------------------
      // Update React state
      // --------------------------------------------------------

      resetUserScopedState();
      setUser(loggedInUser);

      setIsAuthenticated(true);

      // Keep currentRole synchronized with backend role
      if (
        loggedInUser.role === "RECRUITER"
      ) {
        setCurrentRole("recruiter");
      } else if (
        loggedInUser.role === "ADMIN"
      ) {
        setCurrentRole("admin");
      } else {
        setCurrentRole("seeker");
      }

      // --------------------------------------------------------
      // Persist user
      // --------------------------------------------------------

      localStorage.setItem(
        "swipex_user",
        JSON.stringify(loggedInUser)
      );

      // --------------------------------------------------------
      // Toast
      // --------------------------------------------------------

      addToast(
        `Welcome back, ${loggedInUser.name || "User"}!`,
        "success"
      );

      // IMPORTANT:
      // Return the actual USER, not true
      return loggedInUser;

    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      addToast(
        error?.response?.data?.message ||
          error?.message ||
          "Invalid email or password",
        "error"
      );

      throw error;
    }
  },
  [addToast, resetUserScopedState]
);

  // Auth actions
//   const login = useCallback(
//   async (credentials) => {
//     try {
//       const response =
//         await authService.login({
//           email: credentials.email,
//           password: credentials.password,
//         });

//       if (!response.success) {
//         throw new Error(
//           response.message ||
//           "Login failed"
//         );
//       }

//       localStorage.setItem(
//         "swipex_access_token",
//         response.access_token
//       );

//       localStorage.setItem(
//         "swipex_refresh_token",
//         response.refresh_token
//       );

//       localStorage.setItem(
//         "swipex_user",
//         JSON.stringify(response.user)
//       );

//       setUser(response.user);
//       setIsAuthenticated(true);

//       const role =
//         String(response.user.role || "")
//           .toUpperCase();

//       if (role === "RECRUITER") {
//         setCurrentRole("recruiter");
//       } else if (role === "ADMIN") {
//         setCurrentRole("admin");
//       } else {
//         setCurrentRole("seeker");
//       }

//       addToast(
//         "Welcome back to SwipeX!",
//         "success"
//       );
//       console.log("role from backend:", response.user.role);

//       return response.user;

//     } catch (error) {

//       const message =
//         error.response?.data?.message ||
//         error.message ||
//         "Login failed";

//       addToast(message, "error");

//       throw error;
//     }
//   },
//   [addToast]
// );

  const signup = useCallback(
  async (formData) => {
    try {

      const skills = Array.isArray(formData.skills)
        ? formData.skills
        : typeof formData.skills === "string"
          ? formData.skills
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [];

      const response =
        await authService.register({

          name: formData.name,

          email: formData.email,

          password: formData.password,

          role:
            formData.accountType 
            ||
            "JOB_SEEKER",

          phone:
            formData.phone || null,

          location:
            formData.preferredLocation ||
            formData.location ||
            null,

          desired_role:
            formData.targetRole ||
            formData.desiredRole ||
            null,

          experience:
            formData.experienceLevel ||
            formData.experience ||
            null,

          preferred_salary:
            formData.preferredSalary ||
            null,

          company_name:
            formData.companyName || null,

          industry:
            formData.industry || null,

          company_size:
            formData.companySize || null,

          bio:
            formData.bio ||
            null,

          skills,
        });

      if (!response.success) {
        throw new Error(
          response.message ||
          "Registration failed"
        );
      }

      localStorage.setItem(
        "swipex_access_token",
        response.access_token
      );

      localStorage.setItem(
        "swipex_refresh_token",
        response.refresh_token
      );

      localStorage.setItem(
        "swipex_user",
        JSON.stringify(response.user)
      );

      resetUserScopedState();
      setUser(response.user);
      setIsAuthenticated(true);

      const role =
        String(response.user.role || "")
          .toUpperCase();

      if (role === "RECRUITER") {
        setCurrentRole("recruiter");
      } else if (role === "ADMIN") {
        setCurrentRole("admin");
      } else {
        setCurrentRole("seeker");
      }

      addToast(
        "Account created successfully!",
        "success"
      );
      console.log("role from backend:", response.user.role);

      return response.user;

    } catch (error) {

      const message =
        error.response?.data?.message ||
        error.message ||
        "Registration failed";

      addToast(message, "error");

      throw error;
    }
  },
  [addToast, resetUserScopedState]
);

  const logout = useCallback(
  async () => {

    try {
      if (
        localStorage.getItem(
          "swipex_access_token"
        )
      ) {
        await authService.logout();
      }
    } catch (error) {
      console.warn(
        "Logout API failed:",
        error
      );
    } finally {

      localStorage.removeItem(
        "swipex_access_token"
      );

      localStorage.removeItem(
        "swipex_refresh_token"
      );

      localStorage.removeItem(
        "swipex_user"
      );

      localStorage.removeItem(
        "swipex_auth"
      );

      resetUserScopedState();
      setUser(null);
      setIsAuthenticated(false);
      setCurrentRole("seeker");

      addToast(
        "Logged out successfully.",
        "info"
      );
    }
  },
  [addToast, resetUserScopedState]
);

  // Recruiter Operations
  const updateRecruiterProfile = useCallback((fields) => {
    setRecruiterProfile((prev) => ({ ...prev, ...fields }));
    addToast("Recruiter profile updated successfully", "success");
  }, [addToast]);

  const addRecruiterJob = useCallback((jobData) => {
    const newJob = {
      id: `rec-job-${Date.now()}`,
      postedDate: new Date().toISOString().split("T")[0],
      applicantsCount: 0,
      shortlistedCount: 0,
      interviewCount: 0,
      status: jobData.status || "Active",
      ...jobData
    };
    setRecruiterJobs((prev) => [newJob, ...prev]);
    addToast(`Job posted: "${newJob.title}" is now published!`, "success");
    return newJob;
  }, [recruiterProfile, addToast]);

  const updateRecruiterJob = useCallback((id, updatedFields) => {
    setRecruiterJobs((prev) =>
      prev.map((job) => (job.id === id ? { ...job, ...updatedFields } : job))
    );
    addToast("Job updated successfully", "success");
  }, [addToast]);

  const deleteRecruiterJob = useCallback((id) => {
    setRecruiterJobs((prev) => prev.filter((job) => job.id !== id));
    addToast("Job listing deleted", "info");
  }, [addToast]);

  const toggleRecruiterJobStatus = useCallback((id) => {
    setRecruiterJobs((prev) =>
      prev.map((job) => {
        if (job.id === id) {
          const nextStatus = job.status === "Active" ? "Inactive" : "Active";
          return { ...job, status: nextStatus };
        }
        return job;
      })
    );
    addToast("Job status updated", "info");
  }, [addToast]);

  const updateApplicantStatus = useCallback((id, newStatus, notes = "") => {
    setRecruiterApplicants((prev) =>
      prev.map((app) => {
        if (app.id === id) {
          return {
            ...app,
            status: newStatus,
            recruiterNotes: notes !== "" ? notes : app.recruiterNotes
          };
        }
        return app;
      })
    );
    addToast(`Candidate status changed to: ${newStatus}`, "success");
  }, [addToast]);

  // ---------------------------------------------------------------------------------------------
  // Admin console: every action calls the real /admin/* API, then reloads the lists.
  // ---------------------------------------------------------------------------------------------
  const isAdminUser = Boolean(isAuthenticated && user && String(user.role || "").toUpperCase() === "ADMIN");

  const refreshAdminData = useCallback(async () => {
    if (!isAdminUser) return;
    setAdminLoading(true);
    try {
      const [users, recruiters, jobs, apps] = await Promise.all([
        adminService.users(),
        adminService.recruiters(),
        adminService.jobs(),
        adminService.applications(),
      ]);
      setAdminUsers(users);
      setAdminRecruiters(recruiters);
      setAdminJobs(jobs);
      setAdminApplications(apps);
      setAdminError("");
    } catch (error) {
      setAdminError(error?.response?.data?.message || "Could not load admin data.");
    } finally {
      setAdminLoading(false);
    }
  }, [isAdminUser]);

  useEffect(() => {
    if (!isAdminUser) {
      setAdminUsers([]); setAdminRecruiters([]); setAdminJobs([]); setAdminApplications([]);
      return undefined;
    }
    refreshAdminData();
    const timer = setInterval(refreshAdminData, 30000);
    return () => clearInterval(timer);
  }, [isAdminUser, refreshAdminData]);

  const adminAction = useCallback(async (call, okMessage) => {
    try {
      await call();
      addToast(okMessage, "success");
      await refreshAdminData();
      return true;
    } catch (error) {
      addToast(error?.response?.data?.message || "Action failed", "error");
      return false;
    }
  }, [addToast, refreshAdminData]);

  const toggleUserStatus = useCallback((id) => {
    const target = adminUsers.find((u) => u.id === id);
    if (!target) return Promise.resolve(false);
    const next = target.status === "Active" ? "Suspended" : "Active";
    return adminAction(() => adminService.updateUser(id, { status: next }),
      next === "Suspended" ? "Account suspended" : "Account reactivated");
  }, [adminUsers, adminAction]);

  const deleteUser = useCallback(
    (id) => adminAction(() => adminService.deleteUser(id), "User deleted"), [adminAction]);

  const updateUserRole = useCallback(
    (id, newRole) => adminAction(() => adminService.updateUser(id, { role: newRole }), `Role changed to ${newRole}`),
    [adminAction]);

  const updateRecruiterOrgStatus = useCallback(
    (id, newStatus) => adminAction(() => adminService.updateRecruiter(id, newStatus), `Recruiter set to ${newStatus}`),
    [adminAction]);

  const updateAdminJobStatus = useCallback(
    (id, newStatus) => adminAction(() => adminService.updateJob(id, newStatus), `Job set to ${newStatus}`),
    [adminAction]);

  const deleteAdminJob = useCallback(
    (id) => adminAction(() => adminService.deleteJob(id), "Job deleted"), [adminAction]);

  // The admin's identity is the signed-in account (no separate mock profile)
  const adminProfile = useMemo(() => ({
    name: user?.name || "Admin",
    email: user?.email || "",
    role: "Platform Administrator",
    avatar: null,
  }), [user]);

  const updateAdminProfile = useCallback(async (fields) => {
    try {
      await authService.updateProfile?.({ name: fields.name });
      setUser((prev) => (prev ? { ...prev, name: fields.name || prev.name } : prev));
      addToast("Profile updated", "success");
    } catch (error) {
      addToast(error?.response?.data?.message || "Could not update profile", "error");
    }
  }, [addToast]);

  // Save profile fields (skills included) to the auth service; recommendations use them immediately.
  const updateUserProfile = useCallback(
    async (fields) => {
      try {
        const res = await authService.updateProfile(fields);
        if (res?.user) {
          setUser(res.user);
          localStorage.setItem("swipex_user", JSON.stringify(res.user));
        }
        addToast("Profile updated successfully", "success");
        return true;
      } catch (error) {
        addToast(error?.response?.data?.message || "Could not update your profile", "error");
        return false;
      }
    },
    [addToast]
  );

  const updateProfile = useCallback(
    (updatedFields) => {
      setUser((prev) => {
        const next = { ...prev, ...updatedFields };
        // Recalculate profile completion
        let score = 50;
        if (next.name) score += 10;
        if (next.skills?.length > 0) score += 10;
        if (next.experience?.length > 0) score += 10;
        if (next.education?.length > 0) score += 10;
        if (next.resumeName) score += 10;
        next.profileCompletion = Math.min(100, score);
        return next;
      });
      addToast("Profile updated successfully", "success");
    },
    [addToast]
  );

  // Saved Jobs actions
  const isJobSaved = useCallback(
    (jobId) => {
      return savedJobs.some((j) => j.id === jobId);
    },
    [savedJobs]
  );

  const toggleSaveJob = useCallback(
    (job) => {
      if (isJobSaved(job.id)) {
        setSavedJobs((prev) => prev.filter((j) => j.id !== job.id));
        addToast("Job removed from saved jobs", "info");
      } else {
        setSavedJobs((prev) => [job, ...prev]);
        addToast("Job saved successfully", "success");
      }
    },
    [isJobSaved, addToast]
  );

  const removeSavedJob = useCallback(
    (jobId) => {
      setSavedJobs((prev) => prev.filter((j) => j.id !== jobId));
      addToast("Job removed from saved jobs", "info");
    },
    [addToast]
  );

  // Swipe Action Handlers
  const handleSwipeLeft = useCallback(
    (job) => {
      if (!job) return;
      const swipeRecord = {
        jobId: job.id,
        action: "skipped",
        timestamp: new Date().toISOString()
      };
      recordSwipe(job.id, "skipped").catch(() => {});
      setSwipeHistory((prev) => [swipeRecord, ...prev]);
      setSwipedState((prev) => ({
        ...prev,
        skipped: prev.skipped.includes(job.id) ? prev.skipped : [...prev.skipped, job.id]
      }));
      addToast(`Skipped: ${job.title}`, "info");
    },
    [addToast]
  );

  const handleSwipeRight = useCallback(
    (job) => {
      if (!job) return;
      const swipeRecord = {
        jobId: job.id,
        action: "interested",
        timestamp: new Date().toISOString()
      };
      recordSwipe(job.id, "interested").catch(() => {});
      setSwipeHistory((prev) => [swipeRecord, ...prev]);
      setSwipedState((prev) => ({
        ...prev,
        liked: prev.liked.includes(job.id) ? prev.liked : [...prev.liked, job.id]
      }));
      // Auto save to user's saved jobs
      setSavedJobs((prev) => {
        if (prev.some((j) => j.id === job.id)) return prev;
        return [job, ...prev];
      });
      addToast(`Saved to Interested: ${job.title}`, "success");
    },
    [addToast]
  );

  const resetSwipes = useCallback(() => {
    setSwipedState({ skipped: [], liked: [] });
    setSwipeHistory([]);
    addToast("Deck refreshed! All jobs are ready to explore.", "success");
  }, [addToast]);

  const undoLastSwipe = useCallback(() => {
    if (!swipeHistory || swipeHistory.length === 0) {
      addToast("No recent swipes to undo", "info");
      return;
    }

    const [lastSwipe, ...remainingHistory] = swipeHistory;
    const targetJobId = lastSwipe.jobId;

    // Optimistically restore state
    setSwipeHistory(remainingHistory);
    setSwipedState((prev) => ({
      skipped: prev.skipped.filter((id) => id !== targetJobId),
      liked: prev.liked.filter((id) => id !== targetJobId)
    }));

    // If it was marked interested, remove it from savedJobs
    if (lastSwipe.action === "interested") {
      setSavedJobs((prev) => prev.filter((j) => j.id !== targetJobId));
    }

    // Call service layer in background
    undoSwipe(targetJobId).catch(() => {});

    addToast("Previous job restored to deck", "info");
  }, [swipeHistory, addToast]);

  // Apply to Job
  const applyToJob = useCallback(
    (job, notes = "") => {
      // Check if already applied
      const existing = applications.find((a) => a.jobId === job.id);
      if (existing) {
        addToast("You have already applied to this position.", "info");
        return existing;
      }

      const newApp = {
        id: `app-${Date.now()}`,
        jobId: job.id,
        title: job.title,
        company: job.company,
        logo: job.logo,
        location: job.location,
        salary: job.salary,
        status: "Applied",
        appliedDate: new Date().toISOString().split("T")[0],
        lastUpdated: "Just now",
        matchPercentage: job.matchPercentage,
        notes: notes || "Applied via SwipeX One-Click Application.",
        timeline: [
          { step: "Applied", date: "Today", done: true },
          { step: "Application Review", date: "In Progress", done: false },
          { step: "Interview", date: "Pending", done: false },
          { step: "Final Status", date: "Pending", done: false }
        ]
      };

      setApplications((prev) => [newApp, ...prev]);
      
      // Also add to liked
      setSwipedState((prev) => ({
        ...prev,
        liked: prev.liked.includes(job.id) ? prev.liked : [...prev.liked, job.id]
      }));

      // Add a celebration notification
      const newNotif = {
        id: `notif-${Date.now()}`,
        title: "Application Submitted",
        message: `Successfully applied to ${job.title} at ${job.company}.`,
        time: "Just now",
        read: false,
        type: "application",
        link: "/applications"
      };
      setNotifications((prev) => [newNotif, ...prev]);

      // Fire subtle confetti
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch {
        // Safe fallback
      }

      addToast("Application submitted successfully", "success");
      return newApp;
    },
    [applications, addToast]
  );

  // Notification management (backend-backed)
  const knownNotificationIds = React.useRef(null);

  const refreshNotifications = useCallback(async () => {
    if (!localStorage.getItem("swipex_access_token")) return;
    try {
      const { notifications: list } = await notificationService.list({ limit: 50 });
      const mapped = list.map(toUiNotification);
      // toast anything that arrived since the last poll (not on the first load)
      if (knownNotificationIds.current) {
        mapped
          .filter((n) => !n.read && !knownNotificationIds.current.has(n.id))
          .slice(0, 3)
          .forEach((n) => addToast(`${n.title}: ${n.message}`, "info"));
      }
      knownNotificationIds.current = new Set(mapped.map((n) => n.id));
      setNotifications(mapped);
    } catch {
      /* offline: keep what we have */
    }
  }, [addToast]);

  useEffect(() => {
    knownNotificationIds.current = null;
    if (!isAuthenticated || !user?.id) {
      setNotifications([]);
      return undefined;
    }
    refreshNotifications();
    const timer = setInterval(refreshNotifications, 15000);
    const onFocus = () => refreshNotifications();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [isAuthenticated, user?.id, refreshNotifications]);

  const markNotificationRead = useCallback((id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    notificationService.markRead(id).catch(() => refreshNotifications());
  }, [refreshNotifications]);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    notificationService.markAllRead().catch(() => refreshNotifications());
    addToast("All notifications marked as read", "info");
  }, [addToast, refreshNotifications]);

  const clearNotification = useCallback(
    (id) => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      notificationService.remove(id).catch(() => refreshNotifications());
      addToast("Notification dismissed", "info");
    },
    [addToast, refreshNotifications]
  );

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  // Filter setters
  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setActiveFilterPill("All");
    setFilters({
      companyType: "All",
      jobType: "All",
      workMode: "All",
      experienceLevel: "All",
      location: "All",
      competition: "All",
      minSalary: 0,
      isRemote: false,
      isInternship: false,
      isFresherFriendly: false,
      isNewlyFounded: false,
      recentlyPosted: false,
      lowCompetition: false,
      selectedSkill: "All"
    });
    addToast("Filters reset to default", "info");
  }, [addToast]);

  return (
    <AppContext.Provider
      value={{
        // Role & Auth
        currentRole,
        switchRole,
        user,
        isAuthenticated,
        login,
        signup,
        logout,
        updateProfile,

        // Recruiter State & Actions
        recruiterProfile,
        updateRecruiterProfile,
        recruiterJobs,
        addRecruiterJob,
        updateRecruiterJob,
        deleteRecruiterJob,
        toggleRecruiterJobStatus,
        recruiterApplicants,
        updateApplicantStatus,
        RECRUITER_OVERVIEW_STATS,

        // Admin State & Actions
        adminUsers,
        toggleUserStatus,
        deleteUser,
        updateUserRole,
        adminRecruiters,
        updateRecruiterOrgStatus,
        adminJobs,
        updateAdminJobStatus,
        deleteAdminJob,
        adminApplications,
        adminProfile,
        updateAdminProfile,
        adminLoading,
        adminError,
        refreshAdminData,

        // Job Seeker State & Actions (Preserved 100%)
        savedJobs,
        isJobSaved,
        toggleSaveJob,
        removeSavedJob,
        swipedState,
        swipeHistory,
        handleSwipeLeft,
        handleSwipeRight,
        resetSwipes,
        undoLastSwipe,
        canUndo: (swipeHistory && swipeHistory.length > 0),
        applications,
        applyToJob,
        notifications,
        unreadNotificationsCount,
        markNotificationRead,
        markAllNotificationsRead,
        clearNotification,
        resumeAnalysis,
        setResumeAnalysis,
        updateUserProfile,
        refreshNotifications,
        searchQuery,
        setSearchQuery,
        activeFilterPill,
        setActiveFilterPill,
        filters,
        setFilters,
        resetFilters,
        applyModalJob,
        setApplyModalJob,
        isFilterModalOpen,
        setIsFilterModalOpen,
        toasts,
        addToast,
        removeToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
