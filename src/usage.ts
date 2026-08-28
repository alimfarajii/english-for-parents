import type { ProfileId } from "./types";

/** Per-profile usage log: active seconds per local day + notable events. */
export interface UsageEvent {
  t: string; // ISO timestamp
  type: "lesson" | "review" | "open";
  detail?: string;
}
export interface Usage {
  days: Record<string, number>; // "YYYY-MM-DD" -> active seconds
  events: UsageEvent[];
}

const KEY = (p: ProfileId) => `efp2.usage.${p}`;
const MAX_EVENTS = 300;
const TICK_MS = 15_000;

export function loadUsage(p: ProfileId): Usage {
  try {
    const raw = localStorage.getItem(KEY(p));
    if (raw) return { days: {}, events: [], ...JSON.parse(raw) };
  } catch {
    /* fall through */
  }
  return { days: {}, events: [] };
}

function saveUsage(p: ProfileId, u: Usage): void {
  localStorage.setItem(KEY(p), JSON.stringify(u));
}

function todayKey(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addSeconds(p: ProfileId, secs: number): void {
  if (secs <= 0) return;
  const u = loadUsage(p);
  const k = todayKey();
  u.days[k] = Math.round((u.days[k] ?? 0) + secs);
  saveUsage(p, u);
}

export function logEvent(p: ProfileId, type: UsageEvent["type"], detail?: string): void {
  const u = loadUsage(p);
  u.events.push({ t: new Date().toISOString(), type, detail });
  if (u.events.length > MAX_EVENTS) u.events.splice(0, u.events.length - MAX_EVENTS);
  saveUsage(p, u);
}

/**
 * Count wall-clock time while the app is visible toward the active profile.
 * Flushes every 15s (crash-safe) and on tab-hide.
 */
export function startUsageTracking(getProfile: () => ProfileId | null): void {
  let markedAt: number | null = document.visibilityState === "visible" ? Date.now() : null;

  const flush = () => {
    const p = getProfile();
    if (markedAt !== null && p) addSeconds(p, (Date.now() - markedAt) / 1000);
    markedAt = document.visibilityState === "visible" ? Date.now() : null;
  };

  document.addEventListener("visibilitychange", flush);
  window.addEventListener("pagehide", flush);
  setInterval(flush, TICK_MS);
}
