#!/usr/bin/env python3
"""Build public/course.json — the source of truth for the v2 course.

Reuses the 147 words (text + pre-generated audio ids) from v1
(../english-for-parents/public/deck.json), reorganized into 13 pedagogical
units, plus new words and a Farsi grammar mini-lesson per unit.

  python3 scripts/build_course.py
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
V1_DECK = os.path.join(ROOT, "..", "english-for-parents", "public", "deck.json")
OUT = os.path.join(ROOT, "public", "course.json")

# ---------------------------------------------------------------- new words
# id: (en, fa, example_en, example_fa)
NEW_WORDS = {
    # u9 — body & health
    "tooth": ("tooth", "دندان", "My tooth hurts.", "دندانم درد می‌کند."),
    "stomach": ("stomach", "شکم", "My stomach hurts.", "شکمم درد می‌کند."),
    "back": ("back", "کمر", "My back hurts a little.", "کمرم کمی درد می‌کند."),
    "pharmacy": ("pharmacy", "داروخانه", "The pharmacy is near the bank.",
                 "داروخانه نزدیک بانک است."),
    "nurse": ("nurse", "پرستار", "The nurse is very kind.",
              "پرستار خیلی مهربان است."),
    # u10 — places & getting around
    "bus": ("bus", "اتوبوس", "I go to the market by bus.",
            "با اتوبوس به بازار می‌روم."),
    "taxi": ("taxi", "تاکسی", "We take a taxi to the airport.",
             "با تاکسی به فرودگاه می‌رویم."),
    "left": ("left", "چپ", "The shop is on the left.", "مغازه سمت چپ است."),
    "right": ("right", "راست", "Turn right at the bank.",
              "کنار بانک به راست بپیچید."),
    "near": ("near", "نزدیک", "The park is near our house.",
             "پارک نزدیک خانهٔ ماست."),
    "far": ("far", "دور", "The hospital is far from here.",
            "بیمارستان از اینجا دور است."),
    # u12 — shopping & money
    "price": ("price", "قیمت", "The price is good.", "قیمتش خوب است."),
    "cheap": ("cheap", "ارزان", "This bag is cheap.", "این کیسه ارزان است."),
    "expensive": ("expensive", "گران", "That phone is expensive.",
                  "آن گوشی گران است."),
    "pay": ("pay", "پرداخت کردن", "I pay with my card.",
            "با کارتم پرداخت می‌کنم."),
    "sell": ("sell", "فروختن", "They sell fresh bread here.",
             "اینجا نان تازه می‌فروشند."),
    "cash": ("cash", "پول نقد", "Do you pay with cash?",
             "نقد پرداخت می‌کنید؟"),
    "card": ("card", "کارت", "Here is my card.", "این کارت من است."),
    "bag": ("bag", "کیسه", "A bag, please.", "لطفاً یک کیسه."),
    "how-much": ("How much is it?", "چند است؟", "How much is this apple?",
                 "این سیب چند است؟"),
    "free": ("free", "رایگان", "The water is free.", "آب رایگان است."),
    # u13 — essential phrases
    "help-me": ("Help me, please.", "لطفاً به من کمک کنید.",
                "Help me, please. I am lost.",
                "لطفاً به من کمک کنید. گم شده‌ام."),
    "i-dont-understand": ("I don't understand.", "متوجه نمی‌شوم.",
                          "Sorry, I don't understand.",
                          "ببخشید، متوجه نمی‌شوم."),
    "i-dont-know": ("I don't know.", "نمی‌دانم.",
                    "I don't know this word.", "این کلمه را نمی‌دانم."),
    "speak-slowly": ("Please speak slowly.", "لطفاً آهسته صحبت کنید.",
                     "Please speak slowly. I am learning English.",
                     "لطفاً آهسته صحبت کنید. دارم انگلیسی یاد می‌گیرم."),
    "repeat-please": ("Can you repeat, please?", "می‌شود تکرار کنید؟",
                      "Can you repeat, please? One more time.",
                      "می‌شود تکرار کنید؟ یک بار دیگر."),
    "how-do-you-say": ("How do you say…?", "چطور می‌گویند…؟",
                       "How do you say «آب» in English?",
                       "به انگلیسی «آب» چطور می‌گویند؟"),
    "where-is-toilet": ("Where is the bathroom?", "دستشویی کجاست؟",
                        "Excuse me, where is the bathroom?",
                        "ببخشید، دستشویی کجاست؟"),
    "i-need": ("I need…", "احتیاج دارم…", "I need water, please.",
               "لطفاً آب می‌خواهم، احتیاج دارم."),
    "call": ("call", "زنگ زدن", "Please call my son.",
             "لطفاً به پسرم زنگ بزنید."),
    "police": ("police", "پلیس", "Call the police, please.",
               "لطفاً به پلیس زنگ بزنید."),
    "wait": ("wait", "صبر کردن", "Please wait here.",
             "لطفاً اینجا صبر کنید."),
    "okay": ("okay", "باشه", "Okay, thank you very much.",
             "باشه، خیلی ممنون."),
}

# ------------------------------------------------------------------- units
# Each: id, icon, Farsi title, English title, grammar note, word ids in
# teaching order (mix of v1 ids and NEW_WORDS ids).
UNITS = [
    {
        "id": "u1", "icon": "👋",
        "title_fa": "سلام و آشنایی", "title_en": "Greetings",
        "words": ["hello", "goodbye", "yes", "no", "please", "thank-you",
                  "sorry", "good-morning", "good-night", "welcome",
                  "how-are-you", "nice-to-meet-you", "excuse-me"],
        "grammar": {
            "title_fa": "معرفی خودمان: I am …",
            "body_fa": ("در انگلیسی برای معرفی خودتان می‌گویید "
                        "My name is … یعنی «اسم من … است». "
                        "برای گفتن حال و وضعیت خودتان از I am استفاده می‌کنید: "
                        "I am happy یعنی «من خوشحالم». "
                        "I یعنی «من» و همیشه با حرف بزرگ نوشته می‌شود."),
            "examples": [
                ("My name is Maryam.", "اسم من مریم است."),
                ("I am happy.", "من خوشحالم."),
                ("I am from Iran.", "من اهل ایران هستم."),
            ],
        },
    },
    {
        "id": "u2", "icon": "👨‍👩‍👧",
        "title_fa": "خانواده", "title_en": "Family",
        "words": ["mother", "father", "son", "daughter", "brother", "sister",
                  "husband", "wife", "child", "baby", "friend",
                  "grandmother", "grandfather"],
        "grammar": {
            "title_fa": "مالِ من، مالِ شما: my و your",
            "body_fa": ("my یعنی «مالِ من» و your یعنی «مالِ شما». "
                        "این کلمه‌ها قبل از اسم می‌آیند: "
                        "my son یعنی «پسرِ من» و your daughter یعنی "
                        "«دخترِ شما». به همین سادگی!"),
            "examples": [
                ("My son lives in Canada.", "پسرم در کانادا زندگی می‌کند."),
                ("This is my husband.", "این شوهر من است."),
                ("Your daughter is very kind.", "دخترِ شما خیلی مهربان است."),
            ],
        },
    },
    {
        "id": "u3", "icon": "🔢",
        "title_fa": "عددها", "title_en": "Numbers",
        "words": ["one", "two", "three", "four", "five", "six", "seven",
                  "eight", "nine", "ten", "hundred"],
        "grammar": {
            "title_fa": "بیشتر از یکی: جمع با s",
            "body_fa": ("در انگلیسی وقتی چیزی بیشتر از یکی باشد، آخر کلمه "
                        "یک s می‌آید: one apple یعنی «یک سیب» ولی "
                        "two apples یعنی «دو سیب». "
                        "برای پرسیدن تعداد می‌گوییم How many یعنی «چند تا؟»."),
            "examples": [
                ("I have two sons.", "من دو پسر دارم."),
                ("Three apples, please.", "لطفاً سه سیب."),
                ("How many children do you have?", "چند تا بچه دارید؟"),
            ],
        },
    },
    {
        "id": "u4", "icon": "🏠",
        "title_fa": "خانه و وسایل", "title_en": "Home",
        "words": ["house", "door", "window", "table", "chair", "bed", "room",
                  "key", "phone", "book", "light", "clock"],
        "grammar": {
            "title_fa": "این و آن: this و that",
            "body_fa": ("this یعنی «این» (برای چیز نزدیک) و that یعنی «آن» "
                        "(برای چیز دور). "
                        "This is a key یعنی «این یک کلید است». "
                        "برای پرسیدن جای چیزی: Where is …? یعنی «… کجاست؟»."),
            "examples": [
                ("This is my room.", "این اتاق من است."),
                ("That is your chair.", "آن صندلی شماست."),
                ("Where is the key?", "کلید کجاست؟"),
            ],
        },
    },
    {
        "id": "u5", "icon": "🍎",
        "title_fa": "غذا و نوشیدنی", "title_en": "Food & Drink",
        "words": ["water", "bread", "rice", "tea", "coffee", "milk", "egg",
                  "meat", "fruit", "apple", "sugar", "salt", "food",
                  "breakfast", "lunch", "dinner", "hungry", "thirsty"],
        "grammar": {
            "title_fa": "خواستن و دوست داشتن: I want و I like",
            "body_fa": ("I want یعنی «می‌خواهم» و I like یعنی «دوست دارم». "
                        "بعدش اسم چیزی که می‌خواهید می‌آید: "
                        "I want tea یعنی «چای می‌خواهم». "
                        "در مغازه یا رستوران با please مؤدبانه‌تر می‌شود: "
                        "Tea, please."),
            "examples": [
                ("I want water, please.", "لطفاً آب می‌خواهم."),
                ("I like Persian food.", "غذای ایرانی دوست دارم."),
                ("Do you want tea or coffee?", "چای می‌خواهید یا قهوه؟"),
            ],
        },
    },
    {
        "id": "u6", "icon": "🕐",
        "title_fa": "روزها و زمان", "title_en": "Days & Time",
        "words": ["day", "night", "today", "tomorrow", "yesterday", "week",
                  "month", "year", "morning", "evening", "hour", "minute",
                  "now", "time"],
        "grammar": {
            "title_fa": "ساعت چند است؟ It is …",
            "body_fa": ("برای زمان و ساعت از It is استفاده می‌کنیم: "
                        "It is ten یعنی «ساعت ده است». "
                        "پرسیدن ساعت: What time is it? یعنی «ساعت چند است؟». "
                        "کلمه‌های today (امروز)، tomorrow (فردا) معمولاً آخر "
                        "جمله می‌آیند: I go today یعنی «امروز می‌روم»."),
            "examples": [
                ("What time is it?", "ساعت چند است؟"),
                ("It is ten in the morning.", "ساعت دهِ صبح است."),
                ("My daughter comes tomorrow.", "دخترم فردا می‌آید."),
            ],
        },
    },
    {
        "id": "u7", "icon": "🏃",
        "title_fa": "کارهای روزمره", "title_en": "Daily Verbs",
        "words": ["go", "come", "eat", "drink", "sleep", "see", "speak",
                  "read", "write", "walk", "work", "give", "take", "want",
                  "like", "know", "help", "open", "close"],
        "grammar": {
            "title_fa": "جمله ساختن: من می‌روم، شما می‌روید",
            "body_fa": ("در انگلیسی جمله با فاعل شروع می‌شود و بعد فعل می‌آید "
                        "— برعکسِ فارسی که فعل آخر است. "
                        "I eat breakfast یعنی «صبحانه می‌خورم» "
                        "(کلمه به کلمه: من می‌خورم صبحانه). "
                        "با I و you فعل تغییری نمی‌کند: I go / you go."),
            "examples": [
                ("I walk in the park every day.", "هر روز در پارک قدم می‌زنم."),
                ("You speak English very well!", "شما خیلی خوب انگلیسی حرف می‌زنید!"),
                ("We eat dinner at eight.", "ساعت هشت شام می‌خوریم."),
            ],
        },
    },
    {
        "id": "u8", "icon": "✨",
        "title_fa": "توصیف چیزها", "title_en": "Adjectives",
        "words": ["good", "bad", "big", "small", "hot", "cold", "new", "old",
                  "happy", "tired", "beautiful", "easy", "difficult"],
        "grammar": {
            "title_fa": "توصیف کردن: It is + صفت",
            "body_fa": ("برای توصیف چیزها می‌گوییم It is و بعد صفت: "
                        "It is hot یعنی «(هوا/این) گرم است». "
                        "very یعنی «خیلی»: very good یعنی «خیلی خوب». "
                        "صفت در انگلیسی قبل از اسم می‌آید: "
                        "a big house یعنی «یک خانهٔ بزرگ»."),
            "examples": [
                ("The tea is very hot.", "چای خیلی داغ است."),
                ("It is a beautiful day.", "روز قشنگی است."),
                ("English is not difficult!", "انگلیسی سخت نیست!"),
            ],
        },
    },
    {
        "id": "u9", "icon": "🩺",
        "title_fa": "بدن و سلامتی", "title_en": "Health",
        "words": ["head", "hand", "eye", "foot", "heart", "tooth", "stomach",
                  "back", "doctor", "nurse", "medicine", "pharmacy", "sick",
                  "pain"],
        "grammar": {
            "title_fa": "پیش دکتر: دردم را بگویم",
            "body_fa": ("برای گفتن درد، اسم عضو بدن + hurts می‌آید: "
                        "My head hurts یعنی «سرم درد می‌کند». "
                        "برای حال بد: I am sick یعنی «مریضم» و "
                        "I need a doctor یعنی «دکتر لازم دارم». "
                        "این جمله‌ها پیش دکتر خیلی به کار می‌آیند."),
            "examples": [
                ("My head hurts.", "سرم درد می‌کند."),
                ("I am sick. I need a doctor.", "مریضم. دکتر لازم دارم."),
                ("Take this medicine every morning.", "این دارو را هر صبح بخورید."),
            ],
        },
    },
    {
        "id": "u10", "icon": "🚌",
        "title_fa": "جاها و رفت‌وآمد", "title_en": "Places",
        "words": ["home", "street", "hospital", "school", "park", "city",
                  "station", "car", "bus", "taxi", "left", "right", "near",
                  "far"],
        "grammar": {
            "title_fa": "آدرس پرسیدن: ?…Where is",
            "body_fa": ("برای پیدا کردن جایی می‌پرسیم Where is و اسم آنجا: "
                        "Where is the bank? یعنی «بانک کجاست؟». "
                        "جواب‌ها را هم یاد بگیرید: on the left (سمت چپ)، "
                        "on the right (سمت راست)، near (نزدیک)، far (دور). "
                        "اولش excuse me بگویید تا مؤدبانه باشد."),
            "examples": [
                ("Excuse me, where is the station?", "ببخشید، ایستگاه کجاست؟"),
                ("The pharmacy is on the right.", "داروخانه سمت راست است."),
                ("It is near, not far.", "نزدیک است، دور نیست."),
            ],
        },
    },
    {
        "id": "u11", "icon": "❓",
        "title_fa": "سؤال و جواب", "title_en": "Questions",
        "words": ["what", "who", "where", "when", "why", "how", "i", "you",
                  "we", "man", "woman", "name"],
        "grammar": {
            "title_fa": "کلمه‌های سؤالی",
            "body_fa": ("سؤال‌ها با این کلمه‌ها شروع می‌شوند: "
                        "what (چه)، who (کی)، where (کجا)، "
                        "when (کِی)، why (چرا)، how (چطور). "
                        "کلمهٔ سؤالی همیشه اول جمله می‌آید: "
                        "What is this? یعنی «این چیست؟»."),
            "examples": [
                ("What is your name?", "اسم شما چیست؟"),
                ("Who is that man?", "آن مرد کیست؟"),
                ("When do you eat lunch?", "کِی ناهار می‌خورید؟"),
            ],
        },
    },
    {
        "id": "u12", "icon": "🛒",
        "title_fa": "خرید و پول", "title_en": "Shopping",
        "words": ["money", "buy", "shop", "market", "bank", "price", "cheap",
                  "expensive", "pay", "sell", "cash", "card", "bag",
                  "how-much", "free"],
        "grammar": {
            "title_fa": "قیمت پرسیدن: How much is it?",
            "body_fa": ("در مغازه می‌پرسید How much is it? یعنی «چند است؟». "
                        "جواب با It is می‌آید: It is five dollars یعنی "
                        "«پنج دلار است». "
                        "برای خواستن چیزی کافی است اسمش را بگویید و please: "
                        "Bread, please. به همین راحتی خرید می‌کنید!"),
            "examples": [
                ("How much is this?", "این چند است؟"),
                ("It is ten dollars.", "ده دلار است."),
                ("I pay with card.", "با کارت پرداخت می‌کنم."),
            ],
        },
    },
    {
        "id": "u13", "icon": "🆘",
        "title_fa": "جمله‌های ضروری", "title_en": "Essentials",
        "words": ["help-me", "i-dont-understand", "i-dont-know",
                  "speak-slowly", "repeat-please", "how-do-you-say",
                  "where-is-toilet", "i-need", "call", "police", "wait",
                  "okay"],
        "grammar": {
            "title_fa": "جمله‌های نجات‌بخش",
            "body_fa": ("این جمله‌ها را حفظ کنید — همه‌جا به کار می‌آیند. "
                        "اگر متوجه نشدید: I don't understand. "
                        "اگر تند حرف زدند: Please speak slowly. "
                        "اگر کمک خواستید: Help me, please. "
                        "نگران اشتباه نباشید؛ همین که تلاش کنید، مردم "
                        "کمکتان می‌کنند."),
            "examples": [
                ("Sorry, I don't understand. Please speak slowly.",
                 "ببخشید متوجه نمی‌شوم. لطفاً آهسته صحبت کنید."),
                ("I need help, please.", "لطفاً، کمک لازم دارم."),
                ("How do you say «ممنون» in English?",
                 "به انگلیسی «ممنون» چطور می‌گویند؟"),
            ],
        },
    },
]

LESSON_SIZE = 5  # target words per lesson


def chunk(ids):
    """Split a unit's word list into lessons of ~LESSON_SIZE, evenly."""
    n = len(ids)
    k = max(1, round(n / LESSON_SIZE))
    base, extra = divmod(n, k)
    out, i = [], 0
    for j in range(k):
        size = base + (1 if j < extra else 0)
        out.append(ids[i:i + size])
        i += size
    return out


