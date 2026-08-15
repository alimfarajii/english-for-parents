# کلاس انگلیسی — English for Mom & Dad, v2

A mobile-first, installable PWA that teaches English to two Farsi-speaking
near-beginners (Mom & Dad). v2 upgrades the Phase-1 flashcard app
(`../english-for-parents`) into a structured course.

## What it does
- **13 units, 37 lessons, 180 words/phrases** — greetings, family, numbers,
  home, food, time, daily verbs, adjectives, health, places, questions,
  shopping, essential survival phrases. Units unlock in order.
- **Grammar mini-lessons** — every unit opens with a short دستور note written
  in friendly Farsi (I am…, my/your, plurals, this/that, Where is…?, present
  simple, How much…?) with three audio example sentences.
- **5 exercise types** — teach cards, EN→FA choice, FA→EN choice,
  listening comprehension (audio only), matching pairs, and a sentence
  builder (arrange English word tiles). Wrong answers come back until
  answered correctly, Duolingo-style, with gentle feedback.
- **Spaced repetition** — every answered word feeds a Leitner queue; the
  مرور (Review) tab serves due words as mixed recall exercises.
- **Motivation** — XP per answer, daily goal ring (20 XP), streak counter,
  confetti + fanfare on lesson completion, progress dashboard.
- **Two profiles** — مامان / بابا with fully independent progress
  (localStorage; v1 flashcard progress is auto-imported on first run on a
  same-origin deploy).
- **Offline-first PWA** — all 399 MP3s + course JSON precached (~4.3 MB);
  Add to Home Screen and it works with no connection.
- Built for aging eyes/thumbs: 19px+ base type, huge targets, high
  contrast, full RTL (Vazirmatn).

## Stack
Vite + vanilla TypeScript, `vite-plugin-pwa` (Workbox), no backend.

- `scripts/build_course.py` — source of truth for the course (reuses v1's
  147 words + their audio, adds 33 new words, defines units/grammar) →
  `public/course.json`.
- `scripts/generate_audio.py` — Kokoro TTS (`localhost:5124`) → MP3s in
  `public/audio/` (word, `_ex` example, `g_<unit>_<n>` grammar). Idempotent.
- `src/` — `app.ts` (context + unlock rules), `exercises.ts` (session
  generation), `session.ts` (exercise player), `screens.ts` (home / unit /
  progress), `srs.ts`, `store.ts`, `audio.ts` (incl. WebAudio sfx).

## Develop / build
```sh
npm install
npm run dev                        # dev server
python3 scripts/build_course.py    # rebuild course.json after content edits
python3 scripts/generate_audio.py  # fill in missing audio (needs Kokoro up)
npm run build                      # -> dist/ (static site)
npm run preview -- --host          # serve dist/ on the LAN for phone testing
```

## Deploy
`dist/` is a fully static site — Netlify / Vercel / any static host. Have
Mom & Dad open the URL and "Add to Home Screen". Deploying to the same
origin that served v1 preserves their flashcard progress (auto-migration).

## Editing content
Edit `NEW_WORDS` / `UNITS` in `scripts/build_course.py`, then:
```sh
python3 scripts/build_course.py && python3 scripts/generate_audio.py && npm run build
```
