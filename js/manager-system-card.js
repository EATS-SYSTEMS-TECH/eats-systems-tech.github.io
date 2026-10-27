import { createSystemIcon } from "./wifigate-system-icons.js";

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
  description.className = "manager-muted";
  const count = new Set(system.systemIds).size;
  const type =
    {
      gate: t("שער", "Gate"),
      "dual-control": t("שליטה כפולה", "Dual Control"),
      group: t("קבוצה", "Group"),
    }[system.type] ?? t("מערכת", "System");
  description.textContent = `${type} · ${count} ${count === 1 ? t("שער", "gate") : t("שערים", "gates")}`;
  card.append(heading, description, actions);
  return card;
}
