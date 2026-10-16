import { http } from "./http";

/** Admin console API (ADMIN role only; everything goes through the gateway). */
export const adminService = {
  users: async (params = {}) => (await http.get("/admin/users", { params })).data.users || [],
  updateUser: async (id, body) => (await http.patch(`/admin/users/${id}`, body)).data,
  deleteUser: async (id) => (await http.delete(`/admin/users/${id}`)).data,

  recruiters: async (params = {}) => (await http.get("/admin/recruiters", { params })).data.recruiters || [],
  updateRecruiter: async (id, status) => (await http.patch(`/admin/recruiters/${id}`, { status })).data,

  jobs: async (params = {}) => (await http.get("/admin/jobs", { params })).data.jobs || [],
  updateJob: async (id, status) => (await http.patch(`/admin/jobs/${id}`, { status })).data,
  deleteJob: async (id) => (await http.delete(`/admin/jobs/${id}`)).data,

  applications: async (params = {}) => (await http.get("/admin/applications", { params })).data.applications || [],
  overview: async () => (await http.get("/admin/overview")).data,
  settings: async () => (await http.get("/admin/settings")).data.settings || {},
  saveSettings: async (body) => (await http.put("/admin/settings", body)).data.settings || {},
};
