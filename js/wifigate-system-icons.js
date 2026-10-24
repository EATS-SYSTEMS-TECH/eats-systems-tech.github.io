// The WIFIGATE artwork is shared with Host and the mobile icon catalogue.
// Keep filenames allowlisted: API metadata must never become an arbitrary URL.
export const systemIconCatalog = Object.freeze({
  gate: Object.freeze([
    "barrier-gate-small", "swing-gate-small", "cantilever-gate-small",
    "garage-small", "door-small", "electromagnetic-lock-small", "pump-small",
    "light-small", "home-outline", "business-outline", "bed-outline",
  ]),
  "dual-control": Object.freeze([
    "door-small", "barrier-gate-small", "swing-gate-small",
    "cantilever-gate-small", "garage-small", "roller-shutter-small",
    "electromagnetic-lock-small", "pump-small", "light-small",
  ]),
  group: Object.freeze([
    "folder", "family", "home", "residence", "office", "shop", "entrance",
    "garage", "barrier", "hosting", "gym",
  ]),
});
const defaults = Object.freeze({
  gate: "door-small", "dual-control": "barrier-gate-small", group: "folder",
});
export function systemIconSrc(system = {}) {
  const type = Object.hasOwn(systemIconCatalog, system?.type) ? system.type : "gate";
  const icon = systemIconCatalog[type].includes(system?.iconId)
    ? system.iconId : defaults[type];
  return `/assets/host-icons/${type}-${icon}.svg`;
}
export function createSystemIcon(system, className = "manager-icon") {
  const holder = document.createElement("span");
  holder.className = className;
  holder.setAttribute("aria-hidden", "true");
  const image = document.createElement("img");
  image.src = systemIconSrc(system);
  image.alt = "";
  image.width = 40;
  image.height = 40;
  image.addEventListener("error", () => {
    const fallback = systemIconSrc({ type: system?.type });
    if (image.getAttribute("src") !== fallback) image.src = fallback;
  }, { once: true });
  holder.append(image);
  return holder;
}
