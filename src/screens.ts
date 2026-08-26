import type { Unit } from "./types";
import { App } from "./app";
import { el, clear, bidi, icon, brandMark, progressRing, speakerBtn } from "./ui";
import { play } from "./audio";
import { dueCards, srsStats } from "./srs";
import { PROFILES, setCurrent, touchDay } from "./store";
import { t, getLang, toggleLang, otherLangLabel, unitTitle, unitSubtitle } from "./i18n";

function profileName(id: string): string {
  const p = PROFILES.find((x) => x.id === id)!;
  return getLang() === "fa" ? p.fa : p.en;
}

/** Lettered avatar medallion (mom = turquoise, dad = lapis). */
function avatar(profileId: string, cls = ""): HTMLElement {
  return el("span", { class: `avatar avatar-${profileId} ${cls}` },
    profileName(profileId).slice(0, 1));
}

/** Quiet language switch: shows the other language's name. */
function langBtn(onSwitched: () => void): HTMLElement {
  const b = el("button", { class: "lang-btn", type: "button" },
    icon("globe"), otherLangLabel());
  b.addEventListener("click", () => {
    toggleLang();
    onSwitched();
  });
  return b;
}

// ------------------------------------------------------------------ shell
function tabbar(app: App, active: "home" | "review" | "progress"): HTMLElement {
  const mk = (id: typeof active, ic: Parameters<typeof icon>[0], label: string) => {
    const b = el("button", {
      class: `tab ${active === id ? "tab-active" : ""}`,
      type: "button",
    }, icon(ic), el("span", {}, label));
    b.addEventListener("click", () => app.go({ name: id }));
    return b;
  };
  return el("nav", { class: "tabbar" },
    mk("home", "book", t("lessons")),
    mk("review", "repeat", t("review")),
    mk("progress", "star", t("progress")),
  );
}

function page(app: App, active: "home" | "review" | "progress"): HTMLElement {
  clear(app.root);
  const body = el("main", { class: "page" });
  app.root.append(body, tabbar(app, active));
  return body;
}

// ------------------------------------------------------------- profiles
export function renderProfiles(app: App): void {
  clear(app.root);
  const wrap = el("div", { class: "profiles-screen" });
  wrap.append(
    brandMark(96),
    el("h1", { class: "brand-title" }, t("brandTitle")),
    el("p", { class: "brand-sub" }, t("whoAreYou")),
  );
  for (const p of PROFILES) {
    const b = el("button", { class: "profile-btn", type: "button" },
      avatar(p.id),
      el("span", { class: "profile-name" }, profileName(p.id)),
      icon("chevron"),
    );
    b.addEventListener("click", () => {
      setCurrent(p.id);
      app.switchProfile(p.id);
    });
    wrap.append(b);
  }
  wrap.append(langBtn(() => renderProfiles(app)));
  app.root.append(wrap);
}

// ------------------------------------------------------------------ home
export function renderHome(app: App): void {
  const body = page(app, "home");
  app.profile = touchDay(app.profile);
  app.save();
  const prof = app.profile;

  // Header: greeting + streak + daily goal ring.
  const goalPct = Math.min(100, Math.round((prof.xpToday / prof.dailyGoal) * 100));
  const ring = progressRing(goalPct, 64, goalPct >= 100 ? "✓" : `${prof.xpToday}`);
  const header = el("header", { class: "home-header" },
    el("div", {},
      el("div", { class: "hello" }, t("hello", profileName(app.profileId))),
      el("div", { class: "streak-line" },
        icon("flame"), t("streakDays", prof.streak)),
    ),
    el("div", { class: "goal-wrap" },
      ring,
      el("div", { class: "goal-label" }, t("dailyGoal", prof.dailyGoal))),
  );
  body.append(header);

  // Continue card.
  const nxt = app.nextLesson();
  const due = dueCards(app.course.cards, prof).length;
  if (nxt) {
    const idx = nxt.unit.lessons.findIndex((l) => l.id === nxt.lessonId);
    const sub = `${unitTitle(nxt.unit)} — ${t("lessonN", idx + 1)}`;
    const cont = el("button", { class: "continue-card", type: "button" },
      el("div", { class: "continue-icon" }, nxt.unit.icon),
      el("div", { class: "continue-text" },
        el("div", { class: "continue-title" }, t("continueLesson")),
        el("div", { class: "continue-sub" },
          getLang() === "fa" ? bidi(sub) : sub)),
      el("div", { class: "continue-go" }, icon("chevron")),
    );
    cont.addEventListener("click", () =>
      app.go({ name: "lesson", unit: nxt.unit, lessonId: nxt.lessonId }));
    body.append(cont);
  } else {
    body.append(el("div", { class: "continue-card done-all" },
      icon("cap"), " " + t("allDone")));
  }
  if (due > 0) {
    const rev = el("button", { class: "review-chip", type: "button" },
      icon("repeat"), t("reviewToday", due));
    rev.addEventListener("click", () => app.go({ name: "review" }));
    body.append(rev);
  }

  // Unit path.
  const list = el("div", { class: "unit-list" });
  for (const u of app.course.units) {
    const unlocked = app.unitUnlocked(u);
    const done = app.lessonsDone(u);
    const total = u.lessons.length;
    const card = el("button", {
      class: `unit-card ${unlocked ? "" : "unit-locked"} ${done === total ? "unit-done" : ""}`,
      type: "button",
    },
      el("div", { class: "unit-icon" }, unlocked ? u.icon : icon("lock")),
      el("div", { class: "unit-info" },
        el("div", { class: "unit-title" }, unitTitle(u)),
        el("div", { class: "unit-progress" },
          el("div", { class: "unit-progress-fill", style: `width:${(done / total) * 100}%` })),
        el("div", { class: "unit-sub" },
          ...(done === total
            ? [icon("check"), t("complete")]
            : [t("ofLessons", done, total)])),
      ),
    );
    card.addEventListener("click", () => {
      if (!unlocked) {
        toast(app, t("finishEarlier"));
        return;
      }
      app.go({ name: "unit", unit: u });
    });
    list.append(card);
  }
  body.append(el("h2", { class: "section-title" }, t("lessons")), list);
}

