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

/** Big tappable speaker button. */
export function speakerBtn(onTap: () => void, cls = ""): HTMLElement {
  const b = el("button", { class: `speaker ${cls}`, type: "button" }, "🔊");
  b.addEventListener("click", (e) => {
    e.stopPropagation();
    onTap();
    b.classList.remove("pulse");
    void (b as HTMLElement).offsetWidth; // restart animation
    b.classList.add("pulse");
  });
  return b;
}
