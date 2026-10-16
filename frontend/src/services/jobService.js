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


// ============================================================
// JOB SERVICE
// ============================================================

export const jobService = {


  // ==========================================================
  // DISCOVERY
  // ==========================================================

  getJobs: async (params = {}) => {

    const response =
      await jobApi.get(
        "/jobs/",
        {
          params,
        }
      );

    return response.data;
  },


  // ==========================================================
  // SINGLE JOB
  // ==========================================================

  getJob: async (jobId) => {

    const response =
      await jobApi.get(
        `/jobs/${jobId}`
      );

    return response.data;
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

    const response =
      await jobApi.post(
        `/jobs/${jobId}/swipe`,
        {
          action,
        }
      );

    return response.data;
  },


  getSwipeHistory: async () => {

    const response =
      await jobApi.get(
        "/jobs/swipes"
      );

    return response.data;
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
      const list = response.data?.saved_jobs || response.data?.jobs || response.data?.items || (Array.isArray(response.data) ? response.data : []);
      return { ...response.data, saved_jobs: list, jobs: list, items: list };
    } catch {
      const response = await jobApi.get("/saved-jobs");
      const list = response.data?.saved_jobs || response.data?.jobs || response.data?.items || (Array.isArray(response.data) ? response.data : []);
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
      const list = response.data?.applications || response.data?.items || (Array.isArray(response.data) ? response.data : []);
      return { ...response.data, applications: list, items: list };
    } catch {
      const response = await jobApi.get("/applications");
      const list = response.data?.applications || response.data?.items || (Array.isArray(response.data) ? response.data : []);
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