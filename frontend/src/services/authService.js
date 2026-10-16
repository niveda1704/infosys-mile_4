import axios from "axios";

import { API_BASE_URL as AUTH_API_URL } from "./http";

const authApi = axios.create({
  baseURL: AUTH_API_URL,
  timeout: 10000,
});

authApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(
      "swipex_access_token"
    );

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export const authService = {
  // =========================
  // REGISTER
  // =========================

  register: async (userData) => {
    const roleStr = String(userData.role || "job_seeker").toLowerCase();
    const normalizedRole = roleStr === "seeker" || roleStr === "job_seeker" ? "job_seeker" : roleStr;
    const payload = {
      ...userData,
      email: userData.email,
      password: userData.password,
      full_name: userData.full_name || userData.name,
      role: normalizedRole,
    };

    const response = await authApi.post(
      "/auth/register",
      payload
    );

    return response.data;
  },

  // =========================
  // LOGIN
  // =========================

  login: async (credentials) => {
    const response = await authApi.post(
      "/auth/login",
      credentials
    );

    const data = response.data;
    if (data && data.access_token) {
      let sub = null;
      try {
        const payload = JSON.parse(atob(data.access_token.split(".")[1]));
        sub = payload.sub;
      } catch {}

      if (!data.user) {
        try {
          const meRes = await authApi.get("/auth/me", {
            headers: { Authorization: `Bearer ${data.access_token}` },
          });
          data.user = {
            id: meRes.data.user_id || meRes.data.id || sub,
            user_id: meRes.data.user_id || meRes.data.id || sub,
            ...meRes.data,
            email: credentials.email,
            role: meRes.data.role || data.role || "job_seeker",
          };
        } catch {
          data.user = {
            id: sub,
            user_id: sub,
            email: credentials.email,
            role: data.role || "job_seeker",
            name: credentials.email.split("@")[0],
          };
        }
      } else {
        data.user.id = data.user.id || data.user.user_id || sub;
        data.user.user_id = data.user.id;
      }
    }

    return data;
  },

  // =========================
  // CURRENT USER
  // =========================

  getCurrentUser: async () => {
    const response = await authApi.get(
      "/auth/me"
    );

    return response.data;
  },

  // =========================
  // UPDATE PROFILE
  // =========================

  updateProfile: async (profileData) => {
    const response = await authApi.put(
      "/auth/me",
      profileData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  },

  // =========================
  // REFRESH TOKEN
  // =========================

  refresh: async () => {
    const refreshToken =
      localStorage.getItem(
        "swipex_refresh_token"
      );

    const response = await authApi.post(
      "/auth/refresh",
      {},
      {
        headers: {
          Authorization:
            `Bearer ${refreshToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  },

  // =========================
  // LOGOUT
  // =========================

  logout: async () => {
    const response = await authApi.post(
      "/auth/logout",
      {},
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  },

  // =========================
  // FORGOT PASSWORD
  // =========================

  forgotPassword: async (email) => {
    const response = await authApi.post(
      "/auth/forgot-password",
      { email },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  },

  // =========================
  // RESET PASSWORD
  // =========================

  resetPassword: async (
    token,
    newPassword
  ) => {
    const response = await authApi.post(
      "/auth/reset-password",
      {
        token,
        new_password: newPassword,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  },
};

export default authService;