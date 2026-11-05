import { createSystemIcon } from "./wifigate-system-icons.js";
import { systemKindLabel } from "./wifigate-objects.js";

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
  card.append(createSystemIcon(system));
  if (example) {
    card.dataset.exampleSystem = system.id;
    const badge = document.createElement("span");
    badge.className = "manager-example-badge manager-system-example-badge";
    badge.textContent = t("דוגמה", "Example");
    card.append(badge);
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
  card.append(heading, description, actions);
  return card;
}
