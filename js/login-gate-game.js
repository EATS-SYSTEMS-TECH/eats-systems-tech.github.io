// "I'm not a robot" check for /login/: drag the car into the one open gate.
// Runs in the browser only, with no network call and nothing stored.

const LANES = 3;
const MIN_DRAG_MS = 600;
const MAX_DRAG_MS = 60_000;
const MIN_SAMPLES = 10;
const MAX_FAILURES = 3;
const LOCKOUT_MS = 60_000;
const GATE_ZONE = 0.72;

const COPY = {
  en: {
    title: "I'm not a robot",
    instruction: "To confirm, drag the car into the open gate",
    footer: "Human check · WIFIGATE",
    keyboard: "Car in lane {lane} of 3. Arrow keys change lane, Enter drives.",
    gate: "Gate {n}, {state}",
    open: "open",
    closed: "closed",
    retry: "Not quite. Drive into the green gate.",
    locked: "Too many tries. Try again in {s} s.",
    done: "Verified. You're not a robot.",
    close: "Close",
  },
  he: {
    title: "אני לא רובוט",
    instruction: "כדי לאשר, גררו את המכונית לשער הפתוח",
    footer: "בדיקת אנושיות · WIFIGATE",
    keyboard: "המכונית בנתיב {lane} מתוך 3. החיצים מחליפים נתיב, Enter נוסע.",
    gate: "שער {n}, {state}",
    open: "פתוח",
    closed: "סגור",
    retry: "לא בדיוק. היכנסו לשער הירוק.",
    locked: "יותר מדי ניסיונות. נסו שוב בעוד {s} שניות.",
    done: "אומת. אתם לא רובוט.",
    close: "סגירה",
  },
};

const CAR_SVG = `<svg viewBox="0 0 72 40" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="gg-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5b9bff"/><stop offset="1" stop-color="#0b63ff"/></linearGradient>
    <radialGradient id="gg-beam" cx="0" cy="0.5" r="1"><stop offset="0" stop-color="#fff7c2" stop-opacity=".9"/><stop offset="1" stop-color="#fff7c2" stop-opacity="0"/></radialGradient>
  </defs>
  <rect x="9" y="2" width="12" height="6" rx="3" fill="#0f172a"/><rect x="45" y="2" width="12" height="6" rx="3" fill="#0f172a"/>
  <rect x="9" y="32" width="12" height="6" rx="3" fill="#0f172a"/><rect x="45" y="32" width="12" height="6" rx="3" fill="#0f172a"/>
  <rect x="3" y="6" width="62" height="28" rx="12" fill="url(#gg-body)"/>
  <path d="M40 10h9q6 0 7 10-1 10-7 10h-9q3-10 0-20z" fill="#0b1a33" opacity=".85"/>
  <path d="M14 11h10q-2 9 0 18H14q-4-9 0-18z" fill="#0b1a33" opacity=".7"/>
  <rect x="26" y="11" width="12" height="18" rx="4" fill="#ffffff" opacity=".18"/>
  <circle cx="63" cy="12" r="2.2" fill="#fff7c2"/><circle cx="63" cy="28" r="2.2" fill="#fff7c2"/>
  <circle cx="5" cy="12" r="1.8" fill="#ff5a6a"/><circle cx="5" cy="28" r="1.8" fill="#ff5a6a"/>
</svg>`;

const GATE_SVG = `<svg viewBox="0 0 40 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
  <rect x="14" y="2" width="12" height="16" rx="4" fill="#cbd5e1"/>
  <circle class="gate-game__light" cx="20" cy="10" r="4"/>
  <g class="gate-game__arm"><rect x="17" y="16" width="6" height="82" rx="3" fill="#f8fafc"/>
  <rect x="17" y="30" width="6" height="10" fill="#ef4444"/><rect x="17" y="54" width="6" height="10" fill="#ef4444"/><rect x="17" y="78" width="6" height="10" fill="#ef4444"/></g>
</svg>`;

function text(template, values) {
  return template.replace(/\{(\w+)\}/g, (_, key) => values[key]);
}

function randomInt(max) {
  const value = new Uint32Array(1);
  crypto.getRandomValues(value);
  return value[0] % max;
}

const reducedMotion = () =>
  matchMedia("(prefers-reduced-motion: reduce)").matches;

