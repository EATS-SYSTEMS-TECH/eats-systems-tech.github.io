import { managerUiIcon } from "./manager-ui-icons.js";

const node = (tag, text, className) => {
  const element = document.createElement(tag);
  if (text) element.textContent = text;
  if (className) element.className = className;
  return element;
};

/** Reading a guide never executes the operation it describes. */
export function attachManagerGuideNavigation({ guide, steps, language, labels, completionText }) {
  const t = (he, en) => language === "he" ? he : en;
  const count = steps.children.length;
  const journey = node("section", undefined, "manager-setup-journey");
  journey.setAttribute("aria-label", t("התקדמות במדריך", "Guide progress"));
  const heading = node("div", undefined, "manager-setup-journey-heading");
  const status = node("span");
  heading.append(node("strong", t("צעד אחר צעד, בדרך שלכם", "One step at a time")), status);
  const meter = node("progress", undefined, "manager-setup-meter");
  meter.max = count;
  meter.setAttribute("aria-label", t("התקדמות בשלבי ההדרכה", "Guide step progress"));
  const markers = node("div", undefined, "manager-setup-markers");
  const buttons = [...steps.children].map((step, index) => {
    const button = node("button");
    button.type = "button";
    button.setAttribute("aria-label", t(`שלב ${index + 1}: `, `Step ${index + 1}: `) + step.querySelector(".manager-setup-step-copy strong").textContent);
    button.append(node("span", String(index + 1), "manager-setup-marker-number"), node("span", labels[index], "manager-setup-marker-label"));
    button.addEventListener("click", () => select(index, true));
    markers.append(button);
    return button;
  });
  journey.append(heading, meter, markers);

  const completion = node("div", undefined, "manager-setup-completion");
  const celebration = node("span", undefined, "manager-setup-celebration");
  celebration.setAttribute("aria-hidden", "true");
  celebration.append(managerUiIcon("check"));
  for (let i = 0; i < 8; i++) {
    const spark = node("i");
    spark.style.setProperty("--spark", i);
    celebration.append(spark);
  }
  const copy = node("div");
  copy.append(node("strong", t("כל הכבוד, סיימתם את המדריך!", "Nicely done — guide complete!")), node("p", completionText));
  completion.append(celebration, copy);
  steps.lastElementChild.prepend(completion);

  const controls = node("div", undefined, "manager-setup-controls");
  const previous = node("button", undefined, "manager-setup-previous");
  const next = node("button", undefined, "manager-setup-next");
  previous.type = next.type = "button";
  if (steps.id) { previous.setAttribute("aria-controls", steps.id); next.setAttribute("aria-controls", steps.id); }
  previous.append(managerUiIcon("previous"), node("span", t("הקודם", "Previous")));
  const progress = node("span", undefined, "manager-setup-progress");
  progress.setAttribute("role", "status");
  progress.setAttribute("aria-live", "polite");
  let selected = 0;
  function select(index, scroll = false) {
    if (index < 0 || index >= count) return;
    selected = index;
    const finished = index === count - 1;
    guide.dataset.guideComplete = String(finished);
    meter.value = index + 1;
    const text = t(`שלב ${index + 1} מתוך ${count}`, `Step ${index + 1} of ${count}`);
    meter.setAttribute("aria-valuetext", text);
    status.textContent = finished ? t(`${count} מתוך ${count} · השלב האחרון`, `${count} of ${count} · Final step`) : text;
    progress.textContent = text;
    buttons.forEach((button, i) => {
      if (i === index) button.setAttribute("aria-current", "step"); else button.removeAttribute("aria-current");
      button.classList.toggle("is-complete", i < index || finished);
    });
    [...steps.children].forEach((step, i) => { step.hidden = i !== index; });
    for (const image of steps.children[index].querySelectorAll("img")) image.loading = "eager";
    previous.disabled = index === 0;
    next.replaceChildren(node("span", finished ? t("סיום המדריך", "Finish guide") : t("הבא", "Next")), managerUiIcon(finished ? "check" : "next"));
    if (previous.disabled && document.activeElement === previous) next.focus({ preventScroll: true });
    if (scroll) journey.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }
  previous.addEventListener("click", () => select(selected - 1, true));
  next.addEventListener("click", () => {
    if (selected < count - 1) select(selected + 1, true);
    else { guide.open = false; select(0); guide.querySelector("summary").focus(); }
  });
  controls.append(previous, progress, next);
  guide.classList.add("manager-setup-wizard");
  guide.append(journey, steps, controls);
  select(0);
}