function toast(app: App, msg: string): void {
  const tst = el("div", { class: "toast" }, msg);
  app.root.append(tst);
  setTimeout(() => tst.classList.add("toast-show"), 10);
  setTimeout(() => {
    tst.classList.remove("toast-show");
    setTimeout(() => tst.remove(), 300);
  }, 2200);
}

// ------------------------------------------------------------------ unit
export function renderUnit(app: App, unit: Unit): void {
  const body = page(app, "home");
  const back = el("button", { class: "back-btn", type: "button" },
    el("span", {}, t("back")), icon("chevron"));
  back.addEventListener("click", () => app.go({ name: "home" }));
  body.append(back);

  body.append(el("div", { class: "unit-hero" },
    el("div", { class: "unit-icon" }, unit.icon),
    el("h1", { class: "unit-hero-title" }, unitTitle(unit)),
    el("div", {
      class: "unit-hero-en",
      dir: getLang() === "fa" ? "ltr" : "rtl",
    }, unitSubtitle(unit)),
  ));

  // Grammar note (content itself is part of the course — always Farsi).
  const g = unit.grammar;
  const gcard = el("section", { class: "grammar-card" },
    el("div", { class: "grammar-kicker" }, icon("book"), t("grammarNote")),
    el("h2", { class: "grammar-title" }, bidi(g.title_fa)),
    el("p", { class: "grammar-body" }, bidi(g.body_fa)),
  );
  for (const gx of g.examples) {
    const row = el("div", { class: "grammar-example" });
    row.append(
      speakerBtn(() => play(gx.id)),
      el("div", {},
        el("div", { class: "teach-ex-en", dir: "ltr" }, gx.en),
        el("div", { class: "teach-ex-fa", dir: "rtl" }, gx.fa)),
    );
    gcard.append(row);
  }
  body.append(gcard);

  // Lessons.
  const list = el("div", { class: "lesson-list" });
  unit.lessons.forEach((l, i) => {
    const doneCount = app.profile.lessons[l.id] ?? 0;
    const prevDone = i === 0 || (app.profile.lessons[unit.lessons[i - 1].id] ?? 0) > 0;
    const names = l.cards
      .map((id) => app.cardById.get(id)?.en ?? id)
      .join(" · ");
    const b = el("button", {
      class: `lesson-card ${doneCount ? "lesson-done" : ""} ${prevDone ? "" : "unit-locked"}`,
      type: "button",
    },
      el("div", { class: "lesson-num" }, doneCount ? icon("check") : `${i + 1}`),
      el("div", { class: "lesson-info" },
        el("div", { class: "lesson-title" }, t("lessonN", i + 1)),
        el("div", { class: "lesson-words", dir: "ltr" }, names)),
    );
    b.addEventListener("click", () => {
      if (!prevDone) {
        toast(app, t("finishPrev"));
        return;
      }
      app.go({ name: "lesson", unit, lessonId: l.id });
    });
    list.append(b);
  });
  body.append(el("h2", { class: "section-title" }, t("lessons")), list);
}

// -------------------------------------------------------------- progress
export function renderProgress(app: App): void {
  const body = page(app, "progress");
  const prof = app.profile;
  const st = srsStats(app.course.cards, prof);
  const lessonsTotal = app.course.units.reduce((n, u) => n + u.lessons.length, 0);
  const lessonsDone = app.course.units.reduce((n, u) => n + app.lessonsDone(u), 0);

  body.append(el("div", { class: "progress-hero" },
    avatar(app.profileId, "avatar-lg"),
    el("h1", { class: "brand-title" }, profileName(app.profileId)),
  ));

  const grid = el("div", { class: "stats-grid" });
  const stat = (num: (Node | string)[], label: string) =>
    el("div", { class: "stat-card" },
      el("div", { class: "stat-num" }, ...num),
      el("div", { class: "stat-label" }, label));
  grid.append(
    stat([icon("flame"), `${prof.streak}`], t("dayStreak")),
    stat([`${prof.totalXp}`], t("totalXp")),
    stat([`${st.learned}`], t("wordsLearned", st.total)),
    stat([`${st.mastered}`], t("wordsMastered")),
    stat([`${lessonsDone}`], t("lessonsDoneStat", lessonsTotal)),
    stat([`${st.due}`], t("dueToday")),
  );
  body.append(grid);

  const switchBtn = el("button", { class: "btn-secondary", type: "button" },
    t("switchUser"));
  switchBtn.addEventListener("click", () => {
    setCurrent(null);
    app.go({ name: "profiles" });
  });
  body.append(switchBtn);
  body.append(langBtn(() => renderProgress(app)));
}
