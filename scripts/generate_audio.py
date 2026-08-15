#!/usr/bin/env python3
"""Generate one MP3 per word (and per example sentence) using the local Kokoro
TTS server, slightly slowed for clarity. Idempotent: skips files that exist.

  python3 scripts/generate_audio.py            # word + sentence audio
  python3 scripts/generate_audio.py --words     # words only
  python3 scripts/generate_audio.py --force     # regenerate everything
"""
import json
import os
import subprocess
import sys
import tempfile
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
COURSE = os.path.join(ROOT, "public", "course.json")
OUTDIR = os.path.join(ROOT, "public", "audio")

KOKORO = os.environ.get("KOKORO_URL", "http://localhost:5124/api/tts")
VOICE = os.environ.get("KOKORO_VOICE", "af_heart")
# Kokoro speed = 1 / length_scale. 1.15 -> ~0.87x: clear and unhurried for learners.
LENGTH_SCALE = float(os.environ.get("KOKORO_LENGTH_SCALE", "1.15"))


def synth(text: str, out_mp3: str):
    payload = json.dumps({
        "text": text,
        "voice": VOICE,
        "length_scale": LENGTH_SCALE,
    }).encode("utf-8")
    req = urllib.request.Request(KOKORO, data=payload,
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        wav = resp.read()
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tf:
        tf.write(wav)
        wav_path = tf.name
    try:
        # encode a small mono mp3; -y overwrite, quiet
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", wav_path,
             "-ac", "1", "-b:a", "64k", out_mp3],
            check=True,
        )
    finally:
        os.unlink(wav_path)


def main():
    words_only = "--words" in sys.argv
    force = "--force" in sys.argv
    os.makedirs(OUTDIR, exist_ok=True)
    course = json.load(open(COURSE, encoding="utf-8"))

    jobs = []
    for c in course["cards"]:
        jobs.append((c["en"], os.path.join(OUTDIR, f"{c['id']}.mp3")))
        if not words_only:
            jobs.append((c["example_en"], os.path.join(OUTDIR, f"{c['id']}_ex.mp3")))
    for u in course["units"]:
        for ex in u["grammar"]["examples"]:
            jobs.append((ex["en"], os.path.join(OUTDIR, f"{ex['id']}.mp3")))

    total = len(jobs)
    done = skipped = failed = 0
    for i, (text, out) in enumerate(jobs, 1):
        if os.path.exists(out) and not force:
            skipped += 1
            continue
        try:
            synth(text, out)
            done += 1
        except Exception as e:  # noqa: BLE001
            failed += 1
            print(f"  [FAIL] {text!r}: {e}", flush=True)
        if i % 10 == 0 or i == total:
            print(f"[{i}/{total}] made={done} skipped={skipped} failed={failed}",
                  flush=True)

    print(f"Done. made={done} skipped={skipped} failed={failed} -> {OUTDIR}")
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
