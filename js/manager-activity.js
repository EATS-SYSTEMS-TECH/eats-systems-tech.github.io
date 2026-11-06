import { managerUiIcon } from "./manager-ui-icons.js";

// Visible, request-scoped feedback. Resetting a view fences late completions.
export function createManagerActivity({ main, view, language }) {
  const he = language === "he";
  const progress = document.createElement("div");
  progress.className = "manager-progress";
  progress.hidden = true;
  progress.setAttribute("role", "status");
  progress.setAttribute("aria-live", "polite");
  const spinner = document.createElement("span");
  spinner.className = "manager-spinner";
  spinner.setAttribute("aria-hidden", "true");
  const label = document.createElement("span");
  label.className = "manager-activity-label";
  const bar = document.createElement("progress");
  bar.className = "manager-activity-bar";
  const emblem = document.createElement("span");
  emblem.className = "manager-page-loading-emblem";
  emblem.setAttribute("aria-hidden", "true");
  emblem.append(managerUiIcon("systems"));
  const title = document.createElement("strong");
  title.className = "manager-page-loading-title";
  title.textContent = he ? "מכינים את התצוגה שלכם" : "Getting your workspace ready";
  const hint = document.createElement("span");
  hint.className = "manager-page-loading-hint";
  hint.textContent = he ? "רק רגע, הנתונים יופיעו מיד בסיום הטעינה." : "Just a moment. Your data will appear as soon as it's ready.";
  const track = document.createElement("span");
  track.className = "manager-page-loading-track";
  track.setAttribute("aria-hidden", "true");
  track.append(document.createElement("i"));
  progress.append(emblem, title, spinner, label, track, bar, hint);
  main.prepend(progress);
  const pending = new Map();
  let revision = 0,
    paused = false;
  function render() {
    const workspace = view.querySelector(".manager-workspace-progress");
    const target = workspace ?? main;
    if (progress.parentNode !== target) {
      if (workspace) target.append(progress);
      else target.prepend(progress);
    }
    progress.classList.toggle("is-workspace", Boolean(workspace));
    progress.classList.toggle("is-page", !workspace);
    progress.hidden = paused || pending.size === 0;
    const pageLoading = !workspace && !progress.hidden;
    main.classList.toggle("is-page-loading", pageLoading);
    view.inert = pageLoading;
    view.setAttribute("aria-busy", String(pending.size > 0));
    if (pending.size && !paused) {
      const text = [...pending.values()].at(-1);
      if (label.textContent !== text) label.textContent = text;
      label.title = text;
      bar.setAttribute("aria-label", text);
    }
  }
  return {
    pause(value) {
      paused = value;
      render();
    },
    async track(text, run) {
      const token = {},
        epoch = revision;
      pending.set(token, text || (he ? "טוען נתונים…" : "Loading data…"));
      render();
      try {
        return await run();
      } finally {
        if (epoch === revision) {
          pending.delete(token);
          render();
        }
      }
    },
    reset() {
      revision++;
      paused = false;
      pending.clear();
      render();
    },
    close() {
      this.reset();
      progress.remove();
    },
  };
}
