/** Fit large screenshots to the dialog, with a scrollable native-size view. */
export function managerGuideImageContent(image, language = "en") {
  const he = language === "he";
  const content = document.createElement("div");
  content.className = "manager-guide-image-content";
  const tools = document.createElement("div");
  tools.className = "manager-guide-image-tools";
  const hint = document.createElement("span");
  hint.textContent = he ? "הצילום מותאם לחלון. אפשר להגדיל ולגלול לפרטים." : "Fit to window. View at full size and scroll to inspect details.";
  const zoom = document.createElement("button");
  zoom.type = "button";
  zoom.className = "manager-button";
  zoom.textContent = he ? "הגדלה ל־100%" : "View at 100%";
  zoom.setAttribute("aria-pressed", "false");
  const frame = document.createElement("div");
  frame.className = "manager-setup-image-frame";
  frame.tabIndex = 0;
  frame.setAttribute("aria-label", he ? "צילום מסך — השתמשו בחצים לגלילה בתצוגה מוגדלת" : "Screenshot — use arrow keys to scroll the enlarged view");
  const preview = document.createElement("img");
  preview.className = "manager-setup-image-preview";
  preview.src = image.src;
  preview.alt = image.alt;
  zoom.addEventListener("click", () => {
    const enlarged = frame.classList.toggle("is-zoomed");
    zoom.setAttribute("aria-pressed", String(enlarged));
    zoom.textContent = enlarged ? he ? "התאמה לחלון" : "Fit to window" : he ? "הגדלה ל־100%" : "View at 100%";
  });
  frame.append(preview);
  tools.append(hint, zoom);
  content.append(tools, frame);
  return content;
}
