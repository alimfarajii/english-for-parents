import type { Profile, ProfileId } from "./types";

const KEY = (p: ProfileId) => `efp2.progress.${p}`;
const CUR = "efp2.current";
const V1_KEY = (p: ProfileId) => `efp.progress.${p}`;

export const PROFILES: { id: ProfileId; en: string; fa: string; emoji: string }[] = [
  { id: "mom", en: "Mom", fa: "مامان", emoji: "👩🏻" },
  { id: "dad", en: "Dad", fa: "بابا", emoji: "👨🏻" },
];

export const DEFAULT_GOAL = 20;

export function dayIndex(d = new Date()): number {
  // Local-midnight day number. Avoids UTC drift so "today" matches the user.
  const local = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.floor(local.getTime() / 86_400_000);
}

function emptyProfile(): Profile {
  return {
    cards: {},
    lessons: {},
    streak: 0,
    lastDay: 0,
    xpToday: 0,
    totalXp: 0,
    dailyGoal: DEFAULT_GOAL,
  };
}

/** One-time import of v1 flashcard progress (same-origin deploys). */
function migrateFromV1(p: ProfileId): Profile | null {
  try {
    const raw = localStorage.getItem(V1_KEY(p));
    if (!raw) return null;
    const v1 = JSON.parse(raw);
    const prof = emptyProfile();
    if (v1 && typeof v1 === "object" && v1.cards) {
      prof.cards = v1.cards;
      prof.streak = v1.streak ?? 0;
      prof.lastDay = v1.lastDay ?? 0;
    }
    return prof;
  } catch {
    return null;
  }
}

export function loadProfile(p: ProfileId): Profile {
  try {
    const raw = localStorage.getItem(KEY(p));
    if (!raw) {
      const migrated = migrateFromV1(p);
      if (migrated) {
        saveProfile(p, migrated);
        return migrated;
      }
      return emptyProfile();
    }
    return { ...emptyProfile(), ...JSON.parse(raw) };
  } catch {
    return emptyProfile();
  }
}

export function saveProfile(p: ProfileId, prof: Profile): void {
  localStorage.setItem(KEY(p), JSON.stringify(prof));
}

export function getCurrent(): ProfileId | null {
  const v = localStorage.getItem(CUR);
  return v === "mom" || v === "dad" ? v : null;
}

export function setCurrent(p: ProfileId | null): void {
  if (p) localStorage.setItem(CUR, p);
  else localStorage.removeItem(CUR);
}

/** Roll day bookkeeping forward; call before recording any activity. */
export function touchDay(prof: Profile): Profile {
  const today = dayIndex();
  if (prof.lastDay === today) return prof;
  const streak = prof.lastDay === today - 1 ? prof.streak : 0;
  return { ...prof, streak, lastDay: today, xpToday: 0 };
}

/** Add XP; bumps the streak the moment today's goal is reached. */
export function addXp(prof: Profile, amount: number): Profile {
  let p = touchDay(prof);
  const before = p.xpToday;
  p = { ...p, xpToday: p.xpToday + amount, totalXp: p.totalXp + amount };
  if (before < p.dailyGoal && p.xpToday >= p.dailyGoal) {
    p = { ...p, streak: p.streak + 1 };
  }
  return p;
}
