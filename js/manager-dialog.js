// DOM dialogs keep confirmations within the workspace and cancel on navigation.
export function createManagerDialog({
  language = "en",
  host = document.body,
} = {}) {
  const he = language === "he";
  const t = (h, e) => (he ? h : e);
  let active;
  function cancel() {
    active?.(null);
  }
  function ask(message, choices, options = {}) {
    cancel();
    return new Promise((resolve) => {
      const previous = document.activeElement;
      const dialog = document.createElement("dialog");
      dialog.className = "manager-confirm-dialog";
      dialog.dir = he ? "rtl" : "ltr";
      dialog.setAttribute("aria-labelledby", "manager-confirm-title");
      dialog.setAttribute("aria-describedby", "manager-confirm-message");
      const heading = document.createElement("h2");
      heading.id = "manager-confirm-title";
      heading.textContent = options.title ?? t("אישור פעולה", "Confirm action");
      const body = document.createElement("p");
      body.id = "manager-confirm-message";
      body.textContent = message;
      const actions = document.createElement("div");
      actions.className = "manager-confirm-actions";
      const finish = (value) => {
        if (active !== finish) return;
        active = undefined;
        dialog.close();
        dialog.remove();
        if (previous?.isConnected) previous.focus();
        resolve(value);
      };
      active = finish;
      const add = (text, value, primary = false) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "manager-button" + (primary ? " primary" : "");
        button.textContent = text;
        button.addEventListener("click", () => finish(value));
        actions.append(button);
        return button;
      };
      const dismiss = add(options.dismissLabel ?? t("ביטול", "Cancel"), null);
      for (const choice of choices) add(choice.label, choice.value, true);
      dialog.append(heading, body);
      if (options.content) dialog.append(options.content);
      let form;
      if (options.fields) {
        form = document.createElement("form");
        form.className = "manager-form manager-create-organization-form";
        for (const [name, text, type = "text"] of options.fields) {
          const label = document.createElement("label"), input = document.createElement("input");
          label.textContent = text;
          input.name = name;
          input.type = type;
          input.required = true;
          input.maxLength = type === "email" ? 254 : 100;
          label.append(input);
          form.append(label);
        }
        const error = document.createElement("p");
        error.setAttribute("role", "alert");
        error.className = "manager-dialog-error";
        error.hidden = true;
        const submit = document.createElement("button");
        submit.type = "submit";
        submit.className = "manager-button primary";
        submit.textContent = options.submitLabel;
        actions.append(submit);
        form.append(error, actions);
        let pending = false;
        form.addEventListener("submit", async (event) => {
          event.preventDefault();
          if (pending || active !== finish) return;
          pending = true;
          submit.disabled = true;
          error.hidden = true;
          form.setAttribute("aria-busy", "true");
          try {
            await options.onSubmit(Object.fromEntries(new FormData(form)));
            finish(true);
          } catch (failure) {
            if (active === finish) {
              error.textContent = options.errorText(failure);
              error.hidden = false;
            }
          } finally {
            pending = false;
            submit.disabled = false;
            form.removeAttribute("aria-busy");
          }
        });
        dialog.append(form);
      } else dialog.append(actions);
      dialog.addEventListener("keydown", (event) => {
        if (event.key !== "Tab") return;
        const buttons = [...dialog.querySelectorAll("input,button,a[href],select,textarea")].filter(element => !element.disabled);
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
      dialog.addEventListener("cancel", (event) => {
        event.preventDefault();
        finish(null);
      });
      const outside = (event) => {
        const rect = dialog.getBoundingClientRect();
        return (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        );
      };
      let startedOutside = false;
      dialog.addEventListener("pointerdown", (event) => {
        startedOutside = outside(event);
      });
      dialog.addEventListener("click", (event) => {
        if (startedOutside && outside(event)) finish(null);
      });
      host.append(dialog);
      dialog.showModal();
      // Default focus never selects the action that writes to a physical gate.
      if (form) form.querySelector("input").focus();
      else dismiss.focus();
    });
  }
  return {
    cancel,
    info: (options) => ask("", [], { ...options, dismissLabel: t("סגירה", "Close") }),
    form: (options) => ask(options.message, [], options),
    confirm: async (message) =>
      (await ask(message, [{ label: t("אישור", "Confirm"), value: true }])) ===
      true,
    chooseState: () =>
      ask(
        t(
          "בחרו את מצב השער הרצוי. הפקודה תישלח רק לאחר אישור נוסף.",
          "Choose the gate state. The command will be sent after a separate confirmation.",
        ),
        [
          { label: "ON", value: "ON" },
          { label: "OFF", value: "OFF" },
        ],
      ),
  };
}
