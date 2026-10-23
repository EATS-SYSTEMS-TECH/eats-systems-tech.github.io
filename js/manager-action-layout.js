// Organize controls once during rendering. Record-specific buttons remain
// attached to their rows; no observers or visual-only CSS reordering are used.
export function placeManagerActions(container, language = "en") {
  let panel = [...container.children].find(child =>
    child.classList.contains("manager-action-panel"),
  );
  const controls = [...container.children].filter(child =>
    child !== panel && child.matches(
      "form, button, input, label, .manager-actions, .manager-record-editor, .manager-note, .manager-example-selection, [data-manager-action]",
    ),
  );
  if (!controls.length && !panel) return;
  if (!panel) {
    panel = document.createElement("section");
    panel.className = "manager-action-panel";
    const label = language === "he" ? "פעולות ניהול" : "Management actions";
    panel.setAttribute("aria-label", label);
    const title = document.createElement("h4");
    title.className = "manager-actions-title";
    title.textContent = label;
    panel.append(title);
  }
  panel.append(...controls);
  const heading = [...container.children].find(child => child.matches("h2,h3"));
  container.prepend(panel);
  if (heading) container.prepend(heading);
}
