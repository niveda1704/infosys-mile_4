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
    const response = await authApi.post(
      "/auth/register",
      userData
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

    return response.data;
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