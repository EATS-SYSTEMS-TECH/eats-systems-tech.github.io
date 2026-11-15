import { createManagerSectionHeading } from "./manager-section-heading.js";

const node = (tag, text, className) => {
  const value = document.createElement(tag);
  if (text !== undefined) value.textContent = text;
  if (className) value.className = className;
  return value;
};
export const managerDefaultTimings = Object.freeze({pulseWidth1Millis:5000,timeBetweenPulses1Seconds:5,pulseWidth2Millis:5000,timeBetweenPulses2Seconds:5,pulseWidth3Millis:5000});
export const managerOpeningMethods = Object.freeze([
  "PULSE", "PULSE_AFTER_PULSE", "PULSE_AFTER_PULSE_AFTER_PULSE", "TOGGLE", "PUSH_BUTTON",
]);
const timing = ["pulseWidth1Millis", "timeBetweenPulses1Seconds", "pulseWidth2Millis", "timeBetweenPulses2Seconds", "pulseWidth3Millis"];
// The gate stores pulses in milliseconds; people see and type seconds only.
const isPulse = key => !key.startsWith("timeBetween");
export function managerMillisToSeconds(millis) {
  return Number.isFinite(Number(millis)) ? String(Number((Number(millis) / 1000).toFixed(3))) : "";
}
// "3.2", "3,2" or "0.5" seconds -> milliseconds text; anything else is invalid.
export function managerSecondsToMillis(text) {
  const value = String(text ?? "").trim().replace(",", ".");
  return /^\d+(\.\d{1,3})?$/.test(value) ? String(Math.round(Number(value) * 1000)) : "NaN";
}
const shown = (key, value) => isPulse(key) ? managerMillisToSeconds(value) : String(value);
export function managerTimingFields(method) {
  return timing.slice(0, ({ PULSE: 1, PULSE_AFTER_PULSE: 3, PULSE_AFTER_PULSE_AFTER_PULSE: 5 })[method] ?? 0);
}
export function managerSettingsPayload(saved, draft, revision) {
  if (!managerOpeningMethods.includes(draft.command)) throw new Error("INVALID_CONFIG");
  const active = managerTimingFields(draft.command);
  const payload = { command: draft.command, expectedRevision: revision };
  for (const key of timing) {
    const value = Number(active.includes(key) ? draft[key] : saved[key]);
    const delay = key.startsWith("timeBetween");
    if (!Number.isInteger(value) || value < (delay ? 1 : 500) || value > (delay ? 300 : 60000)) throw new Error("INVALID_CONFIG");
    payload[key] = value;
  }
  return payload;
}
export function renderManagerSettings({ root, language = "en", config, revision, onSave, confirm, errorText, isCurrent = () => true, commandLocked = false, rollerShutter = false }) {
  config = {command:"PULSE",...managerDefaultTimings,...config};
  const he = language === "he", t = (h, e) => he ? h : e;
  root.append(createManagerSectionHeading({title:t("הגדרות המערכת", "System settings"),description:t("התאימו את אופן הפתיחה ואת תזמון הפעולה לשער שלכם.", "Adjust the opening method and action timing for your gate."),icon:"settings"}));
  const form = node("form", undefined, "manager-form manager-settings-form");
  const methodCard = node("section", undefined, "manager-settings-card");
  const heading = createManagerSectionHeading({title:t("אופן פתיחה", "Opening method"),icon:"gate",level:"h4"});
  const picker = node("label", t("בחירת אופן פתיחה", "Choose an opening method"), "manager-method-dropdown");
  const choices = {
    PULSE: [t("פולס אחד", "Single pulse"), t("פולס יחיד להפעלת המערכת.", "A single pulse activates the system.")],
    PULSE_AFTER_PULSE: [t("שני פולסים", "Two pulses"), t("שני פולסים עם השהיה ביניהם.", "Two pulses with a delay between them.")],
    PULSE_AFTER_PULSE_AFTER_PULSE: [t("שלושה פולסים", "Three pulses"), t("שלושה פולסים עם שתי השהיות.", "Three pulses with two delays.")],
    TOGGLE: ["Toggle", t("מעבר בין מצב פעיל לכבוי. אין צורך בהגדרת פולסים.", "Switch between on and off. No pulse timings are needed.")],
    PUSH_BUTTON: ["Push button", t("הפעלה במשך הלחיצה ושחרור בסיומה. אין צורך בהגדרת פולסים.", "Activate while pressed and release afterwards. No pulse timings are needed.")],
  };
  const select = node("select");select.name="command";select.disabled=commandLocked;select.setAttribute("aria-label",t("בחירת אופן פתיחה","Choose an opening method"));
  for(const method of managerOpeningMethods){const option=node("option",choices[method][0]);option.value=method;select.append(option);}
  select.value=config.command;picker.append(select);
  const selectedMethod=()=>select.value;
  const description = node("p", "", "manager-supporting-copy");
  description.id="manager-opening-method-description";
  select.setAttribute("aria-describedby",description.id);
  description.setAttribute("aria-live", "polite");
  methodCard.append(heading, node("p", t("בחרו כיצד המערכת מגיבה לפקודת פתיחה.", "Choose how the system responds to an opening command."), "manager-supporting-copy"), picker, description);
  if (commandLocked) methodCard.append(node("p", rollerShutter
    ? t("בתריס חשמלי אופן הפתיחה נקבע לפי ההגדרה המשותפת.", "In a Roller Shutter, the opening method follows the shared configuration.")
    : t("במערכת Dual Control אופן הפתיחה נקבע לפי ההגדרה המשותפת.", "In Dual Control, the opening method follows the shared configuration."), "manager-supporting-copy"));
  const preview = node("ol", undefined, "manager-method-preview");
  preview.setAttribute("aria-label", t("סדר הפעולה", "Action sequence"));
  methodCard.append(preview);
  const card = node("section", undefined, "manager-settings-card manager-timing-card");
  card.append(createManagerSectionHeading({title:t("תזמון הפעולה", "Action timing"),description:t("מוצגים רק השלבים של אופן הפתיחה שבחרתם.", "Only the steps for your chosen opening method are shown."),icon:"history",level:"h4"}));
  const fields = node("div", undefined, "manager-timing-fields");
  const labels = {
    pulseWidth1Millis: t("משך פולס ראשון (שניות)", "First pulse (seconds)"),
    timeBetweenPulses1Seconds: t("השהיה ראשונה (שניות)", "First delay (seconds)"),
    pulseWidth2Millis: t("משך פולס שני (שניות)", "Second pulse (seconds)"),
    timeBetweenPulses2Seconds: t("השהיה שנייה (שניות)", "Second delay (seconds)"),
    pulseWidth3Millis: t("משך פולס שלישי (שניות)", "Third pulse (seconds)"),
  };
  for (const [index, key] of timing.entries()) {
    const step = node("section", undefined, "manager-timing-step");
    step.append(node("span", t(`שלב ${index + 1}`, `Step ${index + 1}`), "manager-timing-step-number"));
    const label = node("label", labels[key]);
    const input = node("input");
    input.name = key; input.type = "number"; input.step = isPulse(key) ? "any" : "1";
    if (isPulse(key)) input.inputMode = "decimal";
    input.setAttribute("aria-label", labels[key]);
    input.min = key.startsWith("timeBetween") ? "1" : "0.5";
    input.max = key.startsWith("timeBetween") ? "300" : "60";
    input.value = shown(key, config[key]); input.required = true;
    const control = node("span", undefined, "manager-timing-control");
    const unit = node("span", t("שניות", "sec"), "manager-timing-unit");
    unit.setAttribute("aria-hidden", "true");
    input.dir = "ltr";
    control.append(input, unit); label.append(control);
    const help = node("p", key.startsWith("timeBetween") ? t("טווח מותר: 1 עד 300 שניות", "Allowed range: 1 to 300 seconds") : t("טווח מותר: 0.5 עד 60 שניות, למשל 3.2", "Allowed range: 0.5 to 60 seconds, for example 3.2"), "manager-timing-range");
    help.id = `manager-settings-help-${key}`;
    input.setAttribute("aria-describedby", help.id);
    step.append(label, help); fields.append(step);
  }
  card.append(fields);
  const feedback = node("p", "", "manager-dialog-error"); feedback.setAttribute("role", "alert"); feedback.hidden = true;
  const save = node("button", t("שמירת הגדרות", "Save settings"), "manager-button primary"); save.type = "submit";
  const reset = node("button", t("ביטול שינויים", "Reset changes"), "manager-button"); reset.type = "button";
  const footer = node("footer", undefined, "manager-settings-footer");
  const state = node("p", "", "manager-settings-draft-state"); state.setAttribute("role", "status");
  const actions = node("div", undefined, "manager-settings-save-actions"); actions.append(save, reset);
  footer.append(state, actions, node("p", t("השינויים יישלחו למערכת לאחר אישורכם.", "Changes are sent to the system after your confirmation."), "manager-settings-save-note"));
  const progress = node("p", t("שומר את ההגדרות וממתין לאישור המערכת…", "Saving settings and waiting for system confirmation…"), "manager-supporting-copy"); progress.hidden = true; progress.setAttribute("role", "status");
  let busy = false, disposed = false;
  function sync() {
    const method = selectedMethod(), active = managerTimingFields(method);
    preview.replaceChildren(...active.map((key, index) => {
      const item = node("li");
      // The step value carries the unit; the label drops its "(seconds)" note.
      item.append(node("span", String(index + 1)), node("strong", labels[key].replace(/ \((שניות|seconds)\)$/, "")), node("bdi", `${form.elements[key].value || "—"} ${t("שניות", "sec")}`));
      return item;
    }));
    preview.hidden = !active.length;
    description.textContent = choices[method]?.[1] ?? t("אופן הפתיחה לא זמין.", "Opening method unavailable.");
    card.hidden = active.length === 0;
    select.disabled = busy || commandLocked;
    for (const key of timing) {
      const input = form.elements[key];
      input.closest(".manager-timing-step").hidden = !active.includes(key);
      input.disabled = busy || !active.includes(key);
    }
    const dirty = method !== config.command || active.some(key => form.elements[key].value !== shown(key, config[key]));
    state.textContent = dirty ? t("יש שינויים שטרם נשמרו", "You have unsaved changes") : t("מציגים את ההגדרות שנטענו מהמערכת", "Showing settings loaded from the system");
    state.dataset.dirty = String(dirty);
    reset.disabled = busy || !dirty;
  }
  form.append(methodCard, card, feedback, progress, footer); root.append(form);
  form.addEventListener("input", sync);
  form.addEventListener("change", sync);
  reset.addEventListener("click", () => {
    if (busy || disposed || !isCurrent()) return;
    select.value = config.command;
    timing.forEach(key => { form.elements[key].value = shown(key, config[key]); });
    feedback.hidden = true; sync();
    (!select.disabled ? select : form.querySelector('.manager-timing-fields input:not(:disabled)'))?.focus();
  });
  sync();
  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (busy || disposed || !isCurrent()) return;
    const draft = Object.fromEntries(timing.map(key => [key, isPulse(key) ? managerSecondsToMillis(form.elements[key].value) : form.elements[key].value])); draft.command = selectedMethod();
    try {
      const payload = managerSettingsPayload(config, draft, revision);
      if (commandLocked && payload.command !== config.command) throw new Error("INVALID_CONFIG");
      busy = true; save.disabled = true; sync(); feedback.hidden = true;
      if (!(await confirm(t("לשנות את הגדרות השער?", "Change gate settings?")))) return;
      if (disposed || !isCurrent()) return;
      form.setAttribute("aria-busy", "true"); progress.hidden = false;
      save.classList.add("is-loading"); save.setAttribute("aria-busy", "true");
      await onSave(payload);
    } catch (error) {
      if (!disposed && isCurrent()) { feedback.textContent = errorText(error); feedback.hidden = false; }
    } finally {
      busy = false; save.disabled = false; progress.hidden = true; form.removeAttribute("aria-busy"); sync();
      save.classList.remove("is-loading"); save.removeAttribute("aria-busy");
      if (!disposed && isCurrent() && form.isConnected && document.activeElement === document.body && !document.querySelector("dialog[open]")) save.focus({ preventScroll: true });
    }
  });
  return { dispose() { disposed = true; } };
}
