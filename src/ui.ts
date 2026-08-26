import { t } from "./i18n";

/** Tiny DOM helpers. */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else node.setAttribute(k, v);
  }
  node.append(...children);
  return node;
}

export function clear(node: HTMLElement): void {
  node.replaceChildren();
}

/**
 * Render mixed Farsi/English text: wraps Latin runs (plus their trailing
 * punctuation) in LTR <bdi> so bidi punctuation lands where it should.
 */
export function bidi(text: string): HTMLElement {
  const span = el("span");
  const re = /[A-Za-z][A-Za-z' .,…]*[?!.]?/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index! > last) span.append(text.slice(last, m.index!));
    const en = el("bdi", { class: "en-inline", dir: "ltr" });
    en.textContent = m[0].trim();
    span.append(en);
    last = m.index! + m[0].length;
  }
  if (last < text.length) span.append(text.slice(last));
  return span;
}

// ------------------------------------------------------------------- icons
/** Inline SVG icon set — one stroke style everywhere (2px, round caps). */
const PATHS: Record<string, string> = {
  volume:
    '<path d="M11 5 6 9H2v6h4l5 4V5Z" fill="currentColor" stroke="none"/>' +
    '<path d="M15.5 9a5 5 0 0 1 0 6"/><path d="M18.5 6.5a9 9 0 0 1 0 11"/>',
  book:
    '<path d="M12 7v14"/>' +
    '<path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
  repeat:
    '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/>' +
    '<path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  star:
    '<path d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.3l-5.8 3.1 1.1-6.5L2.6 9.3l6.5-.9z"/>',
  lock:
    '<rect x="4" y="11" width="16" height="10" rx="2.5"/>' +
    '<path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  flame:
    '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  medal:
    '<circle cx="12" cy="9" r="6"/>' +
    '<path d="m15.4 13.9 1.6 7.1-5-2.5-5 2.5 1.6-7.1"/>',
  sparkles:
    '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/>' +
    '<path d="M19 17v4"/><path d="M17 19h4"/>',
  globe:
    '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/>' +
    '<path d="M12 3a13.5 13.5 0 0 1 0 18"/><path d="M12 3a13.5 13.5 0 0 0 0 18"/>',
  cap:
    '<path d="M21.42 10.92a1 1 0 0 0-.02-1.84L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.83l8.57 3.91a2 2 0 0 0 1.66 0z"/>' +
    '<path d="M22 10v6"/><path d="M6 12.5V16c0 1.66 2.69 3 6 3s6-1.34 6-3v-3.5"/>',
};

export function icon(name: keyof typeof PATHS, cls = ""): HTMLElement {
  const span = el("span", { class: `icon ${cls}`, "aria-hidden": "true" });
  span.innerHTML =
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ` +
    `stroke-linecap="round" stroke-linejoin="round">${PATHS[name]}</svg>`;
  return span;
}

/** The khatam (eight-pointed star) brand mark: two overlapped squares. */
export function brandMark(size: number, letter = "A"): HTMLElement {
  const span = el("span", { class: "brandmark", "aria-hidden": "true" });
  span.innerHTML =
    `<svg width="${size}" height="${size}" viewBox="0 0 100 100">` +
    `<rect x="22" y="22" width="56" height="56" rx="7" fill="var(--teal)" transform="rotate(45 50 50)"/>` +
    `<rect x="22" y="22" width="56" height="56" rx="7" fill="var(--primary)"/>` +
    `<text x="50" y="54" text-anchor="middle" dominant-baseline="central" ` +
    `font-family="Andika, Vazirmatn, sans-serif" font-weight="700" font-size="42" ` +
    `fill="#fff">${letter}</text></svg>`;
  return span;
}

/** Big tappable speaker button. */
export function speakerBtn(onTap: () => void, cls = ""): HTMLElement {
  const b = el("button", {
    class: `speaker ${cls}`,
    type: "button",
    "aria-label": t("playAudio"),
  }, icon("volume"));
  b.addEventListener("click", (e) => {
    e.stopPropagation();
    onTap();
    b.classList.remove("pulse");
    void (b as HTMLElement).offsetWidth; // restart animation
    b.classList.add("pulse");
  });
  return b;
}

/** SVG progress ring (turquoise, rounded cap), 0–100. */
export function progressRing(pct: number, size: number, label: string): HTMLElement {
  const r = (size - 7) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.min(100, Math.max(0, pct)) / 100);
  const span = el("span", { class: "ring" });
  span.innerHTML =
    `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
    `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--line)" stroke-width="6"/>` +
    `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--teal)" stroke-width="6" ` +
    `stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" ` +
    `transform="rotate(-90 ${size / 2} ${size / 2})"/></svg>` +
    `<span class="ring-label">${label}</span>`;
  return span;
}
