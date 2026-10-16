import { http } from "./http";

/** In-app notifications stored by the job service (application status changes, new applicants...). */
export const notificationService = {
  list: async ({ unread = false, limit = 50 } = {}) => {
    const { data } = await http.get("/notifications/", { params: { unread, limit }, timeout: 8000 });
    return { notifications: data.notifications || [], unreadCount: data.unread_count ?? 0 };
  },
  markRead: async (id) => (await http.post(`/notifications/${id}/read`)).data,
  markAllRead: async () => (await http.post("/notifications/read-all")).data,
  remove: async (id) => (await http.delete(`/notifications/${id}`)).data,
  clearAll: async () => (await http.delete("/notifications/")).data,
  getPreferences: async () => (await http.get("/notifications/preferences")).data,
  savePreferences: async (prefs) => (await http.put("/notifications/preferences", prefs)).data,
};

/** Application tracking (status history + board) and analytics. */
export const trackingService = {
  history: async (applicationId) => (await http.get(`/jobs/applications/${applicationId}/history`)).data,
  board: async () => (await http.get("/jobs/applications/board")).data,
};

export const analyticsService = {
  seeker: async (days = 30) => (await http.get("/analytics/seeker", { params: { days } })).data,
  recruiter: async (days = 30) => (await http.get("/analytics/recruiter", { params: { days } })).data,
  admin: async (days = 30) => (await http.get("/analytics/admin", { params: { days } })).data,
  trends: async (params = { days: 30 }) => (await http.get("/analytics/trends", { params })).data,
  skillGap: async () => (await http.get("/ai/insights/skill-gap")).data,
  recommendationInsights: async () => (await http.get("/ai/insights/recommendations")).data,
};

export function timeAgo(iso) {
  if (!iso) return "";
  const then = new Date(iso.endsWith("Z") || /[+-]\d\d:\d\d$/.test(iso) ? iso : iso + "Z").getTime();
  const s = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hr ago`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)} day${s >= 2 * 86400 ? "s" : ""} ago`;
  return new Date(then).toLocaleDateString();
}

/** Backend notification -> shape used by NotificationPanel / NotificationsPage. */
const ALERT_TYPE_MAP = { high_match: "match", startup: "opportunity", low_competition: "opportunity", instant_job: "opportunity" };

export function toUiNotification(n) {
  return {
    id: n.id,
    type: ALERT_TYPE_MAP[n.type] || n.type || "application",
    alertKind: n.type,
    title: n.title,
    message: n.message,
    time: timeAgo(n.createdAt),
    createdAt: n.createdAt,
    read: !!n.read,
    // status updates open the applications page, not the job card
    jobId: n.link ? null : n.jobId,
    link: n.link || null,
  };
}
