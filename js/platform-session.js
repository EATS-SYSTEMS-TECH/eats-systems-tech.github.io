import { signOut } from "./site-auth.js";
import { loginPath, pageLanguage } from "./platform-model.js";

export const idleTimeoutMs = 24 * 60 * 60 * 1000;
// Owner decision 2026-11-21 (docs/WIFIGATE_BUSINESS_SIGN_IN.html in the
// mobile repository): with "Remember me on this device" a sign-in lasts up to
// 30 days; without it, until the tab closes or a day without activity.
export const rememberedTimeoutMs = 30 * 24 * 60 * 60 * 1000;

// "Remember me" signs in with local persistence, where Firebase keeps the
// account under a firebase:authUser: key; otherwise it is in session storage.
export function rememberedOnThisDevice(storage = globalThis.localStorage) {
  try {
    for (let index = 0; index < storage.length; index++) {
      if (storage.key(index)?.startsWith("firebase:authUser:")) return true;
    }
  } catch {
    // Storage is blocked: treat the sign-in as not remembered.
  }
  return false;
}

export function watchSession({
  clear,
  clock = Date.now,
  timeout = rememberedOnThisDevice() ? rememberedTimeoutMs : idleTimeoutMs,
}) {
  let lastActivity = clock();
  let ended = false;
  let timer;
  const language = pageLanguage();
  const events = ["pointerdown", "keydown", "touchstart", "scroll"];

  async function endSession(reason) {
    if (ended) return;
    ended = true;
    clear();
    stop();
    try {
      await signOut();
    } finally {
      location.replace(loginPath(null, language, reason));
    }
  }

  function schedule() {
    clearTimeout(timer);
    // Browsers fire a longer delay than 2^31-1 ms at once; checkIdle re-arms.
    timer = setTimeout(
      checkIdle,
      Math.min(2 ** 31 - 1, Math.max(0, timeout - (clock() - lastActivity))),
    );
  }

  function checkIdle() {
    if (clock() - lastActivity >= timeout) void endSession();
    else schedule();
  }

  function activity() {
    if (clock() - lastActivity >= timeout) {
      void endSession();
      return;
    }
    lastActivity = clock();
    schedule();
  }

  function accessError(event) {
    if (ended) return;
    if (event.detail?.status === 401) {
      void endSession();
    } else if (event.detail?.status === 403) {
      const { code, scope } = event.detail;
      if (scope && code !== "PORTAL_ACCESS_DENIED") {
        const workspace = document.querySelector("#host-management");
        if (
          scope.organizationId !== workspace?.dataset.organizationId ||
          scope.generation !== workspace?.dataset.requestGeneration
        )
          return;
      }
      clear();
      if (location.pathname !== "/dashboard/") {
        location.replace(
          language === "he" ? "/dashboard/?lang=he" : "/dashboard/",
        );
      } else {
        window.dispatchEvent(new Event("platform:refresh"));
      }
    }
  }

  function stop() {
    clearTimeout(timer);
    for (const event of events) window.removeEventListener(event, activity);
    window.removeEventListener("focus", checkIdle);
    document.removeEventListener("visibilitychange", checkIdle);
    window.removeEventListener("platform:access-error", accessError);
  }

  for (const event of events)
    window.addEventListener(event, activity, { passive: true });
  window.addEventListener("focus", checkIdle);
  document.addEventListener("visibilitychange", checkIdle);
  window.addEventListener("platform:access-error", accessError);
  schedule();
  return {
    stop,
    endSession,
    get ended() {
      return ended;
    },
  };
}
