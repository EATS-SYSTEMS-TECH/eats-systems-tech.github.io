import { hostText, hostLanguage } from "./host-locale.js";
import { node, infoTip, isolatedText, nameBlock } from "./host-ui.js";
import { authErrorMessage } from "./host-auth-errors.js";
import { roleLabel } from "./host-role-badge.js";
import { requestWithRecentIdentity } from "./host-recent-identity.js";
import { createManagerSystemCard } from "./manager-system-card.js";

// Shared pieces of My systems, Organization systems and the examples: the
// system card (icon, name, kind line, badges, actions), the app steps for
// adding a system, and the confirmation dialog. Normal UI shows no ids, keys,
// fingerprints or codes.
const types = new Set(["gate", "dual-control", "group"]);
const defaultIcons = {
  gate: "door-small",
  "dual-control": "barrier-gate-small",
  group: "home",
};

// A system record from the API, or null when it cannot be shown. Older
// records may lack a type, icon, name or source; they still show.
export function readSystem(value) {
  if (
    !value ||
    typeof value.id !== "string" ||
    !/^[A-Za-z0-9_-]{1,128}$/.test(value.id) ||
    !Number.isInteger(value.version)
  )
    return null;
  const type = types.has(value.type) ? value.type : "gate";
  const linked = value.linkedOrganization;
  return {
    id: value.id,
    type,
    // Never shown: with the type it names the same system in My systems
    // and in its organization, whose ids differ.
    targetId: typeof value.targetId === "string" ? value.targetId : "",
    iconId:
      typeof value.iconId === "string" && /^[a-z0-9-]{1,64}$/.test(value.iconId)
        ? value.iconId
        : defaultIcons[type],
    name:
      typeof value.name === "string" && value.name.trim()
        ? value.name
        : hostText("WIFIGATE system"),
    gates: Array.isArray(value.systemIds) ? value.systemIds.length : 1,
    status: value.status === "disabled" ? "disabled" : "active",
    version: value.version,
    linkedOrganization:
      linked && typeof linked.id === "string"
        ? {
            id: linked.id,
            name: typeof linked.name === "string" ? linked.name : "",
          }
        : null,
    source:
      value.source?.kind === "personal"
        ? {
            kind: "personal",
            ownerEmail:
              typeof value.source.ownerEmail === "string"
                ? value.source.ownerEmail
                : "",
          }
        : { kind: "organization" },
  };
}

export const iconSrc = (system) =>
  `/assets/host-icons/${system.type}-${system.iconId}.svg`;

// The line under a name: Gate, or Dual Control / Group with its number of
// gates. The kind and the number are isolated, so "Dual Control · 2" stays in
// reading order inside Hebrew copy.
export function kindLine(system) {
  const line = node("p", undefined, { class: "system-card__kind" });
  if (system.type === "gate") line.textContent = hostText("Gate");
  else {
    const label = hostText(system.type === "group" ? "Group" : "Dual Control");
    line.append(
      system.gates === 1
        ? isolatedText("{p0} · 1 gate", { p0: label })
        : isolatedText("{p0} · {p1} gates", { p0: label, p1: system.gates }),
    );
  }
  return line;
}

export function badge(text, kind = "org") {
  return node("span", text, {
    class: `system-badge system-badge--${kind}`,
    dir: "auto",
  });
}
export const organizationBadge = (name) => badge(name, "org");
export const notLinkedBadge = () => badge(hostText("Not linked"), "none");
export const examplePill = () => badge(hostText("Example"), "example");

const workspaceText = (he, en) => (hostLanguage === "he" ? he : en);

// The same Manager card component renders Host's real systems and examples.
// Host actions remain in its workspace, with their original authority checks
// and callbacks. The list itself has one consistent primary action.
let cards = 0;
export function systemCard(
  system,
  { badges = [], actions = [], onOpenWorkspace } = {},
) {
  const nameId = `system-name-${++cards}`;
  const footer = node("div", undefined, { class: "manager-system-actions" });
  const open = node(
    "button",
    workspaceText("פתיחת סביבת ניהול", "Open workspace"),
    {
      class: "manager-button primary",
      type: "button",
      "data-action": "workspace",
    },
  );
  footer.append(open);
  const card = createManagerSystemCard({
    system: {
      ...system,
      systemIds: Array.from(
        { length: Math.max(1, Number(system.gates) || 1) },
        (_, index) => `${system.id}-${index}`,
      ),
    },
    language: hostLanguage,
    actions: footer,
    example: system.example === true,
  });
  card.classList.add("system-card");
  card.dataset.systemId = system.id;
  card.setAttribute("aria-labelledby", nameId);
  if (system.example) card.dataset.example = "true";
  const heading = card.querySelector("h4");
  heading.id = nameId;
  heading.classList.add("system-card__name");
  heading.tabIndex = -1;
  card.querySelector(".manager-muted").classList.add("system-card__kind");
  open.addEventListener("click", () => {
    if (onOpenWorkspace) {
      onOpenWorkspace(open, actions, badges);
      return;
    }
    openSystemWorkspace(card, system, { trigger: open, actions, badges });
  });
  return card;
}

