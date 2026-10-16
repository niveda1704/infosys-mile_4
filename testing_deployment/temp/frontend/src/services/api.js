import axios from "axios";
import {
  INITIAL_JOBS,
  INITIAL_USER,
  INITIAL_APPLICATIONS,
  INITIAL_RECOMMENDATIONS,
  INITIAL_NOTIFICATIONS,
  MOCK_RESUME_ANALYSIS,
  MOCK_DASHBOARD_STATS
} from "../utils/mockData";
import { INITIAL_COMPANIES } from "../utils/companiesMockData";

// Configured Axios instance placeholder for easy backend integration
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  headers: {
    "Content-Type": "application/json"
  },
  timeout: 8000
});

// Helper for realistic simulated network delay
const delay = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch all available jobs with optional query filtering
 * Tries GET /jobs first, falls back gracefully to client data
 */
export async function getJobs(params = {}) {
  try {
    const response = await apiClient.get("/jobs", { params });
    if (response.data && Array.isArray(response.data.data || response.data)) {
      const liveJobs = response.data.data || response.data;
      return { data: liveJobs, total: response.data.total || liveJobs.length, isLive: true };
    }
  } catch (err) {
    // Graceful fallback to client catalog
  }

  await delay(200);
  let jobs = [...INITIAL_JOBS];

  if (params.search) {
    const q = params.search.toLowerCase().trim();
    jobs = jobs.filter(
      (job) =>
        job.title.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q) ||
        job.location.toLowerCase().includes(q) ||
        (job.skills && job.skills.some((skill) => skill.toLowerCase().includes(q)))
    );
  }

  if (params.companyType && params.companyType !== "All") {
    jobs = jobs.filter((job) => job.companyType === params.companyType);
  }

  if (params.jobType && params.jobType !== "All") {
    jobs = jobs.filter((job) => job.jobType === params.jobType);
  }

  if (params.isRemote) {
    jobs = jobs.filter((job) => job.isRemote);
  }

  if (params.isInternship) {
    jobs = jobs.filter((job) => job.isInternship);
  }

  if (params.isFresherFriendly) {
    jobs = jobs.filter((job) => job.isFresherFriendly);
  }

  if (params.isNewlyFounded) {
    jobs = jobs.filter((job) => job.isNewlyFounded);
  }

  if (params.competition && params.competition !== "All") {
    jobs = jobs.filter((job) => job.competition && job.competition.toLowerCase() === params.competition.toLowerCase());
  }

  if (params.location && params.location !== "All") {
    jobs = jobs.filter((job) => job.location.toLowerCase().includes(params.location.toLowerCase()));
  }

  if (params.selectedSkill && params.selectedSkill !== "All") {
    jobs = jobs.filter((job) => job.skills && job.skills.some((s) => s.toLowerCase() === params.selectedSkill.toLowerCase()));
  }

  if (params.recentlyPosted) {
    jobs = jobs.filter((job) => (job.postedTime && (job.postedTime.includes("hour") || job.postedTime.includes("today"))) || (job.postedAgo && job.postedAgo.includes("hour")));
  }

  return { data: jobs, total: jobs.length, isLive: false };
}

/**
 * Dedicated Search endpoint consumer (GET /jobs/search)
 */
export async function searchJobs(query = "", filters = {}) {
  try {
    const response = await apiClient.get("/jobs/search", {
      params: { q: query, ...filters }
    });
    if (response.data && Array.isArray(response.data.data || response.data)) {
      return { data: response.data.data || response.data, isLive: true };
    }
  } catch (err) {
    // Fallback
  }

  return getJobs({ search: query, ...filters });
}

/**
 * Fetch single job by ID
 */
export async function getJobById(id) {
  try {
    const response = await apiClient.get(`/jobs/${id}`);
    if (response.data) {
      return { data: response.data.data || response.data, isLive: true };
    }
  } catch (err) {
    // Fallback
  }

  await delay(150);
  const job = INITIAL_JOBS.find((j) => j.id === id);
  if (!job) {
    throw new Error("Job not found");
  }
  return { data: job, isLive: false };
}

/**
 * Fetch companies list with filters (GET /companies)
 */
export async function getCompanies(params = {}) {
  try {
    const response = await apiClient.get("/companies", { params });
    if (response.data && Array.isArray(response.data.data || response.data)) {
      return { data: response.data.data || response.data, isLive: true };
    }
  } catch (err) {
    // Fallback to rich company catalog
  }

  await delay(200);
  let list = [...INITIAL_COMPANIES];

  if (params.search) {
    const q = params.search.toLowerCase().trim();
    list = list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q)
    );
  }

  if (params.category && params.category !== "All") {
    list = list.filter((c) => c.category === params.category);
  }

  return { data: list, total: list.length, isLive: false };
}

/**
 * Fetch company details by ID or slug (GET /companies/:id)
 */
export async function getCompanyById(idOrSlug) {
  try {
    const response = await apiClient.get(`/companies/${idOrSlug}`);
    if (response.data) {
      return { data: response.data.data || response.data, isLive: true };
    }
  } catch (err) {
    // Fallback
  }

  await delay(150);
  const company = INITIAL_COMPANIES.find(
    (c) => c.id === idOrSlug || c.slug === idOrSlug || c.name.toLowerCase() === idOrSlug.toLowerCase()
  );

  if (!company) {
    throw new Error("Company not found");
  }

  // Find all jobs associated with this company
  const companyJobs = INITIAL_JOBS.filter(
    (j) => j.company.toLowerCase() === company.name.toLowerCase()
  );

  return { data: { ...company, jobs: companyJobs }, isLive: false };
}

/**
 * Fetch personalized job recommendations (getPersonalizedJobs)
 */
export async function getPersonalizedJobs(params = {}) {
  try {
    const response = await apiClient.get("/recommendations", { params });
    if (response.data && Array.isArray(response.data.data || response.data)) {
      return { data: response.data.data || response.data, isLive: true };
    }
  } catch (err) {
    // Fallback to recommendation records
  }

  await delay(220);
  return { data: INITIAL_RECOMMENDATIONS, isLive: false };
}

// Alias for backwards compatibility
export const getRecommendations = getPersonalizedJobs;

/**
 * Upload and parse resume file
 */
export async function uploadResume(file) {
  await delay(600);
  return {
    success: true,
    message: "Resume uploaded and analyzed successfully",
    fileName: file ? file.name : "Resume.pdf",
    fileSize: file ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : "1.2 MB",
    analysis: MOCK_RESUME_ANALYSIS
  };
}

/**
 * Get current resume ATS analysis
 */
export async function getResumeAnalysis() {
  await delay(200);
  return { data: MOCK_RESUME_ANALYSIS };
}

/**
 * Get dashboard analytics & charts data
 */
export async function getDashboardAnalytics() {
  await delay(200);
  return { data: MOCK_DASHBOARD_STATS };
}

/**
 * Get user notifications
 */
export async function getNotifications() {
  await delay(150);
  return { data: INITIAL_NOTIFICATIONS };
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(id) {
  await delay(80);
  return { success: true, id };
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead() {
  await delay(100);
  return { success: true };
}

/**
 * Clear notification
 */
export async function clearNotification(id) {
  await delay(80);
  return { success: true, id };
}

/**
 * Get user profile
 */
export async function getUserProfile() {
  await delay(150);
  return { data: INITIAL_USER };
}

/**
 * Update user profile
 */
export async function updateUserProfile(profileData) {
  await delay(250);
  return { success: true, message: "Profile updated successfully", data: profileData };
}

export default apiClient;
