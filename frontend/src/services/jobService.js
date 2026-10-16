import axios from "axios";

import { API_BASE_URL as JOB_API_URL } from "./http";


// ============================================================
// AXIOS INSTANCE
// ============================================================

const jobApi = axios.create({
  baseURL: JOB_API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});


// ============================================================
// JWT INTERCEPTOR
// ============================================================

jobApi.interceptors.request.use(
  (config) => {

    const token =
      localStorage.getItem(
        "swipex_access_token"
      );

    if (token) {

      config.headers =
        config.headers || {};

      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },

  (error) =>
    Promise.reject(error)
);


export const normalizeJob = (job) => {
  if (!job) return job;
  const companyName =
    typeof job.company === "object" && job.company !== null
      ? job.company.name || job.company.title || "Company"
      : String(job.company || job.companyName || "Company");

  const companyLogo =
    job.logo ||
    job.logo_url ||
    (typeof job.company === "object" ? job.company.logo_url : null);

  const companyType =
    job.companyType ||
    (typeof job.company === "object" ? job.company.company_type : null);

  let salaryFormatted = job.salary;
  if (!salaryFormatted && (job.salary_min || job.salary_max)) {
    const minLakhs = job.salary_min ? (job.salary_min / 100000).toFixed(1).replace(".0", "") : null;
    const maxLakhs = job.salary_max ? (job.salary_max / 100000).toFixed(1).replace(".0", "") : null;
    if (minLakhs && maxLakhs) {
      salaryFormatted = `₹${minLakhs} - ${maxLakhs} LPA`;
    } else if (maxLakhs) {
      salaryFormatted = `Up to ₹${maxLakhs} LPA`;
    } else {
      salaryFormatted = `From ₹${minLakhs} LPA`;
    }
  }

  const experience =
    job.experience ||
    (job.min_experience_years !== undefined && job.min_experience_years !== null
      ? (job.min_experience_years === 0 ? "Fresher (0 yrs)" : `${job.min_experience_years}+ yrs`)
      : (job.experience_level || "Not specified"));

  const workMode = job.work_mode || (job.is_remote ? "Remote" : "Onsite");
  const employmentType = job.job_type || job.employment_type || "Full Time";

  return {
    ...job,
    company: companyName,
    companyName,
    logo: companyLogo,
    companyType,
    salary: salaryFormatted || "Competitive",
    experience,
    experience_level: experience,
    work_mode: workMode,
    employment_type: employmentType,
    job_type: employmentType,
    rawCompany: job.company,
  };
};

export const jobService = {


  // ==========================================================
  // DISCOVERY
  // ==========================================================

  getJobs: async (params = {}) => {
    const queryParams = { page_size: 50, ...params };
    const response = await jobApi.get("/jobs/", {
      params: queryParams,
    });
    const rawList =
      response.data?.jobs ||
      response.data?.items ||
      (Array.isArray(response.data) ? response.data : []);
    const list = rawList.map(normalizeJob);
    return { ...response.data, jobs: list, items: list };
  },


  // ==========================================================
  // SINGLE JOB
  // ==========================================================

  getJob: async (jobId) => {
    const response = await jobApi.get(`/jobs/${jobId}`);
    return normalizeJob(response.data);
  },


  // ==========================================================
  // RECRUITER JOBS
  // ==========================================================

  getRecruiterJobs: async () => {
    try {
      const response = await jobApi.get("/jobs/my-jobs");
      const list = response.data?.items || response.data?.jobs || (Array.isArray(response.data) ? response.data : []);
      return { ...response.data, items: list, jobs: list };
    } catch {
      const response = await jobApi.get("/jobs/mine");
      const list = response.data?.items || response.data?.jobs || (Array.isArray(response.data) ? response.data : []);
      return { ...response.data, items: list, jobs: list };
    }
  },


  createJob: async (jobData) => {

    const response =
      await jobApi.post(
        "/jobs/",
        jobData
      );

    return response.data;
  },


  updateJob: async (jobId, fields) => {

    const response =
      await jobApi.patch(
        `/jobs/${jobId}`,
        fields
      );

    return response.data;
  },


  deleteJob: async (jobId) => {

    const response =
      await jobApi.delete(
        `/jobs/${jobId}`
      );

    return response.data;
  },


  // ==========================================================
  // SWIPES
  // ==========================================================

  /*
    LEFT  = SKIP
    RIGHT = APPLY

    RIGHT creates:

      swipes
          RIGHT

      applications
          Applied
  */

  swipeJob: async (
    jobId,
    action
  ) => {

    if (
      !["LEFT", "RIGHT"].includes(
        action
      )
    ) {

      throw new Error(
        "Action must be RIGHT or LEFT"
      );
    }

    try {
      const response = await jobApi.post(`/jobs/${jobId}/swipe`, { action });
      return response.data;
    } catch {
      const direction = String(action).toLowerCase() === "right" ? "right" : "left";
      const response = await jobApi.post("/swipes", { job_id: String(jobId), direction });
      return response.data;
    }
  },


  getSwipeHistory: async () => {
    try {
      const response = await jobApi.get("/jobs/swipes");
      const list = response.data?.swipes || response.data?.items || (Array.isArray(response.data) ? response.data : []);
      return { ...response.data, swipes: list, items: list };
    } catch {
      try {
        const response = await jobApi.get("/swipes/history");
        const list = response.data?.swipes || response.data?.items || (Array.isArray(response.data) ? response.data : []);
        return { ...response.data, swipes: list, items: list };
      } catch {
        return { swipes: [], items: [] };
      }
    }
  },


  // ==========================================================
  // SAVED JOBS
  // ==========================================================

  /*
    SAVE is completely separate.

    SAVE:
      saved_jobs

    Does NOT create:
      swipe
      application
  */

  saveJob: async (jobId) => {

    const response =
      await jobApi.post(
        `/jobs/${jobId}/save`
      );

    return response.data;
  },


  unsaveJob: async (jobId) => {

    const response =
      await jobApi.delete(
        `/jobs/${jobId}/save`
      );

    return response.data;
  },


  getSavedJobs: async () => {
    try {
      const response = await jobApi.get("/jobs/saved");
      const rawList = response.data?.saved_jobs || response.data?.jobs || response.data?.items || (Array.isArray(response.data) ? response.data : []);
      const list = rawList.map(normalizeJob);
      return { ...response.data, saved_jobs: list, jobs: list, items: list };
    } catch {
      const response = await jobApi.get("/saved-jobs");
      const rawList = response.data?.saved_jobs || response.data?.jobs || response.data?.items || (Array.isArray(response.data) ? response.data : []);
      const list = rawList.map(normalizeJob);
      return { ...response.data, saved_jobs: list, jobs: list, items: list };
    }
  },


  // ==========================================================
  // APPLICATIONS
  // ==========================================================

  applyJob: async (
    jobId,
    data = {}
  ) => {

    const response =
      await jobApi.post(
        `/jobs/${jobId}/apply`,
        data
      );

    return response.data;
  },


  getApplications: async () => {
    try {
      const response = await jobApi.get("/jobs/applications");
      const rawList = response.data?.applications || response.data?.items || (Array.isArray(response.data) ? response.data : []);
      const list = rawList.map(normalizeJob);
      return { ...response.data, applications: list, items: list };
    } catch {
      const response = await jobApi.get("/applications");
      const rawList = response.data?.applications || response.data?.items || (Array.isArray(response.data) ? response.data : []);
      const list = rawList.map(normalizeJob);
      return { ...response.data, applications: list, items: list };
    }
  },


  // ==========================================================
  // RECRUITER APPLICANTS
  // ==========================================================

  getApplicants: async () => {

    const response =
      await jobApi.get(
        "/jobs/applicants"
      );

    return response.data;
  },


  getJobApplicants: async (
    jobId
  ) => {

    const response =
      await jobApi.get(
        `/jobs/${jobId}/applicants`
      );

    return response.data;
  },


  // Moving an application to a new stage notifies the candidate.
  // extra: { notes?: string, message?: string }
  updateApplicationStatus: async (
    applicationId,
    status,
    extra = {}
  ) => {

    const response =
      await jobApi.patch(
        `/jobs/applications/${applicationId}`,
        {
          ...(status ? { status } : {}),
          ...extra,
        }
      );

    return response.data;
  },

  getApplication: async (applicationId) => {

    const response =
      await jobApi.get(
        `/jobs/applications/${applicationId}`
      );

    return response.data;
  },
  // ==========================================================
// COMPANIES
// ==========================================================

getCompanies: async (params = {}) => {
  const response = await jobApi.get(
    "/companies/",
    {
      params,
    }
  );

  return response.data;
},

getCompany: async (companyId) => {
  const response = await jobApi.get(
    `/companies/${companyId}`
  );

  return response.data;
},

};


export default jobService;