function openSystemWorkspace(card, system, { trigger, actions, badges }) {
  for (const current of document.querySelectorAll("dialog.system-workspace-dialog[open]"))
    current.close();
  const dialog = node("dialog", undefined, {
    class: "manager-confirm-dialog system-workspace-dialog",
    "aria-labelledby": `${trigger.closest("article").getAttribute("aria-labelledby")}-workspace`,
  });
  dialog.workspaceTrigger = trigger;
  const heading = nameBlock("h3", system.name, {
    id: dialog.getAttribute("aria-labelledby"),
  });
  const details = node("div", undefined, { class: "manager-note" });
  details.append(kindLine(system));
  if (badges.length) {
    const row = node("p", undefined, { class: "system-card__badges" });
    row.append(...badges);
    details.append(row);
  }
  const controls = node("div", undefined, {
    class: "manager-confirm-actions system-workspace-actions",
  });
  controls.append(...actions);
  for (const button of controls.querySelectorAll("button"))
    button.workspaceTrigger = trigger;
  controls.addEventListener("click", (event) => {
    if (event.target.closest("button[data-action]:not(:disabled)")) dialog.close();
  }, true);
  const close = node("button", workspaceText("סיום וחזרה", "End and return"), {
    type: "button",
    class: "manager-button",
    "data-action": "close-workspace",
  });
  close.addEventListener("click", () => dialog.close());
  const footer = node("div", undefined, { class: "manager-confirm-actions" });
  footer.append(close);
  dialog.append(heading, details, controls, footer);
  dialog.addEventListener("close", () => {
    dialog.remove();
    queueMicrotask(() => {
      if (trigger.isConnected && !document.querySelector("dialog[open]"))
        trigger.focus();
    });
  });
  card.append(dialog);
  dialog.showModal();
  (controls.querySelector("button:not(:disabled)") ?? close).focus();
}

// A card action. A temporarily blocked action stays visible, disabled, with
// an ⓘ that says why.
export function action(label, onClick, { variant, blocked, name } = {}) {
  const button = node("button", hostText(label), {
    type: "button",
    class: `manager-button${variant ? ` button-${variant}` : ""}${variant === "danger" ? " manager-button-danger" : ""}`,
    ...(name ? { "data-action": name } : {}),
  });
  button.addEventListener("click", () => onClick(button));
  if (!blocked) return button;
  button.disabled = true;
  const holder = node("span", undefined, { class: "system-action-blocked" });
  holder.append(button, infoTip(hostText(blocked)));
  return holder;
}

export function systemGrid(cards) {
  const list = node("div", undefined, { class: "manager-grid system-grid" });
  list.append(...cards);
  return list;
}

// The way to add a system: three steps in the WIFIGATE app. `organization`
// names the organization to add to; without it the steps add to My systems.
export function appSteps(organization) {
  const list = node("ol", undefined, { class: "manager-setup-steps app-steps" });
  for (const text of [
    hostText("In the WIFIGATE app, open your profile."),
    workspaceText(
      "בחרו WIFIGATE For Business ואז WIFIGATE Host.",
      "Choose WIFIGATE For Business, then WIFIGATE Host.",
    ),
    organization
      ? hostText("Choose {p0} and tap “Add to {p0}” next to the system.", {
          p0: organization,
        })
      : hostText("Tap “Add to My systems” next to the system."),
  ]) {
    const step = node("li");
    step.append(node("span", text, { dir: "auto" }));
    list.append(step);
  }
  return list;
}

export function systemSetupGuide(organization) {
  const guide = node("details", undefined, {
    class: "manager-setup-guide dashboard-examples",
  });
  guide.append(
    node("summary", workspaceText("איך מוסיפים מערכת?", "How do I add a system?")),
    node("p", hostText("Systems you add from the WIFIGATE app. Link one to an organization to use it there.")),
    appSteps(organization),
  );
  return guide;
}

