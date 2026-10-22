import { roleDescription } from "./host-role-badge.js";
import { hostText, hostLocale } from "./host-locale.js";
import { placeFloating } from "./popover.js";

// The time zone of the person looking at the page, for times that are about
// them (when an invitation to join closes) rather than about a place.
export function viewerTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function hostDateTime(value, timeZone = "UTC") {
  if (value == null || value === "") return hostText("Date unavailable");
  const instant = new Date(value);
  return Number.isFinite(instant.getTime())
    ? new Intl.DateTimeFormat(hostLocale, {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone,
      }).format(instant)
    : hostText("Date unavailable");
}

export const node = (tag, text, attrs = {}) => {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  for (const [key, value] of Object.entries(attrs)) {
    if (key === "aria-label") {
      if (tag === "section") element.dataset.hostSection = value;
      element.setAttribute(key, hostText(value));
    } else element.setAttribute(key, value);
  }
  return element;
};

// Copy with names in it. The translated sentence keeps the page's direction,
// and each {pN} value (a system name, an email, a number) sits in its own
// <bdi>, so a Latin name in Hebrew copy, or a Hebrew name in English copy,
// never reorders the words around it.
export function isolatedText(message, values = {}) {
  const fragment = document.createDocumentFragment();
  hostText(message)
    .split(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/)
    .forEach((part, index) => {
      if (index % 2 === 0) {
        if (part) fragment.append(part);
      } else if (Object.hasOwn(values, part))
        fragment.append(node("bdi", String(values[part])));
      else fragment.append(`{${part}}`);
    });
  return fragment;
}

// A block (heading, line, list label) that holds one name: the block keeps
// the page's direction and alignment, and only the name is isolated.
export function nameBlock(tag, name, attrs = {}) {
  const element = node(tag, undefined, attrs);
  element.append(node("bdi", name));
  return element;
}

// An ⓘ button whose bubble explains one thing in one plain line. It replaces
// hint text under fields and headings. A mouse opens it by hovering (a click
// keeps it while the pointer stays), a keyboard by focusing and a finger by
// tapping; leaving, a second tap, moving focus away or Escape closes it. Only
// this script shows the bubble (no CSS hover rule), so it is always placed:
// fixed-positioned and kept inside the viewport in both directions like the
// other floating panels, so an ⓘ near the edge of a phone never pushes the
// page sideways.
let infoTips = 0;
export function infoTip(text) {
  const tip = node("span", undefined, { class: "info-tip" });
  const bubble = node("span", text, {
    class: "info-tip__bubble",
    role: "tooltip",
    id: `info-tip-${++infoTips}`,
  });
  const button = node("button", "ⓘ", {
    type: "button",
    class: "info-tip__button",
    "aria-label": "More information",
    "aria-describedby": bubble.id,
    "aria-expanded": "false",
  });
  const reasons = new Set();
  const place = () =>
    tip.isConnected
      ? placeFloating(bubble, button, { align: "start", offset: 6, flip: true })
      : closeAll();
  // Escape closes an open bubble wherever focus is (it may have opened on
  // hover), before a drawer or menu around it sees the key.
  const escape = (event) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    closeAll();
  };
  const outside = (event) => {
    if (!tip.contains(event.target)) closeAll();
  };
  const update = () => {
    const open = reasons.size > 0 && tip.isConnected;
    if (open === tip.classList.contains("is-open")) {
      if (open) place();
      return;
    }
    tip.classList.toggle("is-open", open);
    button.setAttribute("aria-expanded", String(open));
    if (open) {
      place();
      window.addEventListener("resize", place);
      window.addEventListener("scroll", place, true);
      document.addEventListener("keydown", escape, true);
      document.addEventListener("pointerdown", outside, true);
    } else {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      document.removeEventListener("keydown", escape, true);
      document.removeEventListener("pointerdown", outside, true);
    }
  };
  const set = (reason, on) => {
    if (on) reasons.add(reason);
    else reasons.delete(reason);
    update();
  };
  const closeAll = () => {
    reasons.clear();
    update();
  };
  button.addEventListener("click", () =>
    reasons.has("tap") ? closeAll() : set("tap", true),
  );
  button.addEventListener("focus", () => {
    if (button.matches(":focus-visible")) set("focus", true);
  });
  button.addEventListener("blur", closeAll);
  tip.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse") set("hover", true);
  });
  tip.addEventListener("pointerleave", (event) => {
    if (event.pointerType !== "mouse") return;
    reasons.delete("tap");
    set("hover", false);
  });
  tip.append(button, bubble);
  return tip;
}

export function downloadHostCsv(items, fields, filename) {
  const cell = (value) => {
    const text = String(value ?? ""),
      safe = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  const csv =
    [fields, ...items.map((item) => fields.map((field) => item[field]))]
      .map((row) => row.map(cell).join(","))
      .join("\r\n") + "\r\n";
  downloadHostTextCsv(csv, filename);
}
export function downloadHostTextCsv(csv, filename) {
  if (typeof csv !== "string" || csv.length > 2097152)
    throw new Error("invalid-export");
  const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    ),
    link = node("a", undefined, { href: url, download: filename });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function field(form, label, name, value = "", type = "text", options) {
  const wrapper = node("label", hostText(label));
  const input = node(options ? "select" : "input", undefined, {
    name,
    "aria-label": label,
  });
  if (options)
    for (const [id, text] of options)
      input.append(node("option", text, { value: id }));
  else {
    input.type = type;
    input.required = true;
    input.maxLength = name === "email" ? 254 : 120;
  }
  input.value = value;
  wrapper.append(input);
  form.append(wrapper);
  // A role choice explains the chosen role in an ⓘ beside the label, not in a
  // second chip that repeats the select.
  if (options && /role/i.test(name)) {
    const holder = node("span");
    const update = () =>
      holder.replaceChildren(infoTip(roleDescription(input.value)));
    input.addEventListener("change", update);
    update();
    labelTip(input, holder);
  }
  return input;
}

// An ⓘ on the label's own line (beside its text), not on a row of its own
// under the field. `tip` is the ⓘ's text, or an element that holds one.
export function labelTip(input, tip) {
  const label = input.closest("label");
  if (!label) return;
  const caption = node("span", undefined, { class: "field-caption" });
  while (label.firstChild && label.firstChild !== input)
    caption.append(label.firstChild);
  caption.append(typeof tip === "string" ? infoTip(tip) : tip);
  label.prepend(caption);
}
