// Guest invitation from a Manager workspace. The gate signs the pass for the
// administrator behind the Manager delegation (ADMIN_ISSUE_GUEST_PASS) and the
// Manager API seals it into the link the WIFIGATE app opens. The browser holds
// no issuer key; nothing about the guest is stored on the gate.
import { createManagerSectionHeading } from "./manager-section-heading.js";

export const MANAGER_GUEST_MAX_DAYS = 31;
const DAY_MS = 86_400_000;
const PHONE = /^\+[1-9]\d{6,14}$/;

const pad = (value) => String(value).padStart(2, "0");
// The value of a datetime-local input for a local moment, to the minute.
export function managerGuestLocalInput(ms) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// The checked invitation, or the reason it cannot be issued.
export function managerGuestWindow({ name, phone, from, until, now = Date.now() }) {
  const trimmed = String(name ?? "").trim();
  const start = Date.parse(from), end = Date.parse(until);
  if (!trimmed) return { error: "name" };
  if (new TextEncoder().encode(trimmed).length > 32) return { error: "nameLength" };
  if (phone && !PHONE.test(phone)) return { error: "phone" };
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return { error: "order" };
  if (end <= now) return { error: "past" };
  if (end - start > MANAGER_GUEST_MAX_DAYS * DAY_MS) return { error: "length" };
  return {
    name: trimmed,
    phone: phone || undefined,
    nb: Math.floor(start / 1000),
    na: Math.floor(end / 1000),
  };
}

// The text of the e-mail and share sheet, in the app's guest-link style.
export function managerGuestMessage({ language, gateName, guestName, notBefore, notAfter, url }) {
  const he = language === "he", t = (h, e) => he ? h : e;
  const format = new Intl.DateTimeFormat(he ? "he-IL" : "en-GB", { dateStyle: "short", timeStyle: "short" });
  return [
    t("WIFIGATE · גישת אורח", "WIFIGATE · Guest access"),
    `${t("שער", "Gate")}: ${gateName}`,
    `${t("אורח", "Guest")}: ${guestName}`,
    `${t("מ־", "From")}: ${format.format(notBefore * 1000)}`,
    `${t("עד", "Until")}: ${format.format(notAfter * 1000)}`,
    t("לחצו לפתיחת השער באפליקציית WIFIGATE:", "Tap to open the gate in the WIFIGATE app:"),
    url,
  ].join("\n");
}

