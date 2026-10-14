// Floating panels: the product pill, the organization card, the account menu
// and the ⓘ bubbles. A panel is fixed-positioned next to its anchor and kept
// inside the viewport with 16px gutters, so it never adds a sideways scroll
// on a phone.
const gutter = 16;
let openPopover;

// Places a fixed panel under its anchor (above it with flip when there is no
// room below), aligned to the anchor's start, end or centre in the page
// direction, then clamped inside the viewport.
export function placeFloating(
  panel,
  anchor,
  { align = "center", offset = 8, flip = false, fitHeight = false } = {},
) {
  const rect = anchor.getBoundingClientRect();
  const viewport = document.documentElement.clientWidth;
  // Only left/top place the panel. A right or bottom inset left set (a
  // logical inset is `right` in Hebrew) would over-constrain the box, and an
  // RTL box then drops `left`, so the clamp below would have no effect.
  panel.style.right = "auto";
  panel.style.bottom = "auto";
  // Where left/top 0 lands: a transformed ancestor (the phone drawer) moves
  // the origin of a fixed panel away from the viewport's corner.
  panel.style.left = "0px";
  panel.style.top = "0px";
  const origin = panel.getBoundingClientRect();
  const width = Math.min(panel.offsetWidth, viewport - gutter * 2);
  const rtl = getComputedStyle(anchor).direction === "rtl";
  const side =
    align === "center" ? "center" : (align === "end") !== rtl ? "right" : "left";
  let left =
    side === "center"
      ? rect.left + rect.width / 2 - width / 2
      : side === "right"
        ? rect.right - width
        : rect.left;
  left = Math.min(Math.max(left, gutter), viewport - gutter - width);
  let top = rect.bottom + offset;
  if (flip) {
    const height = panel.offsetHeight;
    if (
      top + height > innerHeight - gutter &&
      rect.top - offset - height >= gutter
    )
      top = rect.top - offset - height;
  }
  panel.style.left = `${Math.round(left - origin.left)}px`;
  panel.style.top = `${Math.round(top - origin.top)}px`;
  if (fitHeight)
    panel.style.maxHeight = `${Math.max(
      160,
      Math.round(innerHeight - rect.bottom - offset - gutter),
    )}px`;
}

// A button that opens a floating panel under it. Escape (on the panel or the
// button), a click outside, or focus leaving the panel closes it. Only one
// panel is open at a time.
export function attachPopover(
  button,
  panel,
  { align = "center", anchor = button, focus, onOpen, onClose } = {},
) {
  panel.hidden = true;
  button.setAttribute("aria-expanded", "false");

  const place = () => placeFloating(panel, anchor, { align, fitHeight: true });
  function outside(event) {
    if (!panel.contains(event.target) && !button.contains(event.target))
      close();
  }
  function open() {
    if (!panel.hidden) return;
    if (openPopover && openPopover !== api) openPopover.close();
    panel.hidden = false;
    button.setAttribute("aria-expanded", "true");
    place();
    document.addEventListener("pointerdown", outside, true);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    openPopover = api;
    onOpen?.();
    (focus?.() ?? panel).focus?.();
  }
  function close(returnFocus = false) {
    if (panel.hidden) return;
    panel.hidden = true;
    button.setAttribute("aria-expanded", "false");
    document.removeEventListener("pointerdown", outside, true);
    window.removeEventListener("resize", place);
    window.removeEventListener("scroll", place, true);
    if (openPopover === api) openPopover = undefined;
    onClose?.();
    if (returnFocus) button.focus();
  }
  function escape(event) {
    if (event.key !== "Escape" || panel.hidden) return;
    event.preventDefault();
    event.stopPropagation();
    close(true);
  }
  button.addEventListener("click", () => (panel.hidden ? open() : close(true)));
  button.addEventListener("keydown", escape);
  panel.addEventListener("keydown", escape);
  panel.addEventListener("focusout", (event) => {
    if (
      event.relatedTarget &&
      !panel.contains(event.relatedTarget) &&
      event.relatedTarget !== button
    )
      close();
  });
  const api = {
    open,
    close,
    place,
    get isOpen() {
      return !panel.hidden;
    },
  };
  return api;
}

// The first action in a panel: a shown, rendered and enabled button or link.
// Items hidden by CSS at this width are skipped, and so is anything that is
// only focusable to explain itself (a role chip with its tooltip), so a menu
// never opens on a tooltip covering its first action.
export function firstFocusable(panel) {
  return [...panel.querySelectorAll("button, a[href]")].find(
    (element) =>
      !element.hidden &&
      !element.disabled &&
      element.tabIndex >= 0 &&
      element.getClientRects().length > 0,
  );
}
