// System clock: the last card of the Settings tab, like the app's Settings.
// It shows the gate's date and time in the gate's time zone, the time zone and
// whether the clock is set. Every command already carries this computer's UTC
// time; "Update" also moves the gate to this computer's time zone (asking
// first when it differs).

const node = (tag, text, cls) => {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text;
  if (cls) el.className = cls;
  return el;
};

/** "UTC+02:00" for an offset in minutes east of UTC. */
export function managerClockOffset(tzMinutes) {
  const sign = tzMinutes < 0 ? "-" : "+";
  const total = Math.abs(Math.trunc(tzMinutes));
  return `UTC${sign}${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** The gate's local date and time for a clock reading, ticking from its arrival. */
export function managerClockLocalTime(clock, nowMs, language = "en") {
  const utc = clock.utc + Math.max(0, Math.floor((nowMs - clock.receivedAtMs) / 1000));
  return new Intl.DateTimeFormat(language === "he" ? "he-IL" : "en-GB", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hourCycle: "h23", timeZone: "UTC",
  }).format(new Date((utc + clock.tz * 60) * 1000));
}

/** This computer's offset in minutes east of UTC. */
export function managerComputerOffset(date = new Date()) {
  return -date.getTimezoneOffset() + 0;
}

export function renderManagerSystemClock({ root, language = "en", connection, confirm, errorText, isCurrent = () => true, now = () => Date.now(), computerOffset = managerComputerOffset }) {
  const he = language === "he";
  const t = (hebrew, english) => (he ? hebrew : english);
  const card = node("section", undefined, "manager-device-card manager-system-clock");
  card.dataset.systemClock = "";
  card.append(node("h3", t("שעון מערכת", "System clock")));
  card.append(node("p", t("התאריך והשעה בבקר, באזור הזמן שלו. כל פעולה מהאתר מעדכנת את השעה לפי המחשב.", "The date and time on the gate, in its time zone. Every action from this website updates the time from this computer."), "manager-supporting-copy"));
  const facts = node("dl", undefined, "manager-device-facts");
  const value = (label) => {
    const dd = node("dd", "—");
    facts.append(node("dt", label), dd);
    return dd;
  };
  const time = value(t("תאריך ושעה בבקר", "Gate date and time"));
  const zone = value(t("אזור זמן", "Time zone"));
  const state = value(t("מצב השעון", "Clock status"));
  const computer = value(t("אזור הזמן של המחשב", "This computer's time zone"));
  time.dir = "ltr"; zone.dir = "ltr"; computer.dir = "ltr";
  const status = node("p", "", "manager-system-clock-status");
  status.setAttribute("role", "status");
  const update = node("button", t("עדכון השעון לפי המחשב", "Update clock from this computer"), "manager-button");
  update.type = "button";
  card.append(facts, status, update);
  root.append(card);

  const paint = () => {
    const clock = connection?.lastClock;
    computer.textContent = managerClockOffset(computerOffset());
    if (!clock) return;
    time.textContent = clock.set ? managerClockLocalTime(clock, now(), language) : t("עדיין לא מכוון", "Not set yet");
    zone.textContent = managerClockOffset(clock.tz);
    state.textContent = clock.set ? t("מכוון", "Set") : t("לא מכוון – יכוון בפעולה הבאה", "Not set – the next action sets it");
    card.dataset.clockSet = String(clock.set);
  };
  const timer = setInterval(() => {
    if (!card.isConnected) { clearInterval(timer); return; }
    paint();
  }, 1000);

  const ping = async (tz) => {
    await connection.command("ADMIN_PING", {}, undefined, Number.isInteger(tz) ? { tz } : {});
    if (isCurrent()) paint();
  };

  update.addEventListener("click", async () => {
    if (update.disabled) return;
    const target = computerOffset();
    const current = connection?.lastClock?.tz;
    if (Number.isInteger(current) && current !== target) {
      const ok = await confirm(t(
        `אזור הזמן של המחשב (${managerClockOffset(target)}) שונה מזה של המערכת (${managerClockOffset(current)}). לעדכן את המערכת לשעה ולאזור הזמן של המחשב?`,
        `This computer's time zone (${managerClockOffset(target)}) differs from the system's (${managerClockOffset(current)}). Update the system to this computer's time and time zone?`,
      ));
      if (!ok || !isCurrent()) return;
    }
    update.disabled = true;
    status.textContent = "";
    try {
      await ping(target);
      if (isCurrent()) status.textContent = t("השעון בבקר עודכן לפי המחשב.", "The gate clock was updated from this computer.");
    } catch (error) {
      if (isCurrent()) status.textContent = errorText ? errorText(error) : t("לא ניתן היה לעדכן את השעון. נסו שוב.", "The clock could not be updated. Try again.");
    } finally {
      update.disabled = false;
    }
  });

  paint();
  // A fresh reading: the ping itself carries this computer's UTC time.
  void ping().catch(() => {
    if (isCurrent() && !connection?.lastClock) status.textContent = t("לא ניתן היה לקרוא את השעון מהבקר.", "Could not read the gate clock.");
  });
  return card;
}
