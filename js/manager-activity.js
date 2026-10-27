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
  progress.append(spinner, label);
  main.prepend(progress);
  const placeholder = document.createElement("div");
  placeholder.className = "manager-loading-panel";
  placeholder.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 3; i++)
    placeholder.append(document.createElement("span"));
  const pending = new Map();
  let revision = 0;
  function render() {
    progress.hidden = pending.size === 0;
    view.setAttribute("aria-busy", String(pending.size > 0));
    if (pending.size) {
      const text = [...pending.values()].at(-1);
      if (label.textContent !== text) label.textContent = text;
      if (!view.contains(placeholder)) view.append(placeholder);
    } else placeholder.remove();
  }
  return {
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
      pending.clear();
      render();
    },
    close() {
      this.reset();
      progress.remove();
    },
  };
}