// A scripted drag is a straight line at constant speed; a person's is not.
export function looksHuman(samples) {
  if (samples.length < MIN_SAMPLES) return false;
  const first = samples[0];
  const last = samples[samples.length - 1];
  const duration = last.t - first.t;
  if (duration < MIN_DRAG_MS || duration > MAX_DRAG_MS) return false;
  const dx = last.x - first.x;
  const dy = last.y - first.y;
  const length = Math.hypot(dx, dy) || 1;
  let deviation = 0;
  const speeds = [];
  for (let index = 1; index < samples.length; index += 1) {
    const point = samples[index];
    const previous = samples[index - 1];
    deviation = Math.max(
      deviation,
      Math.abs(dy * (point.x - first.x) - dx * (point.y - first.y)) / length,
    );
    const step = point.t - previous.t;
    if (step > 0)
      speeds.push(
        Math.hypot(point.x - previous.x, point.y - previous.y) / step,
      );
  }
  const mean = speeds.reduce((sum, value) => sum + value, 0) / (speeds.length || 1);
  const spread = Math.sqrt(
    speeds.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
      (speeds.length || 1),
  );
  const straight = deviation < 2;
  const steady = mean === 0 || spread / mean < 0.1;
  return !(straight && steady);
}

function buildDialog(copy) {
  const dialog = document.createElement("dialog");
  dialog.className = "gate-game";
  dialog.setAttribute("aria-labelledby", "gate-game-title");
  dialog.innerHTML = `
    <div class="gate-game__head">
      <h2 id="gate-game-title" class="gate-game__title"><span class="gate-game__checkbox" aria-hidden="true"></span>${copy.title}</h2>
      <button type="button" class="gate-game__close" aria-label="${copy.close}">×</button>
    </div>
    <p class="gate-game__instruction">${copy.instruction}</p>
    <div class="gate-game__board" dir="ltr">
      <div class="gate-game__road" aria-hidden="true"></div>
      <div class="gate-game__gates"></div>
      <div class="gate-game__car" tabindex="0" role="button">${CAR_SVG}</div>
      <div class="gate-game__done" aria-hidden="true"><span>✓</span></div>
    </div>
    <p class="gate-game__message" role="status" aria-live="polite"></p>
    <p class="gate-game__footer">${copy.footer}</p>`;
  const gates = dialog.querySelector(".gate-game__gates");
  for (let lane = 0; lane < LANES; lane += 1) {
    const gate = document.createElement("div");
    gate.className = "gate-game__gate";
    gate.setAttribute("role", "img");
    gate.innerHTML = GATE_SVG;
    gates.append(gate);
  }
  return dialog;
}

/**
 * Opens the game in a modal dialog.
 * Resolves true once the car reaches the open gate, false if the dialog is closed.
 */
