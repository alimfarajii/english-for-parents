import type { Unit } from "./types";
import { App } from "./app";
import { el, clear, bidi, speakerBtn } from "./ui";
import { play } from "./audio";
import { dueCards, srsStats } from "./srs";
import { PROFILES, setCurrent, touchDay } from "./store";

// ------------------------------------------------------------------ shell
function tabbar(app: App, active: "home" | "review" | "progress"): HTMLElement {
  const mk = (id: typeof active, icon: string, label: string) => {
    const b = el("button", {
      class: `tab ${active === id ? "tab-active" : ""}`,
      type: "button",
    }, el("span", { class: "tab-icon" }, icon), el("span", {}, label));
    b.addEventListener("click", () => app.go({ name: id }));
    return b;
  };
  return el("nav", { class: "tabbar" },
    mk("home", "📚", "درس‌ها"),
    mk("review", "🔁", "مرور"),
    mk("progress", "⭐", "پیشرفت"),
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
    el("div", { class: "brand-emoji" }, "🇬🇧"),
    el("h1", { class: "brand-title" }, "کلاس انگلیسی"),
    el("p", { class: "brand-sub" }, "کی هستید؟"),
  );
  for (const p of PROFILES) {
    const b = el("button", { class: "profile-btn", type: "button" },
      el("span", { class: "profile-emoji" }, p.emoji),
      el("span", { class: "profile-name" }, p.fa),
    );
    b.addEventListener("click", () => {
      setCurrent(p.id);
      app.switchProfile(p.id);
    });
    wrap.append(b);
  }
  app.root.append(wrap);
}

// ------------------------------------------------------------------ home
export function renderHome(app: App): void {
  const body = page(app, "home");
  app.profile = touchDay(app.profile);
  app.save();
  const prof = app.profile;
  const who = PROFILES.find((p) => p.id === app.profileId)!;

  // Header: greeting + streak + daily goal ring.
  const goalPct = Math.min(100, Math.round((prof.xpToday / prof.dailyGoal) * 100));
  const ring = el("div", {
    class: "goal-ring",
    style: `--pct:${goalPct}`,
  }, el("div", { class: "goal-ring-inner" },
    goalPct >= 100 ? "✓" : `${prof.xpToday}`));
  const header = el("header", { class: "home-header" },
    el("div", {},
      el("div", { class: "hello" }, `سلام ${who.fa} جان ${who.emoji}`),
      el("div", { class: "streak-line" },
        `🔥 ${prof.streak} روز پشت‌سرهم`),
    ),
    el("div", { class: "goal-wrap" },
      ring,
      el("div", { class: "goal-label" }, `هدف روز: ${prof.dailyGoal} امتیاز`)),
  );
  body.append(header);

  // Continue card.
  const nxt = app.nextLesson();
  const due = dueCards(app.course.cards, prof).length;
  if (nxt) {
    const idx = nxt.unit.lessons.findIndex((l) => l.id === nxt.lessonId);
    const cont = el("button", { class: "continue-card", type: "button" },
      el("div", { class: "continue-icon" }, nxt.unit.icon),
      el("div", { class: "continue-text" },
        el("div", { class: "continue-title" }, "ادامهٔ درس"),
        el("div", { class: "continue-sub" },
          bidi(`${nxt.unit.title_fa} — درس ${idx + 1}`))),
      el("div", { class: "continue-go" }, "❮"),
    );
    cont.addEventListener("click", () =>
      app.go({ name: "lesson", unit: nxt.unit, lessonId: nxt.lessonId }));
    body.append(cont);
  } else {
    body.append(el("div", { class: "continue-card done-all" },
      "🎓 همهٔ درس‌ها را تمام کرده‌اید! هر روز مرور کنید."));
  }
  if (due > 0) {
    const rev = el("button", { class: "review-chip", type: "button" },
      `🔁 ${due} کلمه برای مرور امروز`);
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
      el("div", { class: "unit-icon" }, unlocked ? u.icon : "🔒"),
      el("div", { class: "unit-info" },
        el("div", { class: "unit-title" }, u.title_fa),
        el("div", { class: "unit-progress" },
          el("div", { class: "unit-progress-fill", style: `width:${(done / total) * 100}%` })),
        el("div", { class: "unit-sub" },
          done === total ? "کامل شد ✓" : `${done} از ${total} درس`),
      ),
    );
    card.addEventListener("click", () => {
      if (!unlocked) {
        toast(app, "اول درس‌های قبلی را تمام کنید 🙂");
        return;
      }
      app.go({ name: "unit", unit: u });
    });
    list.append(card);
  }
  body.append(el("h2", { class: "section-title" }, "درس‌ها"), list);
}

