#!/usr/bin/env python3
"""Generate PWA icons: the khatam (eight-pointed star) brand mark — a teal
diamond under an ivory square with a lapis 'A' — on a lapis gradient.
Outputs icon-192, icon-512, and icon-512-maskable into public/icons/."""
import math
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "public", "icons")
FONT = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"

LAPIS = (36, 80, 158)
LAPIS_DEEP = (22, 50, 104)
TEAL = (17, 138, 136)
IVORY = (255, 253, 248)


def khatam_icon(size, pad_frac, mark_frac):
    """`mark_frac`: upright square half-side as a fraction of size."""
    ss = 4  # supersample for clean edges
    S = size * ss
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Rounded-square background with a vertical lapis gradient.
    pad = int(S * pad_frac)
    grad = Image.new("RGBA", (S, S))
    gd = ImageDraw.Draw(grad)
    for y in range(S):
        t = y / S
        col = tuple(int(LAPIS[i] * (1 - t) + LAPIS_DEEP[i] * t) for i in range(3)) + (255,)
        gd.line([(0, y), (S, y)], fill=col)
    mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [pad, pad, S - pad, S - pad], radius=int(S * 0.18), fill=255)
    img.paste(grad, (0, 0), mask)

    cx = cy = S / 2
    s = S * mark_frac              # upright square half-side
    reach = s * math.sqrt(2)       # rotated square's corner distance

    # Teal diamond (the rotated square of the khatam).
    d.polygon(
        [(cx, cy - reach), (cx + reach, cy), (cx, cy + reach), (cx - reach, cy)],
        fill=TEAL + (255,))
    # Ivory upright square on top.
    d.rounded_rectangle(
        [cx - s, cy - s, cx + s, cy + s], radius=int(S * 0.03),
        fill=IVORY + (255,))

    # Lapis 'A' centered on the ivory square.
    f = ImageFont.truetype(FONT, int(s * 1.5))
    bbox = d.textbbox((0, 0), "A", font=f)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    d.text((cx - w / 2 - bbox[0], cy - h / 2 - bbox[1]), "A",
           font=f, fill=LAPIS + (255,))

    return img.resize((size, size), Image.LANCZOS)


def main():
    os.makedirs(OUT, exist_ok=True)
    khatam_icon(192, 0.0, 0.26).save(os.path.join(OUT, "icon-192.png"))
    khatam_icon(512, 0.0, 0.26).save(os.path.join(OUT, "icon-512.png"))
    # maskable: keep art inside the safe zone (no transparent border, smaller mark)
    khatam_icon(512, 0.0, 0.20).save(os.path.join(OUT, "icon-512-maskable.png"))
    print("Wrote icons ->", OUT)


if __name__ == "__main__":
    main()