// One sentence, an optional ⓘ and an optional set of steps or one action.
export function emptyState(text, { tip, steps, action: button } = {}) {
  const empty = node("div", undefined, { class: "manager-empty empty-state" });
  const line = node("p", undefined, { class: "empty-state__text" });
  line.append(node("span", text));
  if (tip) line.append(infoTip(tip));
  empty.append(line);
  if (steps) empty.append(steps);
  if (button) {
    button.classList.add("manager-button");
    empty.append(button);
  }
  return empty;
}

// The line above a list: how many systems, and an ⓘ.
export function systemsToolbar(text, tip) {
  const bar = node("div", undefined, { class: "manager-toolbar systems-toolbar" });
  const line = node("p", undefined, { class: "systems-toolbar__text" });
  line.append(node("span", text));
  if (tip) line.append(infoTip(tip));
  bar.append(line);
  return bar;
}

export function countText(count) {
  return count === 1
    ? hostText("1 system")
    : hostText("{p0} systems", { p0: count });
}

const messages = {
  SYSTEM_LINKED: "Unlink it from its organization first.",
  SYSTEM_NOT_LINKED: "This system changed. Close this window and try again.",
  GATE_DELEGATION_REQUIRED:
    "Add this system again from the WIFIGATE app, then try again.",
  SYSTEM_ALREADY_CLAIMED:
    "Another organization already uses this system's gates.",
  SYSTEM_ALREADY_IN_ORGANIZATION: "That organization already has this system.",
  DEVICE_IDENTITY_UNVERIFIED:
    "One of this system's gates isn't verified by WIFIGATE. Contact support.",
  VERSION_CONFLICT: "This system changed. Close this window and try again.",
  IDEMPOTENCY_CONFLICT: "This system changed. Close this window and try again.",
  RESOURCE_NOT_FOUND:
    "This system is no longer here. Close this window to see the list again.",
  NOT_FOUND:
    "This system is no longer here. Close this window to see the list again.",
  HOST_PLAN_REQUIRED: "My systems needs an active Host plan.",
  TENANT_ACCESS_DENIED:
    "Only an owner or admin of that organization can do this.",
  OWNER_REQUIRED: "Only an owner or admin of that organization can do this.",
  TOTP_REQUIRED: "Verify your authenticator first, then try again.",
  SUBSCRIPTION_UNAVAILABLE:
    "Service is unavailable for that organization right now.",
  BILLING_CAPACITY_EXCEEDED:
    "That organization can't take more systems. Contact support.",
  HOST_API_UNAVAILABLE: "Can't reach WIFIGATE right now. Try again.",
};
// Codes after which the list on screen is out of date.
export const staleCodes = new Set([
  "VERSION_CONFLICT",
  "IDEMPOTENCY_CONFLICT",
  "RESOURCE_NOT_FOUND",
  "NOT_FOUND",
  "SYSTEM_LINKED",
  "SYSTEM_NOT_LINKED",
  "SYSTEM_ALREADY_IN_ORGANIZATION",
]);

export function systemMessage(error) {
  if (messages[error?.code]) return hostText(messages[error.code]);
  if (
    String(error?.code ?? "").startsWith("auth/") ||
    /^RECENT_/.test(error?.code ?? "")
  )
    return authErrorMessage(error);
  return hostText("That didn't work. Try again.");
}

// How many upcoming bookings refused a removal, when the server said.
export function bookingCount(error) {
  const count = error?.details?.count;
  return Number.isInteger(count) && count > 0 ? count : undefined;
}

