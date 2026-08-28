import type { ProfileId } from "./types";
import { loadProfile } from "./store";
import { loadUsage } from "./usage";

/**
 * One-way mirror of progress + usage to the family sync endpoint, so
 * progress is backed up off-device and visible on the home dashboard.
 * Fire-and-forget: the app never depends on the server being reachable
 * (it lives on a home machine that may be asleep); every later sync sends
 * the full current state, so missed attempts cost nothing.
 */
const ENDPOINT = "https://alims-macbook-pro.taila78428.ts.net/efp-sync/ingest";
const INTERVAL_MS = 3 * 60_000;
const LAST_OK = (p: ProfileId) => `efp2.lastSync.${p}`;

let inFlight = false;

export async function syncNow(p: ProfileId): Promise<void> {
  if (inFlight || navigator.onLine === false) return;
  inFlight = true;
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 12_000);
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      signal: ctl.signal,
      body: JSON.stringify({
        v: 1,
        app: "efp2",
        profile: p,
        sentAt: new Date().toISOString(),
        progress: loadProfile(p),
        usage: loadUsage(p),
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
        ua: navigator.userAgent,
      }),
    });
    clearTimeout(timer);
    if (res.ok) localStorage.setItem(LAST_OK(p), new Date().toISOString());
  } catch {
    /* offline or server asleep — next interval retries */
  } finally {
    inFlight = false;
  }
}

export function startSync(getProfile: () => ProfileId | null): void {
  const kick = () => {
    const p = getProfile();
    if (p) void syncNow(p);
  };
  setTimeout(kick, 8_000);
  setInterval(kick, INTERVAL_MS);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") kick();
  });
}
