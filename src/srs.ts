import type { Card, Profile } from "./types";
import { dayIndex } from "./store";

// Leitner intervals (days) indexed by box 1..5.
const INTERVALS = [0, 1, 2, 4, 7, 15];
export const MAX_REVIEW_SESSION = 12;

/** Record an SRS answer for a card. `knew` => promote, else back to box 1. */
export function srsAnswer(prof: Profile, card: Card, knew: boolean): Profile {
  const today = dayIndex();
  const existing = prof.cards[card.id];
  const box = knew ? Math.min((existing?.box ?? 0) + 1, 5) : 1;
  return {
    ...prof,
    cards: {
      ...prof.cards,
      [card.id]: {
        box,
        due: today + INTERVALS[box],
        seen: (existing?.seen ?? 0) + 1,
      },
    },
  };
}

/** Cards learned in lessons that are due for review today (oldest boxes first). */
export function dueCards(deck: Card[], prof: Profile): Card[] {
  const today = dayIndex();
  return deck
    .filter((c) => {
      const p = prof.cards[c.id];
      return p && p.due <= today;
    })
    .sort((a, b) => (prof.cards[a.id].box - prof.cards[b.id].box));
}

export interface Stats {
  learned: number;   // box >= 2
  mastered: number;  // box 5
  started: number;
  total: number;
  due: number;
}

export function srsStats(deck: Card[], prof: Profile): Stats {
  const today = dayIndex();
  let learned = 0, mastered = 0, started = 0, due = 0;
  for (const card of deck) {
    const p = prof.cards[card.id];
    if (!p) continue;
    started++;
    if (p.box >= 2) learned++;
    if (p.box >= 5) mastered++;
    if (p.due <= today) due++;
  }
  return { learned, mastered, started, total: deck.length, due };
}