def main():
    v1 = {c["id"]: c for c in json.load(open(V1_DECK, encoding="utf-8"))}

    cards, seen = [], set()
    units_out = []
    for u in UNITS:
        lessons = [
            {"id": f'{u["id"]}l{i + 1}', "cards": ids}
            for i, ids in enumerate(chunk(u["words"]))
        ]
        g = u["grammar"]
        units_out.append({
            "id": u["id"],
            "icon": u["icon"],
            "title_fa": u["title_fa"],
            "title_en": u["title_en"],
            "grammar": {
                "title_fa": g["title_fa"],
                "body_fa": g["body_fa"],
                "examples": [
                    {"id": f'g_{u["id"]}_{i + 1}', "en": en, "fa": fa}
                    for i, (en, fa) in enumerate(g["examples"])
                ],
            },
            "lessons": lessons,
        })
        for wid in u["words"]:
            if wid in seen:
                sys.exit(f"duplicate word id across units: {wid}")
            seen.add(wid)
            if wid in v1:
                c = v1[wid]
                cards.append({
                    "id": wid, "en": c["en"], "fa": c["fa"],
                    "example_en": c["example_en"], "example_fa": c["example_fa"],
                    "unit": u["id"],
                })
            elif wid in NEW_WORDS:
                en, fa, ex_en, ex_fa = NEW_WORDS[wid]
                cards.append({
                    "id": wid, "en": en, "fa": fa,
                    "example_en": ex_en, "example_fa": ex_fa,
                    "unit": u["id"],
                })
            else:
                sys.exit(f"unknown word id: {wid}")

    unused = set(NEW_WORDS) - seen
    if unused:
        sys.exit(f"NEW_WORDS never placed in a unit: {sorted(unused)}")

    course = {"version": 2, "units": units_out, "cards": cards}
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(course, f, ensure_ascii=False, indent=1)
    n_lessons = sum(len(u["lessons"]) for u in units_out)
    print(f"Wrote {OUT}: {len(units_out)} units, {n_lessons} lessons, "
          f"{len(cards)} cards ({sum(1 for c in cards if c['id'] not in v1)} new)")


if __name__ == "__main__":
    main()
