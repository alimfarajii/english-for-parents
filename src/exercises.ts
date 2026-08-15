import type { Card, Course, Exercise, Lesson, Unit } from "./types";

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function byId(course: Course): Map<string, Card> {
  return new Map(course.cards.map((c) => [c.id, c]));
}

/** 3 distractors: prefer same unit, fill from the whole course. Skips cards
 *  whose EN or FA label duplicates one already shown (e.g. sorry/excuse-me
 *  share a Farsi translation), so options are never ambiguous. */
function distractors(course: Course, card: Card, n = 3): Card[] {
  const sameUnit = course.cards.filter(
    (c) => c.unit === card.unit && c.id !== card.id,
  );
  const rest = course.cards.filter(
    (c) => c.unit !== card.unit && c.id !== card.id,
  );
  const pool = [...shuffle(sameUnit), ...shuffle(rest)];
  const seenEn = new Set([card.en.toLowerCase()]);
  const seenFa = new Set([card.fa]);
  const out: Card[] = [];
  for (const c of pool) {
    if (out.length === n) break;
    if (seenEn.has(c.en.toLowerCase()) || seenFa.has(c.fa)) continue;
    seenEn.add(c.en.toLowerCase());
    seenFa.add(c.fa);
    out.push(c);
  }
  return out;
}

function mc(
  course: Course,
  card: Card,
  kind: "choice_fa" | "choice_en" | "listen",
): Exercise {
  return { kind, card, options: shuffle([card, ...distractors(course, card)]) };
}

/** Sentence-builder from the card's example, only when it's tile-friendly. */
function builder(card: Card): Exercise | null {
  const words = card.example_en
    .replace(/[«»]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length < 3 || words.length > 8) return null;
  // Skip mixed-language examples (e.g. How do you say «آب» in English?) —
  // a Farsi tile inside an English building exercise is just confusing.
  if (words.some((w) => /[^\x20-\x7E’‘“”…]/.test(w))) return null;
  return { kind: "build", card, tiles: words };
}

/**
 * A lesson session: teach words in pairs, practice each word 2-3 ways with
 * increasing difficulty, close with a matching round and a sentence build.
 */
export function buildLessonSession(
  course: Course,
  unit: Unit,
  lesson: Lesson,
  opts: { withGrammar: boolean },
): Exercise[] {
  const map = byId(course);
  const words = lesson.cards.map((id) => map.get(id)!).filter(Boolean);
  const out: Exercise[] = [];
  if (opts.withGrammar) out.push({ kind: "grammar", unit });

  // Teach + first easy practice, interleaved two words at a time.
  for (let i = 0; i < words.length; i += 2) {
    const pair = words.slice(i, i + 2);
    for (const w of pair) out.push({ kind: "teach", card: w });
    for (const w of pair) out.push(mc(course, w, "choice_fa"));
  }

  // Second pass, harder: recall EN from FA, or by ear.
  const second = shuffle(words).map((w, i) =>
    mc(course, w, i % 2 === 0 ? "choice_en" : "listen"),
  );
  out.push(...second);

  // Closing round.
  if (words.length >= 4) {
    out.push({ kind: "match", cards: shuffle(words).slice(0, 4) });
  }
  const buildable = shuffle(words)
    .map(builder)
    .filter((e): e is Exercise => e !== null);
  out.push(...buildable.slice(0, 1));
  return out;
}

/** A review session over due SRS cards: mixed recall, hardest forms first. */
export function buildReviewSession(course: Course, due: Card[]): Exercise[] {
  const kinds: ("choice_fa" | "choice_en" | "listen")[] = [
    "choice_en",
    "listen",
    "choice_fa",
  ];
  return due.map((card, i) => mc(course, card, kinds[i % kinds.length]));
}