export function requestHumanCheck(language = "en") {
  const copy = COPY[language] ?? COPY.en;
  const dialog = buildDialog(copy);
  document.body.append(dialog);
  const board = dialog.querySelector(".gate-game__board");
  const car = dialog.querySelector(".gate-game__car");
  const gates = [...dialog.querySelectorAll(".gate-game__gate")];
  const message = dialog.querySelector(".gate-game__message");

  let openLane = 0;
  let carLane = 0;
  let failures = 0;
  let lockedUntil = 0;
  let finished = false;
  let drag;
  let keyboard;
  let countdown;

  const laneHeight = () => board.clientHeight / LANES;
  const carStartX = () => board.clientWidth * 0.06;

  function placeCar(x, y, animate) {
    car.classList.toggle("gate-game__car--moving", Boolean(animate));
    car.style.transform = `translate(${x}px, ${y}px)`;
    car.dataset.x = String(x);
    car.dataset.y = String(y);
  }

  function laneY(lane) {
    return lane * laneHeight() + (laneHeight() - car.offsetHeight) / 2;
  }

  function describeCar() {
    car.setAttribute("aria-label", text(copy.keyboard, { lane: carLane + 1 }));
  }

  function newRound(animate = true) {
    openLane = randomInt(LANES);
    carLane = (openLane + 1 + randomInt(LANES - 1)) % LANES;
    gates.forEach((gate, lane) => {
      const open = lane === openLane;
      gate.classList.toggle("gate-game__gate--open", open);
      gate.dataset.open = String(open);
      gate.setAttribute(
        "aria-label",
        text(copy.gate, { n: lane + 1, state: open ? copy.open : copy.closed }),
      );
    });
    board.style.setProperty("--open-lane", String(openLane));
    keyboard = { since: performance.now(), arrows: 0 };
    placeCar(carStartX(), laneY(carLane), animate);
    describeCar();
  }

  function finish(result) {
    if (finished) return;
    finished = true;
    clearInterval(countdown);
    dialog.close();
    dialog.remove();
    resolveResult(result);
  }

  function succeed() {
    board.classList.add("gate-game__board--done");
    dialog.classList.add("gate-game--verified");
    message.textContent = copy.done;
    placeCar(board.clientWidth + 20, laneY(openLane), true);
    setTimeout(() => finish(true), reducedMotion() ? 250 : 900);
  }

  function lock() {
    lockedUntil = Date.now() + LOCKOUT_MS;
    board.classList.add("gate-game__board--locked");
    car.setAttribute("aria-disabled", "true");
    const tick = () => {
      const left = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (left <= 0) {
        clearInterval(countdown);
        failures = 0;
        board.classList.remove("gate-game__board--locked");
        car.removeAttribute("aria-disabled");
        message.textContent = "";
        newRound();
        return;
      }
      message.textContent = text(copy.locked, { s: left });
    };
    tick();
    countdown = setInterval(tick, 1000);
  }

  function fail() {
    failures += 1;
    board.classList.remove("gate-game__board--shake");
    void board.offsetWidth;
    board.classList.add("gate-game__board--shake");
    if (failures >= MAX_FAILURES) {
      placeCar(carStartX(), laneY(carLane), true);
      lock();
      return;
    }
    message.textContent = copy.retry;
    setTimeout(newRound, reducedMotion() ? 0 : 350);
  }

  const locked = () => Date.now() < lockedUntil || finished;

  function judge(centerX, centerY, human) {
    const inGate = centerX >= board.clientWidth * GATE_ZONE;
    const lane = Math.min(LANES - 1, Math.max(0, Math.floor(centerY / laneHeight())));
    if (inGate && lane === openLane && human) succeed();
    else fail();
  }

  car.addEventListener("pointerdown", (event) => {
    if (locked() || !event.isTrusted || event.button > 0) return;
    event.preventDefault();
    car.setPointerCapture(event.pointerId);
    const rect = board.getBoundingClientRect();
    drag = {
      id: event.pointerId,
      offsetX: event.clientX - rect.left - Number(car.dataset.x),
      offsetY: event.clientY - rect.top - Number(car.dataset.y),
      trusted: true,
      samples: [{ x: event.clientX, y: event.clientY, t: event.timeStamp }],
    };
    car.classList.add("gate-game__car--held");
    message.textContent = "";
  });

  car.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    drag.trusted &&= event.isTrusted;
    drag.samples.push({ x: event.clientX, y: event.clientY, t: event.timeStamp });
    const rect = board.getBoundingClientRect();
    const x = Math.min(
      board.clientWidth - car.offsetWidth * 0.4,
      Math.max(0, event.clientX - rect.left - drag.offsetX),
    );
    const y = Math.min(
      board.clientHeight - car.offsetHeight,
      Math.max(0, event.clientY - rect.top - drag.offsetY),
    );
    placeCar(x, y, false);
  });

  function release(event) {
    if (!drag || event.pointerId !== drag.id) return;
    const current = drag;
    drag = undefined;
    car.classList.remove("gate-game__car--held");
    current.samples.push({ x: event.clientX, y: event.clientY, t: event.timeStamp });
    const human =
      current.trusted && event.isTrusted && looksHuman(current.samples);
    judge(
      Number(car.dataset.x) + car.offsetWidth / 2,
      Number(car.dataset.y) + car.offsetHeight / 2,
      human,
    );
  }
  car.addEventListener("pointerup", release);
  car.addEventListener("pointercancel", release);

  car.addEventListener("keydown", (event) => {
    if (locked() || !event.isTrusted) return;
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      carLane = Math.min(
        LANES - 1,
        Math.max(0, carLane + (event.key === "ArrowUp" ? -1 : 1)),
      );
      keyboard.arrows += 1;
      placeCar(carStartX(), laneY(carLane), true);
      describeCar();
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const human =
        keyboard.arrows > 0 && performance.now() - keyboard.since >= MIN_DRAG_MS;
      if (carLane === openLane && human) succeed();
      else fail();
    }
  });

  dialog.querySelector(".gate-game__close").addEventListener("click", () => finish(false));
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    finish(false);
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) finish(false);
  });

  let resolveResult;
  const result = new Promise((resolve) => {
    resolveResult = resolve;
  });
  dialog.showModal();
  newRound(false);
  car.focus({ preventScroll: true });
  return result;
}
