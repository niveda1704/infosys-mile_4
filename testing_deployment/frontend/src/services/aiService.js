import { http } from "./http";

/**
 * AI features, all through the gateway:
 *   resumes  -> /resumes/*   (resume-service parses via the AI service and stores in Postgres)
 *   AI       -> /ai/*        (recommendations, swipe deck, ATS analysis; user comes from the JWT)
 *
 * mode: "heuristic" | "ml" | "hybrid"
 */
export const aiService = {
  // ---------------------------------------------------------------- resume
  uploadResume: async (file) => {
    if (!file) throw new Error("Resume file is required.");
    const form = new FormData();
    form.append("file", file);
    const { data } = await http.post("/resumes/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120000,
    });
    const resume = data.resume || {};
    return {
      ...data,
      resume,
      db_id: resume.id,
      resume_id: resume.external_resume_id || resume.id,
      parsed_skills: resume.skills || [],
    };
  },

  listResumes: async () => {
    const { data } = await http.get("/resumes/");
    return data.resumes || [];
  },

  // Job-agnostic ATS analysis of one resume (uuid or numeric id)
  getResumeAnalysis: async (resumeRef, mode = "hybrid") => {
    const { data } = await http.get(`/ai/resume/${resumeRef}/analysis`, { params: { mode } });
    return data;
  },

  // ATS score of a stored resume (numeric db id) against one job
  getJobAtsScore: async (resumeDbId, jobId, mode = "hybrid") => {
    const { data } = await http.post("/resumes/ats/score", {
      resume_id: Number(resumeDbId),
      job_id: Number(jobId),
      mode,
    });
    return data.ats;
  },

  // ---------------------------------------------------------------- recommendations
  getRecommendations: async ({ mode = "hybrid", limit = 50, excludeSeen = false } = {}) => {
    const { data } = await http.get("/ai/recommendations", {
      params: { mode, limit, exclude_seen: excludeSeen },
    });
    return data;
  },

  // Re-ranked swipe deck (unseen jobs, best first). Call again after every swipe.
  getDeck: async ({ mode = "hybrid", limit = 40, timeout = 6000 } = {}) => {
    const { data } = await http.get("/ai/deck", { params: { mode, limit }, timeout });
    return data;
  },

  getEngineInfo: async () => {
    const { data } = await http.get("/ai/engine");
    return data;
  },
};

export default aiService;
