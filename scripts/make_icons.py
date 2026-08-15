#!/usr/bin/env python3
"""Generate PWA icons: an emerald rounded square with a white 'A'.
Outputs icon-192, icon-512, and icon-512-maskable into public/icons/."""
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "public", "icons")
FONT = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
BLUE = (16, 150, 110, 255)
BLUE2 = (7, 94, 84, 255)


def rounded(size, radius_frac, pad_frac, letter_frac):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    pad = int(size * pad_frac)
    r = int(size * radius_frac)
    # vertical gradient fill inside a rounded rect (via mask)
    grad = Image.new("RGBA", (size, size))
    gd = ImageDraw.Draw(grad)
    for y in range(size):
        t = y / size
        col = tuple(int(BLUE[i] * (1 - t) + BLUE2[i] * t) for i in range(3)) + (255,)
        gd.line([(0, y), (size, y)], fill=col)
    mask = Image.new("L", (size, size), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle([pad, pad, size - pad, size - pad], radius=r, fill=255)
    img.paste(grad, (0, 0), mask)

    # white 'A'
    f = ImageFont.truetype(FONT, int(size * letter_frac))
    bbox = d.textbbox((0, 0), "A", font=f)
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    d.text(((size - w) / 2 - bbox[0], (size - h) / 2 - bbox[1]), "A",
           font=f, fill=(255, 255, 255, 255))
    return img


def main():
    os.makedirs(OUT, exist_ok=True)
    rounded(192, 0.18, 0.0, 0.62).save(os.path.join(OUT, "icon-192.png"))
    rounded(512, 0.18, 0.0, 0.62).save(os.path.join(OUT, "icon-512.png"))
    # maskable: keep art inside the safe zone (more padding, smaller letter)
    rounded(512, 0.16, 0.10, 0.50).save(os.path.join(OUT, "icon-512-maskable.png"))
    print("Wrote icons ->", OUT)


if __name__ == "__main__":
    main()
