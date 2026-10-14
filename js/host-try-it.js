import { hostText, hostLanguage, hostLocale } from "./host-locale.js";
import { node, infoTip, isolatedText, nameBlock } from "./host-ui.js";
import qrcode from "./vendor/qrcode-generator.js";
import { iconSrc, examplePill } from "./host-system-cards.js";
import {
  defaultStay,
  defaultGuestPhone,
  localInputValue,
  fromLocalInput,
  stayProblem,
  e164,
  demoGuestLink,
  guestInvitationRequest,
  guestInvitationResponse,
  reservationWebhookRequest,
  reservationWebhookResponse,
  guestDeliveryRequest,
  requestText,
  curlText,
  javascriptText,
  responseText,
} from "./host-demo-link.js";

// "Try it" on an example system: how a guest link is made, by hand, from a
// booking system, or after a payment. It runs entirely in this page: no
// request leaves the browser, the link it makes is a demo link that never
// opens a gate, and the requests shown to a developer carry placeholders
// instead of keys.
const tracks = [
  { id: "manual", label: "By hand" },
  { id: "booking", label: "Booking system" },
  { id: "payment", label: "Payment" },
];
const developerTabs = [
  { id: "request", label: "Request" },
  { id: "curl", label: "curl" },
  { id: "javascript", label: "JavaScript" },
  { id: "response", label: "Response" },
];
const problems = {
  name: "Enter the guest's name.",
  phone: "Enter the phone with its country code, like +44 7700 900212.",
  time: "Choose when the guest arrives and leaves.",
  order: "The guest must leave after they arrive.",
  length: "A guest link can cover up to 31 days.",
};
const steps = {
  booking: [
    "Your booking system sent the booking to WIFIGATE.",
    "WIFIGATE created the guest link.",
    "WIFIGATE sent the link back to your system.",
  ],
  payment: [
    "The payment went through.",
    "Your server asked WIFIGATE for a guest link.",
    "The guest got the link.",
  ],
};

const pause = (ms) =>
  new Promise((resolve) =>
    setTimeout(
      resolve,
      matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : ms,
    ),
  );
