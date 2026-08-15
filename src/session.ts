import type { Card, Exercise, SessionResult } from "./types";
import type { App } from "./app";
import { el, clear, bidi, speakerBtn } from "./ui";
import { playWord, playExample, play, sfxCorrect, sfxWrong, sfxFanfare } from "./audio";
import { srsAnswer } from "./srs";
import { addXp } from "./store";
import { confetti } from "./confetti";

interface SessionOpts {
  title: string;
  completionXp: number;
  onFinish: (r: SessionResult) => void;
  onExit: () => void;
}

/** Run a sequence of exercises inside `app.root`. Wrong answers come back
 *  at the end of the queue until answered correctly. */
export function runSession(app: App, exercises: Exercise[], opts: SessionOpts) {
  const queue = [...exercises];
  const scoredTotal = queue.filter((e) => e.kind !== "teach" && e.kind !== "grammar").length;
  const attempted = new Set<Exercise>();
  let correctFirstTry = 0;
  let xp = 0;
  let pos = 0; // count of completed items, for the progress bar

  function grade(ex: Exercise, correct: boolean, cards: Card[]): void {
    const first = !attempted.has(ex);
    attempted.add(ex);
    for (const c of cards) app.profile = srsAnswer(app.profile, c, correct);
    if (correct) {
      const gain = first ? 2 : 1;
      if (first) correctFirstTry++;
      xp += gain;
      app.profile = addXp(app.profile, gain);
    }
    app.save();
  }

  function next(): void {
    const ex = queue.shift();
    if (!ex) return finish();
    renderExercise(ex);
  }

  function retryLater(ex: Exercise): void {
    queue.push(ex);
  }

  function finish(): void {
    app.profile = addXp(app.profile, opts.completionXp);
    xp += opts.completionXp;
    app.save();
    sfxFanfare();
    confetti();
    renderDone();
  }

  // ---------------------------------------------------------------- shell
  function shell(): { body: HTMLElement; footer: HTMLElement } {
    clear(app.root);
    const done = pos;
    const totalItems = done + queue.length + 1;
    const pct = Math.round((done / Math.max(1, totalItems)) * 100);
    const bar = el("div", { class: "sess-bar" },
      el("div", { class: "sess-bar-fill", style: `width:${pct}%` }));
    const close = el("button", { class: "sess-close", type: "button" }, "✕");
    close.addEventListener("click", opts.onExit);
    const body = el("div", { class: "sess-body" });
    const footer = el("div", { class: "sess-footer" });
    app.root.append(
      el("div", { class: "sess-top" }, close, bar),
      body,
      footer,
    );
    return { body, footer };
  }

  function continueBtn(label: string, cls: string, fn: () => void): HTMLElement {
    const b = el("button", { class: `btn-primary ${cls}`, type: "button" }, label);
    b.addEventListener("click", fn);
    return b;
  }

  /** Bottom feedback sheet after an answer. */
  function feedback(
    footer: HTMLElement,
    ok: boolean,
    correctText: string | null,
    onNext: () => void,
  ): void {
    clear(footer);
    const sheet = el("div", { class: `feedback ${ok ? "ok" : "bad"}` });
    sheet.append(
      el("div", { class: "fb-title" }, ok ? "آفرین! درست است ✓" : "اشکالی ندارد!"),
    );
    if (!ok && correctText) {
      const row = el("div", { class: "fb-answer" }, "جواب درست: ");
      row.append(bidi(correctText));
      sheet.append(row);
    }
    sheet.append(continueBtn("ادامه", ok ? "" : "btn-red", onNext));
    footer.append(sheet);
    (ok ? sfxCorrect : sfxWrong)();
  }

  function advance(): void {
    pos++;
    next();
  }

  // ------------------------------------------------------------ exercises
  function renderExercise(ex: Exercise): void {
    switch (ex.kind) {
      case "teach": return renderTeach(ex);
      case "grammar": return renderGrammar(ex);
      case "choice_fa":
      case "choice_en":
      case "listen": return renderChoice(ex);
      case "build": return renderBuild(ex);
      case "match": return renderMatch(ex);
    }
  }

  function renderTeach(ex: Extract<Exercise, { kind: "teach" }>): void {
    const { body, footer } = shell();
    const c = ex.card;
    body.append(el("div", { class: "ex-label" }, "کلمهٔ جدید"));
    const wordRow = el("div", { class: "teach-word" });
    wordRow.append(
      speakerBtn(() => playWord(c.id), "speaker-lg"),
      el("div", { class: "teach-en", dir: "ltr" }, c.en),
    );
    body.append(
      wordRow,
      el("div", { class: "teach-fa" }, c.fa),
      el("div", { class: "divider" }),
    );
    const exRow = el("div", { class: "teach-example" });
    exRow.append(
      speakerBtn(() => playExample(c.id)),
      el("div", {},
        el("div", { class: "teach-ex-en", dir: "ltr" }, c.example_en),
        el("div", { class: "teach-ex-fa" }, c.example_fa),
      ),
    );
    body.append(exRow);
    footer.append(continueBtn("فهمیدم، ادامه", "", advance));
    playWord(c.id);
  }

  function renderGrammar(ex: Extract<Exercise, { kind: "grammar" }>): void {
    const { body, footer } = shell();
    const g = ex.unit.grammar;
    body.append(
      el("div", { class: "ex-label" }, "نکتهٔ امروز " + ex.unit.icon),
      el("h2", { class: "grammar-title" }, bidi(g.title_fa)),
      el("p", { class: "grammar-body" }, bidi(g.body_fa)),
    );
    for (const gx of g.examples) {
      const row = el("div", { class: "grammar-example" });
      row.append(
        speakerBtn(() => play(gx.id)),
        el("div", {},
          el("div", { class: "teach-ex-en", dir: "ltr" }, gx.en),
          el("div", { class: "teach-ex-fa" }, gx.fa),
        ),
      );
      body.append(row);
    }
    footer.append(continueBtn("شروع تمرین", "", advance));
  }

  function renderChoice(
    ex: Extract<Exercise, { kind: "choice_fa" | "choice_en" | "listen" }>,
  ): void {
    const { body, footer } = shell();
    const c = ex.card;
    const prompts: Record<string, string> = {
      choice_fa: "معنی این کلمه چیست؟",
      choice_en: "به انگلیسی چه می‌شود؟",
      listen: "گوش کنید — چه شنیدید؟",
    };
    body.append(el("div", { class: "ex-label" }, prompts[ex.kind]));

    if (ex.kind === "choice_fa") {
      const row = el("div", { class: "prompt-row" });
      row.append(speakerBtn(() => playWord(c.id)),
        el("div", { class: "prompt-en", dir: "ltr" }, c.en));
      body.append(row);
      playWord(c.id);
    } else if (ex.kind === "choice_en") {
      body.append(el("div", { class: "prompt-fa" }, c.fa));
    } else {
      const big = speakerBtn(() => playWord(c.id), "speaker-xl");
      body.append(el("div", { class: "listen-wrap" }, big));
      playWord(c.id);
    }

    const optWrap = el("div", { class: "options" });
    const showEnglish = ex.kind !== "choice_fa";
    for (const opt of ex.options) {
      const label = showEnglish ? opt.en : opt.fa;
      const b = el("button", {
        class: "option",
        type: "button",
        dir: showEnglish ? "ltr" : "rtl",
      }, label);
      b.addEventListener("click", () => {
        const ok = opt.id === c.id;
        for (const x of optWrap.querySelectorAll("button")) {
          x.toggleAttribute("disabled", true);
        }
        b.classList.add(ok ? "opt-ok" : "opt-bad");
        if (!ok) {
          for (const x of optWrap.querySelectorAll("button")) {
            if (x.textContent === (showEnglish ? c.en : c.fa)) x.classList.add("opt-ok");
          }
          retryLater(ex);
        }
        grade(ex, ok, [c]);
        if (ok && ex.kind !== "choice_fa") playWord(c.id);
        feedback(footer, ok, showEnglish ? c.en : c.fa, advance);
      });
      optWrap.append(b);
    }
    body.append(optWrap);
  }

  function renderBuild(ex: Extract<Exercise, { kind: "build" }>): void {
    const { body, footer } = shell();
    const c = ex.card;
    body.append(
      el("div", { class: "ex-label" }, "جمله را به انگلیسی بسازید"),
      el("div", { class: "prompt-fa build-fa" }, c.example_fa),
    );
    const answer = el("div", { class: "build-answer", dir: "ltr" });
    const pool = el("div", { class: "build-pool", dir: "ltr" });
    body.append(answer, pool);

    const chosen: { word: string; btn: HTMLElement }[] = [];
    const checkBtn = continueBtn("بررسی", "", () => check());
    checkBtn.toggleAttribute("disabled", true);
    footer.append(checkBtn);

    const tiles = [...ex.tiles]
      .map((w) => ({ w, r: Math.random() }))
      .sort((a, b) => a.r - b.r);
    for (const { w } of tiles) {
      const t = el("button", { class: "tile", type: "button", dir: "ltr" }, w);
      t.addEventListener("click", () => {
        if (t.parentElement === pool) {
          answer.append(t);
          chosen.push({ word: w, btn: t });
        } else {
          pool.append(t);
          const i = chosen.findIndex((x) => x.btn === t);
          if (i >= 0) chosen.splice(i, 1);
        }
        checkBtn.toggleAttribute("disabled", chosen.length !== ex.tiles.length);
      });
      pool.append(t);
    }

    function check(): void {
      const ok = chosen.map((x) => x.word).join(" ") === ex.tiles.join(" ");
      grade(ex, ok, [c]);
      if (!ok) retryLater(ex);
      else playExample(c.id);
      feedback(footer, ok, c.example_en, advance);
    }
  }

  function renderMatch(ex: Extract<Exercise, { kind: "match" }>): void {
    const { body, footer } = shell();
    body.append(el("div", { class: "ex-label" }, "جفت‌ها را پیدا کنید"));
    const grid = el("div", { class: "match-grid" });
    body.append(grid);

    const enBtns = ex.cards.map((c) =>
      el("button", { class: "option match-opt", type: "button", dir: "ltr" }, c.en));
    const faOrder = [...ex.cards].map((c) => ({ c, r: Math.random() }))
      .sort((a, b) => a.r - b.r).map((x) => x.c);
    const faBtns = faOrder.map((c) =>
      el("button", { class: "option match-opt", type: "button" }, c.fa));

    const colEn = el("div", { class: "match-col" }, ...enBtns);
    const colFa = el("div", { class: "match-col" }, ...faBtns);
    grid.append(colEn, colFa);

    let selEn: number | null = null;
    let selFa: number | null = null;
    let mistakes = 0;
    let matched = 0;

    function tryMatch(): void {
      if (selEn === null || selFa === null) return;
      const cEn = ex.cards[selEn];
      const cFa = faOrder[selFa];
      const a = enBtns[selEn];
      const b = faBtns[selFa];
      if (cEn.id === cFa.id) {
        for (const x of [a, b]) {
          x.classList.remove("opt-sel");
          x.classList.add("opt-done");
          x.toggleAttribute("disabled", true);
        }
        playWord(cEn.id);
        matched++;
        if (matched === ex.cards.length) {
          const ok = mistakes === 0;
          grade(ex, ok, ex.cards);
          feedback(footer, true, null, advance);
        }
      } else {
        mistakes++;
        sfxWrong();
        for (const x of [a, b]) {
          x.classList.add("opt-shake");
          setTimeout(() => x.classList.remove("opt-shake", "opt-sel"), 500);
        }
      }
      selEn = selFa = null;
    }

    enBtns.forEach((b, i) => b.addEventListener("click", () => {
      enBtns.forEach((x) => x.classList.remove("opt-sel"));
      b.classList.add("opt-sel");
      selEn = i;
      playWord(ex.cards[i].id);
      tryMatch();
    }));
    faBtns.forEach((b, i) => b.addEventListener("click", () => {
      faBtns.forEach((x) => x.classList.remove("opt-sel"));
      b.classList.add("opt-sel");
      selFa = i;
      tryMatch();
    }));
  }

  // ------------------------------------------------------------- done
  function renderDone(): void {
    clear(app.root);
    const wrap = el("div", { class: "done-screen" });
    const pctOk = scoredTotal
      ? Math.round((correctFirstTry / scoredTotal) * 100) : 100;
    wrap.append(
      el("div", { class: "done-emoji" }, pctOk >= 80 ? "🎉" : "🌟"),
      el("h1", { class: "done-title" }, "آفرین!"),
      el("div", { class: "done-sub" }, opts.title),
      el("div", { class: "done-stats" },
        el("div", { class: "done-stat" },
          el("div", { class: "done-stat-num xp" }, `+${xp}`),
          el("div", { class: "done-stat-label" }, "امتیاز")),
        el("div", { class: "done-stat" },
          el("div", { class: "done-stat-num" }, `${pctOk}٪`),
          el("div", { class: "done-stat-label" }, "درست از بار اول")),
        el("div", { class: "done-stat" },
          el("div", { class: "done-stat-num streak" }, `${app.profile.streak} 🔥`),
          el("div", { class: "done-stat-label" }, "روز پشت‌سرهم")),
      ),
    );
    const btn = el("button", { class: "btn-primary", type: "button" }, "ادامه");
    btn.addEventListener("click", () =>
      opts.onFinish({ correctFirstTry, total: scoredTotal, xp }));
    wrap.append(btn);
    app.root.append(wrap);
  }

  next();
}
