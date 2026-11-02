import { hostText } from "./host-locale.js";

// Keep drafts in the current DOM only. A session/access reset removes the
// forms; no guest information is stored in browser storage.
const originals = new WeakMap();
// Read-only filters use forms too. Track the editors that are replaced when
// the organization changes, not search, statement filters or saved views.
const editors =
  '.booking-form, .system-dialog__form, [data-settings-panel="organization"] .settings-form';
const values = (form) =>
  JSON.stringify(
    Array.from(form.elements)
      .filter(
        (input) => input.name && !["submit", "button"].includes(input.type),
      )
      .map((input) => [
        input.name,
        ["checkbox", "radio"].includes(input.type)
          ? input.checked
          : input.value,
      ]),
  );
const dirtyForms = (root) =>
  [...root.querySelectorAll(editors)].filter(
    (form) =>
      !form.closest("dialog:not([open])") &&
      originals.has(form) &&
      originals.get(form).values !== values(form),
  );

export function watchHostDrafts(root) {
  const remember = (event) => {
    const form = event.target.form;
    if (
      form &&
      form.matches(editors) &&
      root.contains(form) &&
      !originals.has(form)
    ) {
      originals.set(form, {
        values: values(form),
        url: location.href,
        state: history.state,
      });
    }
  };
  root.addEventListener("focusin", remember);
  root.addEventListener("beforeinput", remember);
  root.addEventListener("pointerdown", remember);
  // Capture runs before either workspace's ordinary history listener can
  // dispose forms. Forced refreshes and session resets do not go through it.
  window.addEventListener(
    "popstate",
    (event) => {
      const currentOrganization = root.dataset.organizationId;
      const targetOrganization = new URL(location.href).searchParams.get("org");
      if (!currentOrganization || currentOrganization === targetOrganization)
        return;
      const changed = dirtyForms(root);
      if (!changed.length || confirmHostWorkspaceLeave(root)) return;
      const previous = originals.get(changed[0]);
      history.replaceState(previous.state, "", previous.url);
      event.stopImmediatePropagation();
      const view =
        new URL(previous.url).searchParams.get("view") ?? root.dataset.homeView;
      if (document.body.dataset.hostViewId !== view) {
        window.dispatchEvent(
          new CustomEvent("host:workspace-view", { detail: view }),
        );
      } else
        window.dispatchEvent(
          new CustomEvent("host:workspace-navigate", { detail: view }),
        );
    },
    { capture: true },
  );
}

export function confirmHostWorkspaceLeave(root) {
  return (
    !dirtyForms(root).length ||
    window.confirm(
      hostText("Leave this workspace and discard unsaved changes?"),
    )
  );
}