const when = (date) =>
  new Intl.DateTimeFormat(hostLocale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

const lineOf = (element, content) => {
  element.append(content);
  return element;
};

let openDialog;

export function openTryIt(
  example,
  { container = document.body, trigger } = {},
) {
  openDialog?.close();
  const stay = defaultStay();
  const state = {
    track: "manual",
    tab: "request",
    guest: {
      name: hostLanguage === "he" ? "נועה לוי" : "Christopher Martin",
      phone: defaultGuestPhone,
    },
    startsAt: stay.startsAt,
    endsAt: stay.endsAt,
    results: {},
    busy: false,
  };
  const snapshot = () => ({
    guest: { ...state.guest },
    startsAt: state.startsAt,
    endsAt: state.endsAt,
  });

  const dialog = node("dialog", undefined, {
    class: "try-it",
    "aria-labelledby": "try-it-title",
    "data-example-id": example.id,
  });
  openDialog = dialog;
  const frame = node("div", undefined, { class: "try-it__frame" });
  const header = node("header", undefined, { class: "try-it__header" });
  const icon = node("span", undefined, {
    class: `system-card__icon system-card__icon--${example.type}`,
  });
  icon.append(
    node("img", undefined, {
      src: iconSrc(example),
      alt: "",
      width: "40",
      height: "40",
    }),
  );
  const titles = node("div", undefined, { class: "try-it__titles" });
  titles.append(
    node("p", hostText("Try it"), { class: "try-it__eyebrow" }),
    nameBlock("h2", example.name, { id: "try-it-title" }),
  );
  const close = node("button", "×", {
    type: "button",
    class: "try-it__close button-secondary",
    "aria-label": "Close",
  });
  close.addEventListener("click", () => dialog.close());
  header.append(icon, titles, examplePill(), close);

  const note = node("p", undefined, { class: "try-it__note" });
  note.append(
    node("span", hostText("Example: nothing is sent and no gate opens.")),
    infoTip(
      hostText(
        "With a real system, your booking system or website does this for you.",
      ),
    ),
  );

  const picker = node("div", undefined, {
    class: "workspace-tabs try-it__tracks",
    role: "group",
    "aria-label": "How the link is made",
  });
  const trackButtons = new Map(
    tracks.map((track) => {
      const button = node("button", hostText(track.label), {
        type: "button",
        "aria-pressed": "false",
        "data-track": track.id,
      });
      button.addEventListener("click", () => chooseTrack(track.id));
      picker.append(button);
      return [track.id, button];
    }),
  );

  const trackBody = node("div", undefined, { class: "try-it__track" });
  const linkCard = node("section", undefined, {
    class: "link-card",
    "aria-labelledby": "try-it-link-title",
    hidden: "",
  });

  const developer = node("details", undefined, { class: "try-it__developer" });
  developer.append(node("summary", hostText("For your developer")));
  const developerBar = node("div", undefined, {
    class: "workspace-tabs try-it__code-tabs",
    role: "group",
    "aria-label": "Code",
  });
  const code = node("pre", undefined, {
    class: "try-it__code",
    dir: "ltr",
    tabindex: "0",
  });
  const codeText = node("code");
  code.append(codeText);
  const developerButtons = new Map(
    developerTabs.map((tab) => {
      const button = node("button", hostText(tab.label), {
        type: "button",
        "aria-pressed": "false",
        "data-code": tab.id,
      });
      button.addEventListener("click", () => {
        state.tab = tab.id;
        renderDeveloper();
      });
      developerBar.append(button);
      return [tab.id, button];
    }),
  );
  developer.append(developerBar, code);

  frame.append(header, note, picker, trackBody, linkCard, developer);
  dialog.append(frame);

  function stayOf(result) {
    return result ?? snapshot();
  }

  // Code reads left to right; a sentence in its place keeps the page's
  // direction.
  function showCode(text, { sentence = false } = {}) {
    if (sentence) code.removeAttribute("dir");
    else code.dir = "ltr";
    code.classList.toggle("try-it__code--note", sentence);
    codeText.textContent = text;
  }

  function renderDeveloper() {
    const result = state.results[state.track];
    for (const [id, button] of developerButtons)
      button.setAttribute("aria-pressed", String(id === state.tab));
    // A failed payment sends nothing, so no tab shows a request.
    if (result?.failed)
      return showCode(hostText("No request is sent when the payment fails."), {
        sentence: true,
      });
    if (!result && state.tab === "response")
      return showCode(hostText("Run the example above to see the answer."), {
        sentence: true,
      });
    const data = stayOf(result);
    const request =
      state.track === "booking"
        ? reservationWebhookRequest(data)
        : guestInvitationRequest({
            ...data,
            reference:
              state.track === "payment" ? "PAY-212-0001" : "WGA-SIM-212",
          });
    const text = {
      request: requestText(request),
      curl: curlText(request),
      javascript:
        (state.track === "payment"
          ? "// Run this on your server once your payment provider reports a successful payment.\n"
          : "") + javascriptText(request),
      response:
        state.track === "booking"
          ? `${responseText(202, reservationWebhookResponse())}\n\n# ${hostText(
              "Then WIFIGATE sends the link to your system:",
            )}\n${requestText(guestDeliveryRequest({ example, ...data }))}`
          : responseText(201, guestInvitationResponse({ example, ...data })),
    }[state.tab];
    showCode(text);
  }

  function renderLink() {
    const result = state.results[state.track];
    linkCard.hidden = !result;
    if (!result) return linkCard.replaceChildren();
    const title = node("h3", hostText("Guest link"), {
      id: "try-it-link-title",
    });
    if (result.failed) {
      linkCard.dataset.failed = "true";
      linkCard.replaceChildren(
        title,
        node(
          "p",
          hostText("The payment failed, so no guest link was created."),
          { class: "link-card__failed" },
        ),
      );
      return;
    }
    delete linkCard.dataset.failed;
    const link = result.link;
    const url = node("p", undefined, { class: "link-card__url", dir: "ltr" });
    url.append(node("bdi", link));
    const feedback = node("p", "", {
      class: "visually-hidden",
      role: "status",
      "aria-live": "polite",
    });
    const copy = node("button", hostText("Copy"), {
      type: "button",
      "data-copy-link": "",
    });
    copy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(link);
        copy.textContent = hostText("Copied");
        feedback.textContent = hostText("Link copied.");
        setTimeout(() => {
          if (copy.isConnected) copy.textContent = hostText("Copy");
        }, 2000);
      } catch {
        feedback.textContent = hostText(
          "Couldn't copy. Select the link and copy it.",
        );
        const range = document.createRange();
        range.selectNodeContents(url);
        getSelection()?.removeAllRanges();
        getSelection()?.addRange(range);
      }
    });
    const whatsapp = node("a", "WhatsApp", {
      class: "button-link",
      href: `https://wa.me/?text=${encodeURIComponent(
        hostText("Your guest link for {p0}: {p1}", {
          p0: example.name,
          p1: link,
        }),
      )}`,
      target: "_blank",
      rel: "noopener noreferrer",
      "data-whatsapp": "",
    });
    const qrButton = node("button", hostText("QR code"), {
      type: "button",
      class: "button-secondary",
      "aria-expanded": "false",
      "aria-controls": "try-it-qr",
    });
    const qrBox = node("div", undefined, {
      id: "try-it-qr",
      class: "link-card__qr",
      hidden: "",
    });
    qrButton.addEventListener("click", () => {
      const show = qrBox.hidden;
      if (show && !qrBox.firstChild) {
        const qr = qrcode(0, "M");
        qr.addData(link);
        qr.make();
        qrBox.append(
          node("img", undefined, {
            src: qr.createDataURL(4, 8),
            alt: hostText("QR code of the guest link"),
            width: "200",
            height: "200",
          }),
        );
      }
      qrBox.hidden = !show;
      qrButton.setAttribute("aria-expanded", String(show));
    });
    const open = node("a", hostText("Open as guest"), {
      class: "button-link",
      href: link,
      target: "_blank",
      rel: "noopener noreferrer",
      "data-open-guest": "",
    });
    const actions = node("div", undefined, { class: "link-card__actions" });
    actions.append(copy, whatsapp, qrButton, open);
    linkCard.replaceChildren(title, url, actions, qrBox, feedback);
  }

  function refresh() {
    renderLink();
    renderDeveloper();
  }

  function finish(result) {
    state.results[state.track] = result;
    refresh();
  }

  const linkFor = (data) =>
    demoGuestLink({
      kind: example.kind,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
    });

  function manualTrack() {
    const form = node("form", undefined, {
      class: "try-it__form",
      novalidate: "",
    });
    const input = (label, name, value, type = "text", extra = {}) => {
      const wrapper = node("label", hostText(label));
      const control = node("input", undefined, {
        name,
        type,
        value,
        autocomplete: "off",
        ...extra,
      });
      wrapper.append(control);
      form.append(wrapper);
      return control;
    };
    // What the person typed, kept across track switches.
    const draft = state.draft ?? {
      name: state.guest.name,
      phone: state.guest.phone,
      startsAt: localInputValue(state.startsAt),
      endsAt: localInputValue(state.endsAt),
    };
    const name = input("Guest name", "name", draft.name, "text", {
      maxlength: "120",
      dir: "auto",
    });
    const phone = input("Phone", "phone", draft.phone, "tel", {
      dir: "ltr",
      inputmode: "tel",
    });
    const arrive = input(
      "Arrives",
      "startsAt",
      draft.startsAt,
      "datetime-local",
    );
    const leave = input("Leaves", "endsAt", draft.endsAt, "datetime-local");
    const status = node("p", "", {
      class: "try-it__status",
      role: "status",
      "aria-live": "polite",
    });
    const submit = node("button", hostText("Create guest link"), {
      type: "submit",
    });
    form.append(status, submit);
    const read = () => ({
      name: name.value,
      phone: phone.value,
      startsAt: fromLocalInput(arrive.value),
      endsAt: fromLocalInput(leave.value),
    });
    // Every change is kept as typed, and once the form is valid the booking
    // system and payment tracks use the same guest and stay.
    form.addEventListener("input", () => {
      state.draft = {
        name: name.value,
        phone: phone.value,
        startsAt: arrive.value,
        endsAt: leave.value,
      };
      const values = read();
      if (stayProblem(values)) return;
      state.guest = { name: values.name.trim(), phone: e164(values.phone) };
      state.startsAt = values.startsAt;
      state.endsAt = values.endsAt;
    });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (state.busy) return;
      const values = read();
      const problem = stayProblem(values);
      if (problem) {
        status.textContent = hostText(problems[problem]);
        ({ name, phone, time: arrive, order: leave, length: leave })[
          problem
        ].focus();
        return;
      }
      state.guest = { name: values.name.trim(), phone: e164(values.phone) };
      state.startsAt = values.startsAt;
      state.endsAt = values.endsAt;
      state.busy = true;
      submit.disabled = true;
      status.textContent = hostText("Creating the guest link…");
      await pause(300);
      state.busy = false;
      if (!dialog.isConnected) return;
      submit.disabled = false;
      status.textContent = "";
      const data = snapshot();
      finish({ ...data, link: linkFor(data) });
    });
    return form;
  }

  function stepList() {
    return node("ol", undefined, {
      class: "try-it__steps",
      "aria-live": "polite",
    });
  }

  async function play(list, lines, buttons) {
    state.busy = true;
    for (const button of buttons) button.disabled = true;
    list.replaceChildren();
    for (const line of lines) {
      await pause(250);
      if (!dialog.isConnected) return false;
      list.append(node("li", hostText(line)));
    }
    state.busy = false;
    for (const button of buttons) button.disabled = false;
    return true;
  }

  function bookingTrack() {
    const box = node("div");
    const card = node("div", undefined, { class: "try-it__card" });
    const data = snapshot();
    card.append(
      node("p", hostText("Your booking system"), {
        class: "try-it__card-title",
      }),
      node("p", hostText("Booking A-212 · 212")),
      lineOf(
        node("p"),
        isolatedText("{p0} · {p1} → {p2}", {
          p0: data.guest.name,
          p1: when(data.startsAt),
          p2: when(data.endsAt),
        }),
      ),
      lineOf(
        node("p", undefined, { class: "try-it__mapping" }),
        isolatedText("212 in your booking system → {p0}", {
          p0: example.name,
        }),
      ),
    );
    const send = node("button", hostText("Send the booking to WIFIGATE"), {
      type: "button",
    });
    const list = stepList();
    send.addEventListener("click", async () => {
      if (state.busy) return;
      state.results.booking = undefined;
      refresh();
      if (!(await play(list, steps.booking, [send]))) return;
      const result = snapshot();
      finish({ ...result, link: linkFor(result) });
    });
    box.append(card, send, list);
    return box;
  }

  function paymentTrack() {
    const box = node("div");
    const card = node("div", undefined, {
      class: "try-it__card try-it__checkout",
    });
    card.append(
      node("p", hostText("Checkout"), { class: "try-it__card-title" }),
      node("p", hostText("Stay 212 · 1 night · ₪450"), {
        class: "try-it__price",
      }),
      node("p", hostText("Example: no money moves."), {
        class: "try-it__muted",
      }),
    );
    const pay = node("button", hostText("Simulate successful payment"), {
      type: "button",
    });
    const fail = node("button", hostText("Simulate failed payment"), {
      type: "button",
      class: "button-secondary try-it__chip",
    });
    const list = stepList();
    pay.addEventListener("click", async () => {
      if (state.busy) return;
      state.results.payment = undefined;
      refresh();
      if (!(await play(list, steps.payment, [pay, fail]))) return;
      const result = snapshot();
      finish({ ...result, link: linkFor(result) });
    });
    fail.addEventListener("click", () => {
      if (state.busy) return;
      list.replaceChildren();
      finish({ failed: true });
    });
    const buttons = node("div", undefined, { class: "try-it__buttons" });
    buttons.append(pay, fail);
    box.append(card, buttons, list);
    return box;
  }

  function chooseTrack(id) {
    if (state.busy) return;
    state.track = id;
    for (const [track, button] of trackButtons)
      button.setAttribute("aria-pressed", String(track === id));
    trackBody.replaceChildren(
      { manual: manualTrack, booking: bookingTrack, payment: paymentTrack }[
        id
      ](),
    );
    refresh();
  }

  dialog.addEventListener("close", () => {
    dialog.remove();
    if (openDialog === dialog) openDialog = undefined;
    if (trigger?.isConnected) trigger.focus();
  });
  // The default view: the guest form with the link for the default stay.
  const first = snapshot();
  state.results.manual = { ...first, link: linkFor(first) };
  chooseTrack("manual");
  container.append(dialog);
  dialog.showModal();
  trackButtons.get("manual").focus();
  return dialog;
}