export function renderManagerGuestInvite(content, { language, gateName, supported, issue, now = () => Date.now() }) {
  const he = language === "he", t = (h, e) => he ? h : e;
  const el = (tag, text, cls) => {
    const element = document.createElement(tag);
    if (text !== undefined) element.textContent = text;
    if (cls) element.className = cls;
    return element;
  };
  const section = el("section", undefined, "manager-guest-invite");
  const header = createManagerSectionHeading({
    title: t("הזמנת אורח", "Invite a guest"),
    description: t(
      "קישור אישי שפותח את השער באפליקציית WIFIGATE רק בטווח הזמן שתבחרו. השער חותם עליו בשם מנהל המערכת.",
      "A personal link that opens the gate in the WIFIGATE app only within the time you choose. The gate signs it as the system administrator.",
    ),
    icon: "account", level: "h4", className: "manager-people-header",
  });
  const open = el("button", t("הזמנת אורח", "Invite a guest"), "manager-button primary");
  open.type = "button";
  open.disabled = !supported;
  const tools = el("div", undefined, "manager-people-tools");
  tools.append(open);
  header.append(tools);
  section.append(header);
  if (!supported) section.append(el("p", t(
    "הזמנת אורח מ־Manager דורשת קושחה W.11.26.3 ומעלה בשער.",
    "Inviting a guest from Manager requires firmware W.11.26.3 or later on the gate.",
  ), "manager-note"));

  const dialog = el("dialog", undefined, "manager-people-dialog manager-guest-dialog");
  dialog.dir = he ? "rtl" : "ltr";
  dialog.id = "manager-guest-dialog";
  dialog.setAttribute("aria-labelledby", "manager-guest-dialog-title");
  dialog.setAttribute("aria-describedby", "manager-guest-dialog-note");
  const head = el("header", undefined, "manager-people-dialog-head");
  const badge = el("span", undefined, "manager-people-dialog-icon");
  badge.setAttribute("aria-hidden", "true");
  badge.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>';
  const titles = el("div");
  const title = el("h2", t("הזמנת אורח", "Invite a guest"));
  title.id = "manager-guest-dialog-title";
  const note = el("p", t(
    `האורח יוכל לפתוח את ${gateName} באפליקציית WIFIGATE רק בטווח הזמן שתבחרו, עד ${MANAGER_GUEST_MAX_DAYS} ימים.`,
    `The guest can open ${gateName} in the WIFIGATE app only within the time you choose, up to ${MANAGER_GUEST_MAX_DAYS} days.`,
  ));
  note.id = "manager-guest-dialog-note";
  titles.append(title, note);
  const close = el("button", undefined, "manager-people-dialog-close");
  close.type = "button";
  close.setAttribute("aria-label", t("סגירה", "Close"));
  close.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  head.append(badge, titles, close);

  const form = el("form", undefined, "manager-form manager-guest-form");
  form.noValidate = true;
  const field = (name, label, type, attributes = {}) => {
    const wrapper = el("label", label);
    const input = el("input");
    input.name = name;
    input.type = type;
    Object.assign(input, attributes);
    wrapper.append(input);
    return wrapper;
  };
  const who = el("fieldset");
  who.append(el("legend", t("פרטי האורח", "Guest details")),
    field("name", t("שם האורח", "Guest name"), "text", { required: true, maxLength: 32, autocomplete: "off", placeholder: t("למשל: טכנאי מעלית", "e.g. Lift technician") }),
    field("phone", t("טלפון האורח (לא חובה)", "Guest phone (optional)"), "tel", { autocomplete: "off", placeholder: "+972501234567", dir: "ltr" }));
  const when = el("fieldset");
  when.append(el("legend", t("מתי", "When")),
    field("from", t("מ־", "From"), "datetime-local", { required: true }),
    field("until", t("עד", "Until"), "datetime-local", { required: true }));
  const failure = el("p", "", "manager-people-dialog-error");
  failure.setAttribute("role", "alert");
  failure.hidden = true;
  const actions = el("div", undefined, "manager-people-dialog-actions");
  const cancel = el("button", t("ביטול", "Cancel"), "manager-button");
  cancel.type = "button";
  const submit = el("button", t("יצירת קישור", "Create link"), "manager-button primary");
  submit.type = "submit";
  actions.append(cancel, submit);
  form.append(who, when, failure, actions);

  const result = el("div", undefined, "manager-guest-result");
  result.hidden = true;
  const summary = el("p", "", "manager-guest-summary");
  const linkLabel = el("label", t("קישור האורח", "Guest link"));
  const link = el("input");
  link.readOnly = true;
  link.dir = "ltr";
  link.className = "manager-guest-link";
  linkLabel.append(link);
  const signedBy = el("p", "", "manager-note");
  const copied = el("p", "", "manager-guest-copied");
  copied.setAttribute("role", "status");
  const resultActions = el("div", undefined, "manager-people-dialog-actions");
  const copy = el("button", t("העתקת קישור", "Copy link"), "manager-button");
  copy.type = "button";
  const mail = el("button", t("שליחה באימייל", "Send by e-mail"), "manager-button");
  mail.type = "button";
  const share = el("button", t("שיתוף", "Share"), "manager-button");
  share.type = "button";
  share.hidden = typeof navigator.share !== "function";
  const done = el("button", t("סיום", "Done"), "manager-button primary");
  done.type = "button";
  resultActions.append(copy, mail, share, done);
  result.append(summary, linkLabel, signedBy, copied, resultActions);
  dialog.append(head, form, result);
  section.append(dialog);

  const errors = {
    name: t("נא להזין את שם האורח.", "Enter the guest's name."),
    nameLength: t("שם האורח ארוך מדי (עד 32 בתים).", "The guest's name is too long (up to 32 bytes)."),
    phone: t("טלפון בפורמט בינלאומי, למשל ‎+972501234567.", "Use an international phone number, e.g. +972501234567."),
    order: t("שעת הסיום צריכה להיות אחרי שעת ההתחלה.", "The end must be after the start."),
    past: t("שעת הסיום כבר עברה.", "The end has already passed."),
    length: t(`הגישה יכולה להימשך עד ${MANAGER_GUEST_MAX_DAYS} ימים.`, `Access can last up to ${MANAGER_GUEST_MAX_DAYS} days.`),
  };
  const say = (text) => { failure.textContent = text; failure.hidden = !text; };
  let message = "";
  let returnFocus = open;
  open.addEventListener("click", () => {
    returnFocus = open;
    form.reset();
    const start = Math.floor(now() / 60000) * 60000;
    form.elements.from.value = managerGuestLocalInput(start);
    form.elements.until.value = managerGuestLocalInput(start + DAY_MS);
    form.hidden = false;
    result.hidden = true;
    title.textContent = t("הזמנת אורח", "Invite a guest");
    say("");
    dialog.showModal();
    form.elements.name.focus();
  });
  for (const button of [cancel, close, done]) button.addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => { if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true }); });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const checked = managerGuestWindow({
      name: form.elements.name.value,
      phone: form.elements.phone.value.trim(),
      from: form.elements.from.value,
      until: form.elements.until.value,
      now: now(),
    });
    if (checked.error) {
      say(errors[checked.error]);
      return;
    }
    say("");
    submit.disabled = cancel.disabled = true;
    submit.textContent = t("השער חותם…", "The gate is signing…");
    try {
      const issued = await issue(checked);
      message = managerGuestMessage({ language, gateName, guestName: issued.name, notBefore: issued.notBefore, notAfter: issued.notAfter, url: issued.url });
      link.value = issued.url;
      const format = new Intl.DateTimeFormat(he ? "he-IL" : "en-GB", { dateStyle: "short", timeStyle: "short" });
      // The window reads left to right in both languages.
      const range = el("span", `${format.format(issued.notBefore * 1000)} – ${format.format(issued.notAfter * 1000)}`);
      range.dir = "ltr";
      summary.replaceChildren(el("strong", issued.name), range);
      signedBy.textContent = issued.issuerName
        ? t(`נחתם בשער בשם ${issued.issuerName}. שום פרט של האורח לא נשמר בשער.`, `Signed on the gate as ${issued.issuerName}. Nothing about the guest is stored on the gate.`)
        : t("נחתם בשער. שום פרט של האורח לא נשמר בשער.", "Signed on the gate. Nothing about the guest is stored on the gate.");
      mail.dataset.href = `mailto:?subject=${encodeURIComponent(t(`גישת אורח · ${gateName}`, `Guest access · ${gateName}`))}&body=${encodeURIComponent(message)}`;
      copied.textContent = "";
      title.textContent = t("קישור האורח מוכן", "The guest link is ready");
      form.hidden = true;
      result.hidden = false;
      link.focus();
      link.select();
    } catch (error) {
      say(error?.guestMessage || t("לא ניתן ליצור את הקישור כרגע. נסו שוב.", "The link could not be created right now. Try again."));
    } finally {
      submit.disabled = cancel.disabled = false;
      submit.textContent = t("יצירת קישור", "Create link");
    }
  });
  copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(link.value);
      copied.textContent = t("הקישור הועתק.", "Link copied.");
    } catch {
      link.select();
      copied.textContent = t("סמנו את הקישור והעתיקו אותו.", "Select the link and copy it.");
    }
  });
  mail.addEventListener("click", () => { window.location.href = mail.dataset.href; });
  share.addEventListener("click", () => {
    navigator.share?.({ title: t("גישת אורח", "Guest access"), text: message }).catch(() => {});
  });
  content.append(section);
  return section;
}