// A 409 SYSTEM_HAS_BOOKINGS in a dialog: how many upcoming bookings, and one
// way to them (that organization's Bookings, showing that system's upcoming
// bookings) when the person can open that organization; otherwise who can
// move them. The change cannot succeed until the bookings move, so the
// dialog stops asking (`title` says it can't be done yet), the red button
// leaves and focus goes to the way forward (or Close). Returns false for any
// other error.
export function bookingsRefusal(
  error,
  {
    status,
    extra,
    close,
    settle,
    title,
    system,
    organization,
    openBookings,
    canOpenBookings,
  },
) {
  if (error?.code !== "SYSTEM_HAS_BOOKINGS") return false;
  const count = bookingCount(error);
  const reachable = canOpenBookings(organization.id);
  if (reachable)
    status.textContent =
      count === undefined
        ? hostText(
            "Upcoming bookings use this system. Move or cancel them first.",
          )
        : count === 1
          ? hostText(
              "1 upcoming booking uses this system. Move or cancel it first.",
            )
          : hostText(
              "{p0} upcoming bookings use this system. Move or cancel them first.",
              { p0: count },
            );
  else {
    const name = organization.name || hostText("the organization");
    status.replaceChildren(
      count === undefined
        ? isolatedText(
            "Upcoming bookings use this system. Ask an owner or admin of {p0} to move or cancel them.",
            { p0: name },
          )
        : count === 1
          ? isolatedText(
              "1 upcoming booking uses this system. Ask an owner or admin of {p0} to move or cancel it.",
              { p0: name },
            )
          : isolatedText(
              "{p1} upcoming bookings use this system. Ask an owner or admin of {p0} to move or cancel them.",
              { p0: name, p1: count },
            ),
    );
  }
  let open;
  if (reachable) {
    open = node("button", hostText("Open bookings"), {
      type: "button",
      class: "manager-button button-secondary",
      "data-open-bookings": "",
    });
    open.addEventListener("click", () => {
      close();
      openBookings(organization.id, system);
    });
    extra.replaceChildren(open);
  }
  settle(open, { title });
  return true;
}

// One Idempotency-Key per intent (path and body), kept until it succeeds, so
// a retry of the same change is never applied twice.
const attempts = new Map();
export function intentFor(path, body) {
  const signature = JSON.stringify([path, body]);
  let key = attempts.get(signature);
  if (!key) {
    key = crypto.randomUUID();
    attempts.set(signature, key);
  }
  return {
    key,
    done: () => attempts.delete(signature),
  };
}

let dialogs = 0;
// A centred dialog with one confirm button and Cancel. `submit` gets
// {data, status, extra, close, settle} and returns true to close.
// settle(next, {title}) ends a refused choice that cannot succeed as it is:
// the confirm button goes, Cancel becomes Close, focus moves to `next` (or
// Close) and a `title` replaces the question. A danger
// dialog is the red confirmation card. Focus returns to the button that
// opened it.
export function openSystemDialog({
  container,
  trigger,
  title,
  text,
  build,
  submitLabel,
  danger = false,
  submit,
  onClosed,
}) {
  for (const open of document.querySelectorAll("dialog.system-dialog[open]"))
    open.close();
  const id = `system-dialog-${++dialogs}`;
  const returnFocus = trigger?.workspaceTrigger ?? trigger;
  const dialog = node("dialog", undefined, {
    class: `manager-confirm-dialog system-dialog${danger ? " system-dialog--danger" : ""}`,
    "aria-labelledby": `${id}-title`,
    ...(text ? { "aria-describedby": `${id}-text` } : {}),
  });
  const form = node("form", undefined, { class: "manager-form system-dialog__form" });
  const heading = node("h3", title, { id: `${id}-title`, dir: "auto" });
  const description = text
    ? node("p", text, {
        id: `${id}-text`,
        class: "system-dialog__text",
        dir: "auto",
      })
    : undefined;
  form.append(heading, ...(description ? [description] : []));
  build?.(form);
  const status = node("p", "", {
    id: `${id}-status`,
    class: "system-dialog__status",
    role: "status",
    "aria-live": "polite",
  });
  const extra = node("div", undefined, { class: "system-dialog__extra" });
  const actions = node("div", undefined, { class: "manager-confirm-actions system-dialog__actions" });
  const confirm = node("button", submitLabel, {
    type: "submit",
    class: danger ? "manager-button manager-button-danger button-danger-solid" : "manager-button primary",
  });
  const cancel = node("button", hostText("Cancel"), {
    type: "button",
    class: "manager-button button-secondary",
  });
  actions.append(confirm, cancel);
  form.append(status, extra, actions);
  dialog.append(form);
  let busy = false;
  let focusAfter;
  const close = () => dialog.open && dialog.close();
  // A refusal ends the dialog's question: the way forward (when there is
  // one) becomes its main button, beside Close. With a `title` the dialog
  // stops asking: the title says what happened, the question's explanation
  // goes, and the refusal describes the dialog.
  const settle = (next, { title: refused } = {}) => {
    confirm.remove();
    cancel.textContent = hostText("Close");
    if (refused) {
      heading.textContent = refused;
      description?.remove();
      dialog.setAttribute("aria-describedby", status.id);
    }
    if (next) {
      next.classList.remove("button-secondary");
      next.classList.add("primary");
      actions.prepend(next);
    }
    focusAfter = next ?? cancel;
  };
  cancel.addEventListener("click", close);
  dialog.addEventListener("cancel", (event) => {
    if (busy) event.preventDefault();
  });
  dialog.addEventListener("close", () => {
    dialog.remove();
    if (returnFocus?.isConnected) returnFocus.focus();
    onClosed?.();
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (busy) return;
    busy = true;
    // The reviewed choice, read before the controls lock (a disabled
    // control is left out of a form's data).
    const data = new FormData(form);
    const controls = [...form.elements].map((element) => [
      element,
      element.disabled,
    ]);
    for (const [element] of controls) element.disabled = true;
    status.textContent = hostText("Working…");
    extra.replaceChildren();
    let finished = false;
    try {
      finished = await submit({ data, status, extra, close, settle });
    } finally {
      busy = false;
      if (dialog.isConnected) {
        for (const [element, disabled] of controls) element.disabled = disabled;
        if (status.textContent === hostText("Working…"))
          status.textContent = "";
      }
    }
    if (finished) close();
    else if (focusAfter?.isConnected) {
      focusAfter.focus();
      focusAfter = undefined;
    }
  });
  (container ?? document.body).append(dialog);
  dialog.showModal();
  // A red confirmation opens on Cancel, so Enter never removes by accident.
  (danger
    ? cancel
    : (form.querySelector("input:checked") ??
      form.querySelector("input:not(:disabled), select") ??
      cancel)
  ).focus();
  return dialog;
}

