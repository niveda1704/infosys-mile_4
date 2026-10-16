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
    const resumeId = data.resume_id || data.id || data.resume?.id || data.resume?.external_resume_id;
    const skills = data.skills || data.parsed_skills || data.resume?.skills || [];
    const resume = data.resume || {
      id: resumeId,
      external_resume_id: resumeId,
      skills,
    };
    return {
      ...data,
      resume,
      db_id: resumeId,
      resume_id: resumeId,
      version_id: data.version_id,
      parsed_skills: skills,
    };
  },

  listResumes: async () => {
    const { data } = await http.get("/resumes/");
    return data.resumes || [];
  },

  // Job-agnostic ATS analysis of one resume (uuid or numeric id)
  getResumeAnalysis: async (resumeRef, mode = "hybrid") => {
    try {
      const { data } = await http.get(`/ai/resume/${resumeRef}/analysis`, { params: { mode } });
      return data;
    } catch {
      const { data } = await http.get(`/resumes/${resumeRef}/analysis`, { params: { mode } });
      return data;
    }
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
    try {
      const { data } = await http.get("/ai/recommendations", {
        params: { mode, limit, exclude_seen: excludeSeen },
      });
      return data;
    } catch {
      const { data } = await http.get("/recommendations", {
        params: { mode, limit, exclude_seen: excludeSeen },
      });
      return data;
    }
  },

  // Re-ranked swipe deck (unseen jobs, best first). Call again after every swipe.
  getDeck: async ({ mode = "hybrid", limit = 40, timeout = 6000 } = {}) => {
    const safeLimit = Math.min(Math.max(1, limit || 40), 100);
    try {
      const { data } = await http.get("/ai/deck", { params: { mode, limit: safeLimit }, timeout });
      if (Array.isArray(data)) {
        return {
          order: data.map((d) => String(d.job_id || d.id)),
          scores: Object.fromEntries(data.map((d) => [String(d.job_id || d.id), d.match_percentage || 0])),
          items: data,
        };
      }
      return {
        order: (data?.order || []).map(String),
        scores: data?.scores || {},
        items: data?.items || [],
      };
    } catch {
      try {
        const { data } = await http.get("/recommendations", { params: { limit: safeLimit }, timeout });
        const list = Array.isArray(data) ? data : (data?.items || []);
        return {
          order: list.map((d) => String(d.job_id || d.id)),
          scores: Object.fromEntries(list.map((d) => [String(d.job_id || d.id), d.match_percentage || 0])),
          items: list,
        };
      } catch {
        return { order: [], scores: {}, items: [] };
      }
    }
  },

  getEngineInfo: async () => {
    const { data } = await http.get("/ai/engine");
    return data;
  },
};

export default aiService;
