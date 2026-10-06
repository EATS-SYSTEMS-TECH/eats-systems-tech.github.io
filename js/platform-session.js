import { signOut } from "./site-auth.js";
import { loginPath, pageLanguage } from "./platform-model.js";

export const idleTimeoutMs = 30 * 60 * 1000;

export function watchSession({
  clear,
  clock = Date.now,
  timeout = idleTimeoutMs,
}) {
  let lastActivity = clock();
  let ended = false;
  let timer;
  const language = pageLanguage();
  const events = ["pointerdown", "keydown", "touchstart", "scroll"];

  async function endSession() {
    if (ended) return;
    ended = true;
    clear();
    stop();
    try {
      await signOut();
    } finally {
      location.replace(loginPath(null, language));
    }
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(
      checkIdle,
      Math.max(0, timeout - (clock() - lastActivity)),
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