// Radio choices of organizations, each with the person's role there. An
// organization for which `blocked` returns a reason stays visible, disabled,
// with an ⓘ that says why; the first open one is chosen.
export function organizationChoices(form, organizations, { blocked } = {}) {
  const group = node("fieldset", undefined, { class: "choice-list" });
  group.append(node("legend", hostText("Organization")));
  let chosen = false;
  for (const organization of organizations) {
    const reason = blocked?.(organization);
    const label = node("label", undefined, { class: "choice" });
    const radio = node("input", undefined, {
      type: "radio",
      name: "organizationId",
      value: organization.id,
    });
    if (reason) radio.disabled = true;
    else if (!chosen) radio.checked = chosen = true;
    label.append(
      radio,
      nameBlock("span", organization.name, { class: "choice__name" }),
      node(
        "small",
        roleLabel(
          organization.workspace?.role ?? organization.membership?.role,
        ),
        { class: "choice__detail" },
      ),
    );
    if (!reason) {
      group.append(label);
      continue;
    }
    const row = node("div", undefined, { class: "choice-row" });
    row.append(label, infoTip(hostText(reason)));
    group.append(row);
  }
  form.append(group);
}

// Follows one dialog's change: runs it with one Idempotency-Key per intent
// (a POST through the recent sign-in helper, or send(key) for another
// method), shows a refusal in one sentence, and once the dialog closes
// refreshes what changed, or asks for the authenticator when that was the
// reason. context: {user, isCurrent, onChanged(focusId)}.
export function changeTracker(context) {
  let changed = false;
  let stale = false;
  let planEnded = false;
  let verify = false;
  return {
    async run({ path, body, status, onRefused, send }) {
      const intent = intentFor(path, body);
      try {
        if (send) await send(intent.key);
        else
          await requestWithRecentIdentity({
            user: context.user,
            path,
            body,
            intent: intent.key,
            isCurrent: context.isCurrent,
            onVerifying: () => {
              status.textContent = hostText(
                "Confirm your identity with your authenticator…",
              );
            },
          });
        intent.done();
        changed = true;
        verify = false;
        return true;
      } catch (error) {
        if (!context.isCurrent() || error?.name === "AbortError") return false;
        if (onRefused?.(error)) return false;
        status.textContent = systemMessage(error);
        if (staleCodes.has(error?.code)) stale = true;
        if (error?.code === "HOST_PLAN_REQUIRED") planEnded = true;
        if (error?.code === "TOTP_REQUIRED") verify = true;
        return false;
      }
    },
    closed(focusId) {
      if (!context.isCurrent()) return;
      if (planEnded) window.dispatchEvent(new CustomEvent("platform:refresh"));
      else if (verify)
        window.dispatchEvent(new CustomEvent("host:totp-required"));
      else if (changed || stale) void context.onChanged(focusId);
    },
  };
}
