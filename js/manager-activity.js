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
  const bar = document.createElement("progress");
  bar.className = "manager-activity-bar";
  progress.append(spinner, label, bar);
  main.prepend(progress);
  const placeholder = document.createElement("div");
  placeholder.className = "manager-loading-panel";
  placeholder.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 3; i++)
    placeholder.append(document.createElement("span"));
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
    progress.hidden = paused || pending.size === 0;
    view.setAttribute("aria-busy", String(pending.size > 0));
    if (pending.size && !paused) {
      const text = [...pending.values()].at(-1);
      if (label.textContent !== text) label.textContent = text;
      label.title = text;
      bar.setAttribute("aria-label", text);
      if (!workspace && !view.contains(placeholder)) view.append(placeholder);
      if (workspace) placeholder.remove();
    } else placeholder.remove();
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
