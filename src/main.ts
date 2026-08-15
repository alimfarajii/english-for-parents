import "./styles.css";
import type { Course } from "./types";
import { App, type Screen } from "./app";
import { renderProfiles, renderHome, renderUnit, renderProgress } from "./screens";
import { runSession } from "./session";
import { buildLessonSession, buildReviewSession } from "./exercises";
import { dueCards, MAX_REVIEW_SESSION } from "./srs";
import { getCurrent } from "./store";
import { el, clear } from "./ui";

async function boot(): Promise<void> {
  const root = document.getElementById("app")!;
  const res = await fetch(`${import.meta.env.BASE_URL}course.json`);
  const course: Course = await res.json();

  const app = new App(course, getCurrent() ?? "mom", root);

  app.render = (s: Screen) => {
    window.scrollTo(0, 0);
    switch (s.name) {
      case "profiles":
        return renderProfiles(app);
      case "home":
        return renderHome(app);
      case "unit":
        return renderUnit(app, s.unit);
      case "progress":
        return renderProgress(app);
      case "lesson": {
        const lesson = s.unit.lessons.find((l) => l.id === s.lessonId)!;
        const isFirstOfUnit = s.unit.lessons[0].id === s.lessonId;
        const idx = s.unit.lessons.indexOf(lesson);
        const exercises = buildLessonSession(course, s.unit, lesson, {
          withGrammar: isFirstOfUnit,
        });
        return runSession(app, exercises, {
          title: `${s.unit.title_fa} — درس ${idx + 1}`,
          completionXp: 10,
          onExit: () => app.go({ name: "unit", unit: s.unit }),
          onFinish: () => {
            app.profile = {
              ...app.profile,
              lessons: {
                ...app.profile.lessons,
                [lesson.id]: (app.profile.lessons[lesson.id] ?? 0) + 1,
              },
            };
            app.save();
            app.go({ name: "unit", unit: s.unit });
          },
        });
      }
      case "review": {
        const due = dueCards(course.cards, app.profile)
          .slice(0, MAX_REVIEW_SESSION);
        if (due.length === 0) return renderNoReview(app);
        const exercises = buildReviewSession(course, due);
        return runSession(app, exercises, {
          title: "مرور روزانه",
          completionXp: 5,
          onExit: () => app.go({ name: "home" }),
          onFinish: () => app.go({ name: "home" }),
        });
      }
    }
  };

  app.go(getCurrent() ? { name: "home" } : { name: "profiles" });
}

function renderNoReview(app: App): void {
  clear(app.root);
  const wrap = el("div", { class: "done-screen" },
    el("div", { class: "done-emoji" }, "🌤"),
    el("h1", { class: "done-title" }, "چیزی برای مرور نیست"),
    el("div", { class: "done-sub" },
      "فعلاً همهٔ کلمه‌ها تازه‌اند. یک درس جدید شروع کنید!"),
  );
  const btn = el("button", { class: "btn-primary", type: "button" }, "بازگشت");
  btn.addEventListener("click", () => app.go({ name: "home" }));
  wrap.append(btn);
  app.root.append(wrap);
}

void boot();
