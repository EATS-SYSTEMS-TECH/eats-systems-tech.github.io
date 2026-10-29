const el = (tag, text, className) => {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
};

// Progress reflects observed connection stages, never a fabricated time estimate.
export function createManagerConnectionDialog({
  language = "en",
  host = document.body,
  onClose = () => {},
} = {}) {
  const t = (he, en) => (language === "he" ? he : en);
  const stages = [
    [
      t("ממתינים למערכת", "Waiting for your system"),
      t(
        "החיבור למערכת עשוי להימשך עד כשתי דקות. תודה על הסבלנות, נכין עבורכם את סביבת הניהול ברגע שהחיבור יושלם.",
        "Connecting to your system may take up to about two minutes. Thank you for your patience. We’ll prepare your workspace as soon as the connection is complete.",
      ),
    ],
    [
      t("מקימים חיבור מאובטח", "Securing the connection"),
      t(
        "המערכת ענתה. מאמתים את הזהות שלה ומקימים חיבור מאובטח.",
        "Your system responded. Verifying its identity and establishing a secure connection.",
      ),
    ],
    [
      t("מכינים את סביבת הניהול", "Preparing your workspace"),
      t(
        "קוראים את מצב המערכת וטוענים את הנתונים הדרושים לניהול.",
        "Reading the system state and loading the data needed for management.",
      ),
    ],
  ];
  let dialog,
    timer,
    softWaitTimer,
    completionTimer,
    options,
    previousFocus,
    startedAt,
    step = 0;
  let title,
    detail,
    progress,
    fill,
    phase,
    elapsed,
    timing,
    retry,
    dismiss,
    steps;
  function clearTimers() {
    clearInterval(timer);
    clearTimeout(softWaitTimer);
    clearTimeout(completionTimer);
    timer = completionTimer = softWaitTimer = undefined;
  }
  function close(restoreFocus = false) {
    clearTimers();
    const focus =
      previousFocus?.isConnected && previousFocus !== document.body
        ? previousFocus
        : options?.returnFocus;
    const wasOpen = Boolean(dialog);
    if (dialog) {
      dialog.close();
      dialog.remove();
    }
    dialog = undefined;
    options = undefined;
    if (wasOpen) onClose();
    if (restoreFocus && focus?.isConnected) focus.focus();
  }
  function cancel() {
    const state = dialog?.dataset.state;
    const action = state === "pending"
      ? options?.onCancel
      : state === "error"
        ? options?.onDismiss
        : undefined;
    close(!action);
    action?.();
  }
  function tick() {
    if (!dialog) return;
    const seconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
    elapsed.textContent = t(`חלפו ${seconds} שניות`, `${seconds}s elapsed`);
    const softWaitMs = options.softWaitMs === 120000 ? 120000 : 60000;
    const extended = Date.now() - startedAt >= softWaitMs;
    const message = options.simulation
      ? t(
          "סימולציה בלבד. אין חיבור למערכת פיזית.",
          "Simulation only. No physical system is being connected.",
        )
      : extended
        ? t(
            "זה לוקח יותר זמן מהרגיל. ממשיכים להמתין למערכת; אפשר לבטל ולנסות שוב מאוחר יותר.",
            "This is taking longer than usual. We are still waiting for your system; you can cancel and try again later.",
          )
        : "";
    if (timing.textContent !== message) timing.textContent = message;
    timing.hidden = !message;
    dialog.dataset.extended = String(extended);
  }
  function scheduleSoftWait() {
    clearTimeout(softWaitTimer);
    if (!dialog || dialog.dataset.state !== "pending") return;
    const softWaitMs = options.softWaitMs === 120000 ? 120000 : 60000;
    softWaitTimer = setTimeout(tick, Math.max(0, startedAt + softWaitMs - Date.now()));
  }
  function setStage(stage) {
    if (!dialog || dialog.dataset.state !== "pending") return;
    const index = { waiting: 0, connecting: 1, loading: 2 }[stage];
    if (index === undefined || index < step) return;
    step = index;
    dialog.dataset.stage = stage;
    title.textContent = stages[step][0];
    detail.textContent = stages[step][1];
    phase.textContent = t(`שלב ${step + 1} מתוך 3`, `Step ${step + 1} of 3`);
    progress.setAttribute("aria-valuenow", String(step));
    progress.setAttribute(
      "aria-valuetext",
      `${phase.textContent}: ${title.textContent}`,
    );
    fill.style.width = `${(step / 3) * 100}%`;
    [...steps.children].forEach((item, i) => {
      item.dataset.state =
        i < step ? "complete" : i === step ? "current" : "pending";
      if (i === step) item.setAttribute("aria-current", "step");
      else item.removeAttribute("aria-current");
      item.firstElementChild.textContent = i < step ? "✓" : String(i + 1);
    });
  }
  function open(value) {
    close();
    options = value;
    previousFocus = document.activeElement;
    startedAt = Date.now();
    step = 0;
    dialog = el("dialog", undefined, "manager-connection-dialog");
    dialog.dir = language === "he" ? "rtl" : "ltr";
    dialog.dataset.state = "pending";
    dialog.setAttribute("aria-labelledby", "manager-connection-dialog-title");
    dialog.setAttribute(
      "aria-describedby",
      "manager-connection-dialog-description",
    );
    const top = el("header", undefined, "manager-connection-dialog__header");
    const icon = el("span", undefined, "manager-connection-dialog__icon");
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML =
      '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5" y="12" width="22" height="15" rx="4"/><path d="M11 12V8a5 5 0 0 1 10 0v4M16 18v4M2 17h3m22 0h3M2 23h3m22 0h3"/></svg>';
    const brand = el(
      "span",
      "WIFIGATE MANAGER",
      "manager-connection-dialog__brand",
    );
    brand.dir = "ltr";
    const heading = el(
      "h2",
      t("מתחברים למערכת שלכם", "Connecting your system"),
    );
    heading.id = "manager-connection-dialog-title";
    const identity = el("p", undefined, "manager-connection-dialog__identity");
    const name = el("bdi", value.systemName);
    const gate = el("bdi", value.gate);
    gate.dir = "ltr";
    identity.append(name, document.createTextNode(" · "), gate);
    const exit = el("button", "×", "manager-connection-dialog__close");
    exit.type = "button";
    exit.setAttribute("aria-label", t("סגירה", "Close"));
    exit.addEventListener("click", cancel);
    top.append(exit, icon, brand, heading, identity);
    const body = el("div", undefined, "manager-connection-dialog__body");
    if (value.simulation)
      body.append(
        el(
          "p",
          t("סימולציה · מערכת לדוגמה", "Simulation · example system"),
          "manager-connection-dialog__simulation",
        ),
      );
    const live = el("div", undefined, "manager-connection-dialog__live");
    live.setAttribute("aria-live", "polite");
    live.setAttribute("aria-atomic", "true");
    title = el("h3");
    detail = el("p");
    detail.id = "manager-connection-dialog-description";
    live.append(title, detail);
    const meta = el("div", undefined, "manager-connection-dialog__meta");
    phase = el("span");
    elapsed = el("span");
    elapsed.setAttribute("aria-live", "off");
    meta.append(phase, elapsed);
    progress = el("div", undefined, "manager-connection-dialog__rail");
    progress.setAttribute("role", "progressbar");
    progress.setAttribute(
      "aria-label",
      t("התקדמות שלבי החיבור", "Connection stage progress"),
    );
    progress.setAttribute("aria-valuemin", "0");
    progress.setAttribute("aria-valuemax", "3");
    fill = el("span", undefined, "manager-connection-dialog__fill");
    progress.append(fill);
    steps = el("ol", undefined, "manager-connection-dialog__steps");
    for (const [index, [label]] of stages.entries()) {
      const item = el("li");
      item.append(
        el("span", String(index + 1), "manager-connection-dialog__step"),
        el("span", label),
      );
      steps.append(item);
    }
    timing = el("p", undefined, "manager-connection-dialog__timing");
    timing.setAttribute("aria-live", "polite");
    const actions = el(
      "footer",
      undefined,
      "manager-connection-dialog__actions",
    );
    dismiss = el(
      "button",
      t("ביטול וחזרה", "Cancel and return"),
      "manager-button",
    );
    dismiss.type = "button";
    dismiss.addEventListener("click", cancel);
    retry = el(
      "button",
      t("ניסיון חיבור נוסף", "Try connecting again"),
      "manager-button primary",
    );
    retry.type = "button";
    retry.hidden = true;
    retry.addEventListener("click", () => {
      const action = options.onRetry;
      close();
      action?.();
    });
    actions.append(retry, dismiss);
    body.append(live, meta, progress, steps, timing);
    dialog.append(top, body, actions);
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      cancel();
    });
    dialog.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;
      const buttons = [
        ...dialog.querySelectorAll("button:not([hidden]):not(:disabled)"),
      ];
      const first = buttons[0],
        last = buttons.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    host.append(dialog);
    setStage("waiting");
    tick();
    timer = setInterval(tick, 1000);
    scheduleSoftWait();
    dialog.showModal();
    dismiss.focus();
  }
  function complete() {
    if (!dialog || dialog.dataset.state !== "pending") return;
    clearTimers();
    dialog.dataset.state = "complete";
    dialog.querySelector("h2").textContent = t(
      "סביבת הניהול מוכנה",
      "Your workspace is ready",
    );
    title.textContent = t(
      "כל שלבי החיבור הושלמו",
      "All connection steps are complete",
    );
    detail.textContent = t(
      "החיבור הושלם והנתונים נטענו. אפשר להתחיל לנהל.",
      "Connected and data loaded. You can start managing your system.",
    );
    phase.textContent = t("3 מתוך 3 שלבים הושלמו", "All 3 steps complete");
    progress.setAttribute("aria-valuenow", "3");
    progress.setAttribute("aria-valuetext", title.textContent);
    fill.style.width = "100%";
    for (const item of steps.children) {
      item.dataset.state = "complete";
      item.removeAttribute("aria-current");
      item.firstElementChild.textContent = "✓";
    }
    dismiss.textContent = t("פתיחת סביבת הניהול", "Enter workspace");
    // Finishing the animation never changes or replays a connection operation.
    const completed = dialog;
    completionTimer = setTimeout(() => {
      if (dialog === completed) close(true);
    }, 450);
  }
  function fail(message) {
    if (!dialog) return;
    if (dialog.dataset.state === "complete") {
      close(true);
      return;
    }
    clearTimers();
    dialog.dataset.state = "error";
    dialog.querySelector("h2").textContent = t(
      "החיבור לא הושלם",
      "Connection did not complete",
    );
    const explanation = typeof message === "object" && message !== null ? message : null;
    title.textContent = explanation?.title ?? t("פרטי החיבור", "Connection details");
    detail.textContent = explanation?.message ?? String(message ?? "");
    dialog.querySelector("[data-connection-error-actions]")?.remove();
    if (explanation?.steps?.length) {
      const recovery = el("section", undefined, "manager-connection-dialog__recovery");
      recovery.dataset.connectionErrorActions = "true";
      recovery.append(el("h3", t("מה כדאי לעשות עכשיו", "What to do next")));
      const actions = el("ol");
      for (const step of explanation.steps) actions.append(el("li", step));
      recovery.append(actions);
      if (explanation.code) {
        const diagnostics = el("details", undefined, "manager-connection-dialog__diagnostics");
        diagnostics.append(el("summary", t("פרטים טכניים לתמיכה", "Technical details for support")));
        const code = el("code", explanation.code);
        code.dir = "ltr";
        diagnostics.append(code);
        recovery.append(diagnostics);
      }
      timing.before(recovery);
    }
    phase.textContent = t(
      `נעצר בשלב ${step + 1} מתוך 3`,
      `Stopped at step ${step + 1} of 3`,
    );
    const failed = steps.children[step];
    failed.dataset.state = "error";
    failed.removeAttribute("aria-current");
    failed.firstElementChild.textContent = "!";
    progress.setAttribute("aria-valuetext", title.textContent);
    timing.hidden = false;
    timing.textContent = t(
      "תהליך החיבור אינו שולח פקודת פתיחה. ניסיון נוסף מתחיל רק בלחיצה שלכם.",
      "Connecting does not send a gate-opening command. A new attempt starts only when you choose.",
    );
    retry.hidden = false;
    dismiss.textContent = t("סגירה וחזרה", "Close and return");
    dismiss.focus();
  }
  return {
    open,
    setTiming(value) {
      if (!dialog || dialog.dataset.state !== "pending") return;
      options.softWaitMs = value?.timingVersion === 2 && value?.softWaitMs === 120000 ? 120000 : 60000;
      tick();
      scheduleSoftWait();
    },
    setStage,
    complete,
    fail,
    close,
    get active() {
      return Boolean(dialog);
    },
    get state() {
      return dialog?.dataset.state;
    },
  };
}
