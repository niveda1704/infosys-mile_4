import axios from "axios";

/**
 * The ONE backend address the frontend talks to: the API gateway.
 * Auth, jobs, swipes, notifications, resumes and the AI engine are all reached through it.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000/api/v1";

export const getAccessToken = () => {
  try {
    return localStorage.getItem("swipex_access_token");
  } catch {
    return null;
  }
};

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

http.interceptors.request.use((config) => {
  const token = getAccessToken();
  config.headers = config.headers || {};
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default http;
