const node = (tag, text, className) => {
  const value = document.createElement(tag);
  if (text !== undefined) value.textContent = text;
  if (className) value.className = className;
  return value;
};
export const managerOpeningMethods = Object.freeze([
  "PULSE", "PULSE_AFTER_PULSE", "PULSE_AFTER_PULSE_AFTER_PULSE", "TOGGLE", "PUSH_BUTTON",
]);
const timing = ["pulseWidth1Millis", "timeBetweenPulses1Seconds", "pulseWidth2Millis", "timeBetweenPulses2Seconds", "pulseWidth3Millis"];
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
export function renderManagerSettings({ root, language = "en", config, revision, onSave, confirm, errorText, isCurrent = () => true, commandLocked = false }) {
  const he = language === "he", t = (h, e) => he ? h : e;
  const form = node("form", undefined, "manager-form manager-settings-form");
  const methodCard = node("section", undefined, "manager-settings-card");
  const heading = node("h3", t("אופן פתיחה", "Opening method"));
  const select = node("select");
  select.name = "command";
  select.setAttribute("aria-label", t("אופן פתיחה", "Opening method"));
  const choices = {
    PULSE: [t("פולס אחד", "Single pulse"), t("פולס יחיד להפעלת המערכת.", "A single pulse activates the system.")],
    PULSE_AFTER_PULSE: [t("שני פולסים", "Two pulses"), t("שני פולסים עם השהיה ביניהם.", "Two pulses with a delay between them.")],
    PULSE_AFTER_PULSE_AFTER_PULSE: [t("שלושה פולסים", "Three pulses"), t("שלושה פולסים עם שתי השהיות.", "Three pulses with two delays.")],
    TOGGLE: ["Toggle", t("מעבר בין מצב פעיל לכבוי. אין צורך בהגדרת פולסים.", "Switch between on and off. No pulse timings are needed.")],
    PUSH_BUTTON: ["Push button", t("הפעלה במשך הלחיצה ושחרור בסיומה. אין צורך בהגדרת פולסים.", "Activate while pressed and release afterwards. No pulse timings are needed.")],
  };
  for (const method of managerOpeningMethods) select.append(new Option(choices[method][0], method));
  select.value = config.command;
  select.disabled = commandLocked;
  const description = node("p", "", "manager-supporting-copy");
  description.setAttribute("aria-live", "polite");
  methodCard.append(heading, select, description);
  if (commandLocked) methodCard.append(node("p", t("במערכת Dual Control אופן הפתיחה נקבע לפי ההגדרה המשותפת.", "In Dual Control, the opening method follows the shared configuration."), "manager-supporting-copy"));
  const card = node("section", undefined, "manager-settings-card manager-timing-card");
  card.append(node("h3", t("תזמון הפעולה", "Action timing")), node("p", t("מוצגים רק השלבים שמשמשים את אופן הפתיחה שבחרתם.", "Only the steps used by your chosen opening method are shown."), "manager-supporting-copy"));
  const fields = node("div", undefined, "manager-timing-fields");
  const labels = {
    pulseWidth1Millis: t("משך פולס ראשון (מילישניות)", "First pulse (ms)"),
    timeBetweenPulses1Seconds: t("השהיה ראשונה (שניות)", "First delay (seconds)"),
    pulseWidth2Millis: t("משך פולס שני (מילישניות)", "Second pulse (ms)"),
    timeBetweenPulses2Seconds: t("השהיה שנייה (שניות)", "Second delay (seconds)"),
    pulseWidth3Millis: t("משך פולס שלישי (מילישניות)", "Third pulse (ms)"),
  };
  for (const key of timing) {
    const label = node("label", labels[key]);
    const input = node("input");
    input.name = key; input.type = "number"; input.step = "1";
    input.min = key.startsWith("timeBetween") ? "1" : "500";
    input.max = key.startsWith("timeBetween") ? "300" : "60000";
    input.value = config[key]; input.required = true;
    label.append(input); fields.append(label);
  }
  card.append(fields);
  const feedback = node("p", "", "manager-dialog-error"); feedback.setAttribute("role", "alert"); feedback.hidden = true;
  const save = node("button", t("שמירת הגדרות", "Save settings"), "manager-button primary"); save.type = "submit";
  const progress = node("p", t("שומר את ההגדרות וממתין לאישור המערכת…", "Saving settings and waiting for system confirmation…"), "manager-supporting-copy"); progress.hidden = true; progress.setAttribute("role", "status");
  let busy = false, disposed = false;
  function sync() {
    const active = managerTimingFields(select.value);
    description.textContent = choices[select.value]?.[1] ?? "";
    card.hidden = active.length === 0;
    for (const key of timing) {
      const input = form.elements[key];
      input.closest("label").hidden = !active.includes(key);
      input.disabled = busy || !active.includes(key);
    }
  }
  form.append(methodCard, card, feedback, progress, save); root.append(form);
  select.addEventListener("change", sync); sync();
  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (busy || disposed || !isCurrent()) return;
    const draft = Object.fromEntries(timing.map(key => [key, form.elements[key].value])); draft.command = select.value;
    try {
      const payload = managerSettingsPayload(config, draft, revision);
      if (commandLocked && payload.command !== config.command) throw new Error("INVALID_CONFIG");
      busy = true; save.disabled = true; select.disabled = true; sync(); feedback.hidden = true;
      if (!(await confirm(t("לשנות את הגדרות השער?", "Change gate settings?")))) return;
      if (disposed || !isCurrent()) return;
      form.setAttribute("aria-busy", "true"); progress.hidden = false;
      await onSave(payload);
    } catch (error) {
      if (!disposed && isCurrent()) { feedback.textContent = errorText(error); feedback.hidden = false; }
    } finally {
      busy = false; save.disabled = false; select.disabled = commandLocked; progress.hidden = true; form.removeAttribute("aria-busy"); sync();
    }
  });
  return { dispose() { disposed = true; } };
}