function toast(app: App, msg: string): void {
  const t = el("div", { class: "toast" }, msg);
  app.root.append(t);
  setTimeout(() => t.classList.add("toast-show"), 10);
  setTimeout(() => {
    t.classList.remove("toast-show");
    setTimeout(() => t.remove(), 300);
  }, 2200);
}

// ------------------------------------------------------------------ unit
export function renderUnit(app: App, unit: Unit): void {
  const body = page(app, "home");
  const back = el("button", { class: "back-btn", type: "button" }, "→ بازگشت");
  back.addEventListener("click", () => app.go({ name: "home" }));
  body.append(back);

  body.append(el("div", { class: "unit-hero" },
    el("div", { class: "unit-hero-icon" }, unit.icon),
    el("h1", { class: "unit-hero-title" }, unit.title_fa),
    el("div", { class: "unit-hero-en", dir: "ltr" }, unit.title_en),
  ));

  // Grammar note.
  const g = unit.grammar;
  const gcard = el("section", { class: "grammar-card" },
    el("div", { class: "grammar-kicker" }, "📖 نکتهٔ دستوری"),
    el("h2", { class: "grammar-title" }, bidi(g.title_fa)),
    el("p", { class: "grammar-body" }, bidi(g.body_fa)),
  );
  for (const gx of g.examples) {
    const row = el("div", { class: "grammar-example" });
    row.append(
      speakerBtn(() => play(gx.id)),
      el("div", {},
        el("div", { class: "teach-ex-en", dir: "ltr" }, gx.en),
        el("div", { class: "teach-ex-fa" }, gx.fa)),
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
      el("div", { class: "lesson-num" }, doneCount ? "✓" : `${i + 1}`),
      el("div", { class: "lesson-info" },
        el("div", { class: "lesson-title" }, `درس ${i + 1}`),
        el("div", { class: "lesson-words", dir: "ltr" }, names)),
    );
    b.addEventListener("click", () => {
      if (!prevDone) {
        toast(app, "اول درس قبلی را تمام کنید 🙂");
        return;
      }
      app.go({ name: "lesson", unit, lessonId: l.id });
    });
    list.append(b);
  });
  body.append(el("h2", { class: "section-title" }, "درس‌ها"), list);
}

// -------------------------------------------------------------- progress
export function renderProgress(app: App): void {
  const body = page(app, "progress");
  const prof = app.profile;
  const who = PROFILES.find((p) => p.id === app.profileId)!;
  const st = srsStats(app.course.cards, prof);
  const lessonsTotal = app.course.units.reduce((n, u) => n + u.lessons.length, 0);
  const lessonsDone = app.course.units.reduce((n, u) => n + app.lessonsDone(u), 0);

  body.append(el("div", { class: "progress-hero" },
    el("div", { class: "profile-emoji" }, who.emoji),
    el("h1", { class: "brand-title" }, who.fa),
  ));

  const grid = el("div", { class: "stats-grid" });
  const stat = (num: string, label: string, cls = "") =>
    el("div", { class: `stat-card ${cls}` },
      el("div", { class: "stat-num" }, num),
      el("div", { class: "stat-label" }, label));
  grid.append(
    stat(`🔥 ${prof.streak}`, "روز پشت‌سرهم"),
    stat(`${prof.totalXp}`, "کل امتیاز"),
    stat(`${st.learned}`, `کلمه یادگرفته از ${st.total}`),
    stat(`${st.mastered}`, "کلمهٔ کاملاً بلد"),
    stat(`${lessonsDone}`, `درس تمام‌شده از ${lessonsTotal}`),
    stat(`${st.due}`, "برای مرور امروز"),
  );
  body.append(grid);

  const switchBtn = el("button", { class: "btn-secondary", type: "button" },
    "عوض کردن کاربر");
  switchBtn.addEventListener("click", () => {
    setCurrent(null);
    app.go({ name: "profiles" });
  });
  body.append(switchBtn);
}
