import { createSystemIcon } from "./wifigate-system-icons.js";
import { isRollerShutter, systemKindLabel } from "./wifigate-objects.js";

// Real systems and examples deliberately share this markup and stylesheet.
export function createManagerSystemCard({
  system,
  language = "en",
  actions,
  example = false,
}) {
  const t = (he, en) => (language === "he" ? he : en);
  const card = document.createElement("article");
  card.className = "manager-card manager-system";
  card.dataset.objectKind = isRollerShutter(system) ? "roller-shutter" : system.type || "system";
  const header = document.createElement("div");
  header.className = "manager-system-card-head";
  header.append(createSystemIcon(system));
  if (example) {
    card.dataset.exampleSystem = system.id;
    const badge = document.createElement("span");
    badge.className = "manager-example-badge manager-system-example-badge";
    badge.textContent = t("דוגמה", "Example");
    header.append(badge);
  }
  const heading = document.createElement("h4");
  heading.textContent = system.name;
  const description = document.createElement("span");
  description.className = "manager-muted manager-system-meta";
  const count = new Set(system.systemIds).size;
  const type =
    systemKindLabel(system, "en", {
      gate: "Gate",
      "dual-control": "Dual Control",
      group: "Group",
    }) ?? "System";
  const kind = document.createElement("span");
  kind.className = "manager-system-kind-tag";
  kind.lang = "en";
  kind.dir = "ltr";
  kind.textContent = type;
  const gateCount = document.createElement("span");
  gateCount.className = "manager-system-gate-count";
  gateCount.textContent = `${count} ${count === 1 ? t("שער", "gate") : t("שערים", "gates")}`;
  description.append(kind, gateCount);
  const identity = document.createElement("div");
  identity.className = "manager-system-card-identity";
  identity.append(heading, description);
  card.append(header, identity, actions);
  return card;
}
