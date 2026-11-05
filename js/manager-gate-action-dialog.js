const node = (tag, text, className) => {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
};
let dialogId = 0;

// Presentation only. The caller alone sends a command and settles its result.
export function createManagerGateActionDialog({ language = "en", host = document.body } = {}) {
  const t = (he, en) => language === "he" ? he : en;
  let active;
  function cancel() { active?.close(); }
  function open({ systemName, gate, simulation = false }) {
    cancel();
    const previous = document.activeElement;
    const dialog = node("dialog", undefined, "manager-gate-action-dialog");
    dialog.tabIndex = -1;
    const id = `manager-gate-action-${++dialogId}`;
    dialog.dir = language === "he" ? "rtl" : "ltr";
    dialog.setAttribute("aria-labelledby", id + "-title");
    dialog.setAttribute("aria-describedby", id + "-detail");
    const header = node("header", undefined, "manager-gate-action-header");
    const identity = node("div");
    identity.append(node("span", "WIFIGATE MANAGER", "manager-gate-action-brand"), node("strong", systemName));
    const closeButton = node("button", "×", "manager-gate-action-close");
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", t("סגירה", "Close"));
    header.append(identity, closeButton);
    const status = node("div", undefined, "manager-gate-action-status");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    status.setAttribute("aria-atomic", "true");
    const art = node("div", undefined, "manager-gate-action-art");
    art.setAttribute("aria-hidden", "true");
    const title = node("h2");
    title.id = id + "-title";
    const detail = node("p");
    detail.id = id + "-detail";
    status.append(art, title, detail);
    const target = node("p", `${t("השער הנבחר", "Selected gate")} · ${gate}`, "manager-gate-action-target");
    const choices = node("fieldset", undefined, "manager-gate-action-choices");
    choices.hidden = true;
    const footer = node("footer", undefined, "manager-gate-action-footer");
    const dismiss = node("button", t("ביטול", "Cancel"), "manager-button");
    const confirm = node("button", t("אישור פתיחה", "Confirm opening"), "manager-button primary");
    dismiss.type = confirm.type = "button";
    confirm.hidden = true;
    footer.append(dismiss, confirm);
    dialog.append(header, status, target, choices);
    if (simulation) dialog.append(node("p", t("הדגמה בלבד · לא יופעל שער פיזי", "Simulation only · no physical gate will be activated"), "manager-gate-action-simulation"));
    dialog.append(footer);
    let decision, selected, toggle = false;
    const operation = {
      get active() { return active === operation; },
      close() {
        if (!operation.active) return;
        active = undefined;
        decision?.(null);
        decision = undefined;
        dialog.close();
        dialog.remove();
        if (previous?.isConnected && !previous.disabled) previous.focus({ preventScroll: true });
      },
      confirm({ toggle: isToggle = false } = {}) {
        if (!operation.active) return Promise.resolve(null);
        toggle = isToggle;
        setState("confirm", toggle ? t("בחרו את מצב השער", "Choose the gate state") : t("לפתוח את השער?", "Open the gate?"), t("הפקודה תישלח רק לאחר האישור שלכם.", "The command will be sent only after your confirmation."));
        confirm.hidden = false;
        confirm.disabled = toggle;
        confirm.textContent = toggle ? t("אישור ושליחה", "Confirm and send") : t("אישור פתיחה", "Confirm opening");
        if (toggle) {
          choices.hidden = false;
          choices.append(node("legend", t("מצב מבוקש", "Requested state")));
          for (const state of ["ON", "OFF"]) {
            const label = node("label");
            const input = node("input");
            input.type = "radio";
            input.name = id + "-state";
            input.value = state;
            input.addEventListener("change", () => { selected = state; confirm.disabled = false; });
            const text = node("span", state);
            text.dir = "ltr";
            label.append(input, text);
            choices.append(label);
          }
        }
        return new Promise(resolve => { decision = resolve; });
      },
      wait() {
        if (!operation.active) return;
        setState("waiting", t("ממתינים לאישור מהמערכת", "Waiting for system confirmation"), t("בקשת הפתיחה נשלחת. אין צורך ללחוץ שוב.", "Sending the opening request. There is no need to select it again."));
        choices.hidden = confirm.hidden = true;
        dismiss.disabled = closeButton.disabled = true;
        dismiss.textContent = t("ממתינים לאישור…", "Waiting for confirmation…");
        dialog.focus({ preventScroll: true });
      },
      success() {
        if (!operation.active) return;
        setState("success", simulation ? t("הפעולה הושלמה בהדגמה", "Simulation completed") : t("המערכת אישרה את הפעולה", "The system confirmed the action"), simulation ? t("זהו אישור מדומה. לא הופעל שער פיזי.", "This is a simulated confirmation. No physical gate was activated.") : t("התקבל אישור מהשער עבור הפקודה שנשלחה.", "The gate acknowledged the command that was sent."));
        finish();
      },
      fail({ message, uncertain = false, sent = false }) {
        if (!operation.active) return;
        setState(uncertain ? "uncertain" : "failure", uncertain ? t("לא התקבל אישור מהמערכת", "No system confirmation received") : sent ? t("הפעולה לא אושרה", "The action was not approved") : t("הפעולה לא נשלחה", "The action was not sent"), uncertain ? t("לא ניתן לדעת אם הפעולה בוצעה. בדקו את מצב השער או את ההיסטוריה לפני ניסיון נוסף.", "The result is unknown. Check the gate or its history before trying again.") : message);
        finish();
      },
    };
    function finish() {
      confirm.hidden = choices.hidden = true;
      dismiss.disabled = closeButton.disabled = false;
      dismiss.textContent = t("סגירה", "Close");
      dismiss.focus({ preventScroll: true });
    }
    function setState(state, heading, description) {
      dialog.dataset.state = state;
      title.textContent = heading;
      detail.textContent = description;
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      for (const [key, value] of Object.entries({ viewBox: "0 0 64 64", fill: "none", stroke: "currentColor", "stroke-width": "3", "stroke-linecap": "round", "stroke-linejoin": "round" })) svg.setAttribute(key, value);
      const ring = document.createElementNS(svg.namespaceURI, "circle");
      for (const [key, value] of Object.entries({ cx: "32", cy: "32", r: "27", class: "manager-gate-action-ring" })) ring.setAttribute(key, value);
      const mark = document.createElementNS(svg.namespaceURI, "path");
      mark.setAttribute("class", "manager-gate-action-mark");
      mark.setAttribute("d", state === "success" ? "m20 33 8 8 17-19" : state === "failure" ? "m23 23 18 18m0-18-18 18" : state === "uncertain" ? "M32 18v19m0 8h.01" : state === "confirm" ? "M16 47V22h7v25M23 23l26-7v9l-26 7" : "");
      svg.append(ring, mark);
      art.replaceChildren(svg);
    }
    closeButton.addEventListener("click", () => operation.close());
    dismiss.addEventListener("click", () => operation.close());
    confirm.addEventListener("click", () => {
      if (dialog.dataset.state !== "confirm" || (toggle && !selected) || !decision) return;
      const resolve = decision;
      decision = undefined;
      confirm.disabled = true;
      resolve(toggle ? { state: selected } : {});
    });
    dialog.addEventListener("cancel", event => {
      event.preventDefault();
      if (dialog.dataset.state !== "waiting") operation.close();
    });
    active = operation;
    setState("preparing", t("מכינים את פעולת הפתיחה", "Preparing the opening request"), t("בודקים את הגדרות המערכת לפני האישור שלכם.", "Checking the system settings before your confirmation."));
    host.append(dialog);
    dialog.showModal();
    dismiss.focus();
    return operation;
  }
  return { open, cancel, get active() { return Boolean(active); } };
}
