
/**
 * Swipe Service
 * Handles recording and fetching swipe interactions (skipped / interested)
 * with timestamped event logging and backend API connectivity.
 */


const SWIPE_STORAGE_KEY = "swipex_swipe_history";

/**
 * Record a swipe action (skipped or interested)
 * Follows SRS 2 schema: POST /swipes { job_id: "JOB_ID", action: "interested" | "skipped" }
 * @param {string} jobId - The ID of the job being swiped
 * @param {"skipped" | "interested"} action - The swipe outcome
 * @returns {Promise<{ jobId: string, action: "skipped" | "interested", timestamp: string }>}
 */
export async function recordSwipe(jobId, action) {
  const swipeRecord = {
    jobId,
    action,
    timestamp: new Date().toISOString()
  };

  // Optimistic local persistence
  try {
    const raw = localStorage.getItem(SWIPE_STORAGE_KEY);
    const history = raw ? JSON.parse(raw) : [];
    const updatedHistory = [swipeRecord, ...history];
    localStorage.setItem(SWIPE_STORAGE_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.warn("Failed to persist swipe record to localStorage:", error);
  }

  // The authoritative swipe is stored by the job service through jobService.swipeJob();
  // this module only keeps a local history for the UI.
  return swipeRecord;
}

/**
 * Undo last swipe action
 * @param {string} jobId - ID of the job to restore
 */
export async function undoSwipe(jobId) {
  // Update local storage
  try {
    const raw = localStorage.getItem(SWIPE_STORAGE_KEY);
    if (raw) {
      const history = JSON.parse(raw);
      const filtered = history.filter((item) => item.jobId !== jobId);
      localStorage.setItem(SWIPE_STORAGE_KEY, JSON.stringify(filtered));
    }
  } catch (error) {
    console.warn("Failed to update localStorage on undo:", error);
  }

  return { success: true, jobId };
}

/**
 * Retrieve swipe history
 * @returns {Promise<Array<{ jobId: string, action: "skipped" | "interested", timestamp: string }>>}
 */
export async function getSwipeHistory() {
  try {
    const raw = localStorage.getItem(SWIPE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.warn("Failed to load swipe history:", error);
    return [];
  }
}

/**
 * Clear swipe history
 */
export async function clearSwipeHistory() {
  localStorage.removeItem(SWIPE_STORAGE_KEY);
  return { success: true };
}

export default {
  recordSwipe,
  undoSwipe,
  getSwipeHistory,
  clearSwipeHistory
};

