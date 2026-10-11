const KEY = "yakton-daily-progress-v1";
export function blankProgress() {
  return { currentStreak: 0, bestStreak: 0, completedDates: [], history: {}, records: {}, achievements: [] };
}
export function loadProgress(storage = globalThis.localStorage) {
  try {
    const parsed = JSON.parse(storage.getItem(KEY) || "null");
    return parsed && Array.isArray(parsed.completedDates) ? { ...blankProgress(), ...parsed } : blankProgress();
  } catch { return blankProgress(); }
}
export function saveProgress(progress, storage = globalThis.localStorage) {
  try { storage.setItem(KEY, JSON.stringify(progress)); return true; } catch { return false; }
}
function shiftDate(date, days) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function completeDaily(progress, date, result = {}) {
  if (progress.completedDates.includes(date)) return progress;
  const yesterday = shiftDate(date, -1);
  progress.currentStreak = progress.completedDates.includes(yesterday) ? progress.currentStreak + 1 : 1;
  progress.bestStreak = Math.max(progress.bestStreak, progress.currentStreak);
  progress.completedDates.push(date);
  progress.completedDates.sort();
  progress.history[date] = result;
  const add = (name) => { if (!progress.achievements.includes(name)) progress.achievements.push(name); };
  add("First daily completed");
  if (progress.currentStreak >= 3) add("Three-day streak");
  if (progress.currentStreak >= 7) add("Seven-day streak");
  if (result.perfect) add("Perfect daily");
  return progress;
}
export { KEY as PROGRESS_STORAGE_KEY };
