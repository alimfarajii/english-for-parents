export interface Card {
  id: string;
  en: string;
  fa: string;
  example_en: string;
  example_fa: string;
  unit: string;
}

export interface GrammarExample {
  id: string;
  en: string;
  fa: string;
}

export interface Grammar {
  title_fa: string;
  body_fa: string;
  examples: GrammarExample[];
}

export interface Lesson {
  id: string;
  cards: string[];
}

export interface Unit {
  id: string;
  icon: string;
  title_fa: string;
  title_en: string;
  grammar: Grammar;
  lessons: Lesson[];
}

export interface Course {
  version: number;
  units: Unit[];
  cards: Card[];
}

export interface CardProgress {
  box: number;   // Leitner box 1..5
  due: number;   // day index when next due
  seen: number;  // times reviewed
}

export interface Profile {
  cards: Record<string, CardProgress>;
  lessons: Record<string, number>;   // lesson id -> times completed
  streak: number;
  lastDay: number;    // last day index with activity
  xpToday: number;    // xp earned on lastDay
  totalXp: number;
  dailyGoal: number;  // xp target per day
}

export type ProfileId = "mom" | "dad";

// ------------------------------------------------------------- exercises
export type Exercise =
  | { kind: "teach"; card: Card }
  | { kind: "grammar"; unit: Unit }
  | { kind: "choice_fa"; card: Card; options: Card[] }   // EN shown, pick FA
  | { kind: "choice_en"; card: Card; options: Card[] }   // FA shown, pick EN
  | { kind: "listen"; card: Card; options: Card[] }      // audio only, pick EN
  | { kind: "build"; card: Card; tiles: string[] }       // arrange EN sentence
  | { kind: "match"; cards: Card[] };                    // pair EN <-> FA

export interface SessionResult {
  correctFirstTry: number;
  total: number;      // scored exercises (teach/grammar excluded)
  xp: number;
}
