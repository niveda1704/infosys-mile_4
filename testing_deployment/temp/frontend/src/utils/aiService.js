import axios from "axios";

const GATEWAY_API_URL =
  import.meta.env.VITE_GATEWAY_API_BASE_URL ||
  "http://127.0.0.1:5000/api/v1";

const gatewayApi = axios.create({
  baseURL: GATEWAY_API_URL,
  timeout: 120000,
});

const attachAccessToken = (config) => {
  const token = localStorage.getItem(
    "swipex_access_token"
  );

  if (token) {
    config.headers = config.headers || {};

    config.headers.Authorization =
      `Bearer ${token}`;
  }

  return config;
};

gatewayApi.interceptors.request.use(
  attachAccessToken,
  (error) => Promise.reject(error)
);

export const aiService = {

  // ============================================================
  // RESUME UPLOAD
  // ============================================================
  //
  // IMPORTANT:
  // Resume upload belongs to Resume Service,
  // therefore it goes through Gateway:
  //
  // React -> Gateway :5000 -> Resume :5003
  //
  // ============================================================

  uploadResume: async (file) => {

    if (!file) {
      throw new Error(
        "Resume file is required."
      );
    }

    const formData = new FormData();

    formData.append(
      "file",
      file
    );

    const response =
      await gatewayApi.post(
        "/resumes/upload",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },

          timeout: 120000,
        }
      );

    return response.data;
  },


  // ============================================================
  // GET SAVED RESUMES
  // ============================================================

  getResume: async () => {

    const response =
      await gatewayApi.get(
        "/resumes/"
      );

    return response.data;
  },


  // ============================================================
  // GET RESUME ANALYSIS
  // ============================================================

  getResumeAnalysis: async (
    resumeId
  ) => {

    if (!resumeId) {
      throw new Error(
        "resumeId is required."
      );
    }

    /*
     * This endpoint is served by Resume Service.
     *
     * React
     *   ↓
     * Gateway :5000
     *   ↓
     * Resume :5003
     */

    const response =
      await gatewayApi.get(
        `/resumes/${resumeId}/analysis`
      );

    return response.data;
  },


  // ============================================================
  // AI RECOMMENDATIONS
  // ============================================================
  //
  // React
  //   ↓
  // Gateway :5000
  //   ↓
  // AI :8000
  //
  // Gateway already provides:
  //
  // GET /api/v1/recommendations
  //
  // ============================================================

  getRecommendations: async (
    userId,
    resumeId
  ) => {

    if (!userId) {
      throw new Error(
        "userId is required."
      );
    }

    const response =
      await gatewayApi.get(
        "/recommendations",
        {
          params: {
            user_id: userId,

            ...(resumeId
              ? {
                  resume_id:
                    resumeId,
                }
              : {}),
          },

          timeout: 120000,
        }
      );

    return response.data;
  },


  // ============================================================
  // ATS SCORE
  // ============================================================
  //
  // React
  //   ↓
  // Gateway :5000
  //   ↓
  // Resume Service :5003
  //   ↓
  // AI Service :8000
  //
  // ============================================================

  getJobAtsScore: async (
    resumeId,
    jobId
  ) => {

    if (!resumeId) {
      throw new Error(
        "resumeId is required."
      );
    }

    if (!jobId) {
      throw new Error(
        "jobId is required."
      );
    }

    const response =
      await gatewayApi.post(
        "/resumes/ats/score",
        {
          resume_id: resumeId,
          job_id: jobId,
        },
        {
          timeout: 120000,
        }
      );

    return response.data;
  },


  // ============================================================
  // AI RESUME SUGGESTIONS
  // ============================================================

  getResumeSuggestions: async (
    resumeId,
    jobId
  ) => {

    const response =
      await gatewayApi.post(
        "/resumes/ai-suggestions",
        {
          resume_id: resumeId,
          job_id: jobId,
        },
        {
          timeout: 120000,
        }
      );

    return response.data;
  },
};

export default aiService;