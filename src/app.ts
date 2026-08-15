import type { Card, Course, Profile, ProfileId, Unit } from "./types";
import { loadProfile, saveProfile } from "./store";

export type Screen =
  | { name: "profiles" }
  | { name: "home" }
  | { name: "unit"; unit: Unit }
  | { name: "lesson"; unit: Unit; lessonId: string }
  | { name: "review" }
  | { name: "progress" };

/** Shared app context passed to every screen. */
export class App {
  course: Course;
  cardById: Map<string, Card>;
  profileId: ProfileId;
  profile: Profile;
  root: HTMLElement;
  render: (s: Screen) => void = () => {};

  constructor(course: Course, profileId: ProfileId, root: HTMLElement) {
    this.course = course;
    this.cardById = new Map(course.cards.map((c) => [c.id, c]));
    this.profileId = profileId;
    this.profile = loadProfile(profileId);
    this.root = root;
  }

  save(): void {
    saveProfile(this.profileId, this.profile);
  }

  switchProfile(p: ProfileId): void {
    this.profileId = p;
    this.profile = loadProfile(p);
    this.go({ name: "home" });
  }

  go(s: Screen): void {
    this.render(s);
  }

  /** Units unlock in order: a unit is open once the previous one is done. */
  unitUnlocked(unit: Unit): boolean {
    const idx = this.course.units.findIndex((u) => u.id === unit.id);
    if (idx <= 0) return true;
    return this.unitDone(this.course.units[idx - 1]);
  }

  unitDone(unit: Unit): boolean {
    return unit.lessons.every((l) => (this.profile.lessons[l.id] ?? 0) > 0);
  }

  lessonsDone(unit: Unit): number {
    return unit.lessons.filter((l) => (this.profile.lessons[l.id] ?? 0) > 0)
      .length;
  }

  /** First not-yet-completed lesson in course order, if any. */
  nextLesson(): { unit: Unit; lessonId: string } | null {
    for (const u of this.course.units) {
      for (const l of u.lessons) {
        if (!(this.profile.lessons[l.id] ?? 0)) {
          if (this.unitUnlocked(u)) return { unit: u, lessonId: l.id };
          return null;
        }
      }
    }
    return null;
  }
}
