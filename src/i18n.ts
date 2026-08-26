/** UI language for the app chrome (menus, buttons, labels, feedback).
 *  Lesson content (words, examples, grammar notes) is untouched.
 *  Farsi is the default; the choice is per device (localStorage). */
export type Lang = "fa" | "en";

const KEY = "efp2.lang";
let lang: Lang = localStorage.getItem(KEY) === "en" ? "en" : "fa";

export function getLang(): Lang {
  return lang;
}

export function setLang(l: Lang): void {
  lang = l;
  localStorage.setItem(KEY, l);
  applyDir();
}

/** Set <html> lang/dir to match the UI language. Call once at boot too. */
export function applyDir(): void {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "fa" ? "rtl" : "ltr";
}

const S: Record<string, { fa: string; en: string }> = {
  brandTitle: { fa: "کلاس انگلیسی", en: "English Class" },
  whoAreYou: { fa: "کی هستید؟", en: "Who is learning?" },
  hello: { fa: "سلام {0} جان", en: "Hello, {0}!" },
  streakDays: { fa: "{0} روز پشت‌سرهم", en: "{0}-day streak" },
  dailyGoal: { fa: "هدف روز: {0} امتیاز", en: "Daily goal: {0} XP" },
  continueLesson: { fa: "ادامهٔ درس", en: "Continue lesson" },
  lessonN: { fa: "درس {0}", en: "Lesson {0}" },
  allDone: {
    fa: "همهٔ درس‌ها را تمام کرده‌اید! هر روز مرور کنید.",
    en: "All lessons finished! Keep reviewing every day.",
  },
  reviewToday: { fa: "{0} کلمه برای مرور امروز", en: "{0} words to review today" },
  lessons: { fa: "درس‌ها", en: "Lessons" },
  review: { fa: "مرور", en: "Review" },
  progress: { fa: "پیشرفت", en: "Progress" },
  complete: { fa: "کامل شد", en: "Complete" },
  ofLessons: { fa: "{0} از {1} درس", en: "{0} of {1} lessons" },
  finishEarlier: { fa: "اول درس‌های قبلی را تمام کنید", en: "Finish the earlier lessons first" },
  finishPrev: { fa: "اول درس قبلی را تمام کنید", en: "Finish the previous lesson first" },
  back: { fa: "بازگشت", en: "Back" },
  grammarNote: { fa: "نکتهٔ دستوری", en: "Grammar note" },
  todaysNote: { fa: "نکتهٔ امروز", en: "Today's note" },
  newWord: { fa: "کلمهٔ جدید", en: "New word" },
  whatMeaning: { fa: "معنی این کلمه چیست؟", en: "What does this word mean?" },
  sayInEnglish: { fa: "به انگلیسی چه می‌شود؟", en: "How do you say it in English?" },
  listenWhat: { fa: "گوش کنید — چه شنیدید؟", en: "Listen — what did you hear?" },
  buildSentence: { fa: "جمله را به انگلیسی بسازید", en: "Build the sentence in English" },
  matchPairs: { fa: "جفت‌ها را پیدا کنید", en: "Match the pairs" },
  gotIt: { fa: "فهمیدم، ادامه", en: "Got it — continue" },
  startPractice: { fa: "شروع تمرین", en: "Start practice" },
  checkAnswer: { fa: "بررسی", en: "Check" },
  continue: { fa: "ادامه", en: "Continue" },
  correctFb: { fa: "آفرین! درست است", en: "Well done — correct!" },
  wrongFb: { fa: "اشکالی ندارد!", en: "No problem!" },
  correctAnswer: { fa: "جواب درست: ", en: "Correct answer: " },
  wellDone: { fa: "آفرین!", en: "Well done!" },
  xp: { fa: "امتیاز", en: "XP" },
  firstTry: { fa: "درست از بار اول", en: "right on first try" },
  dayStreak: { fa: "روز پشت‌سرهم", en: "day streak" },
  pct: { fa: "{0}٪", en: "{0}%" },
  totalXp: { fa: "کل امتیاز", en: "Total XP" },
  wordsLearned: { fa: "کلمه یادگرفته از {0}", en: "Words learned (of {0})" },
  wordsMastered: { fa: "کلمهٔ کاملاً بلد", en: "Words mastered" },
  lessonsDoneStat: { fa: "درس تمام‌شده از {0}", en: "Lessons done (of {0})" },
  dueToday: { fa: "برای مرور امروز", en: "Due for review today" },
  switchUser: { fa: "عوض کردن کاربر", en: "Switch user" },
  dailyReview: { fa: "مرور روزانه", en: "Daily review" },
  nothingReview: { fa: "چیزی برای مرور نیست", en: "Nothing to review" },
  allFresh: {
    fa: "فعلاً همهٔ کلمه‌ها تازه‌اند. یک درس جدید شروع کنید!",
    en: "All words are still fresh. Start a new lesson!",
  },
  playAudio: { fa: "پخش صدا", en: "Play audio" },
  exit: { fa: "خروج", en: "Exit" },
};

export function t(key: keyof typeof S, ...args: (string | number)[]): string {
  let s = S[key]?.[lang] ?? String(key);
  args.forEach((a, i) => {
    s = s.replace(`{${i}}`, String(a));
  });
  return s;
}

/** The other language's own name — the label for the switch button. */
export function otherLangLabel(): string {
  return lang === "fa" ? "English" : "فارسی";
}

export function toggleLang(): void {
  setLang(lang === "fa" ? "en" : "fa");
}

/** Unit title in the UI language (the other language becomes the subtitle). */
export function unitTitle(u: { title_fa: string; title_en: string }): string {
  return lang === "fa" ? u.title_fa : u.title_en;
}
export function unitSubtitle(u: { title_fa: string; title_en: string }): string {
  return lang === "fa" ? u.title_en : u.title_fa;
}
