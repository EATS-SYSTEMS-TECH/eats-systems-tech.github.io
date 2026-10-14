import { hostText } from "./host-locale.js";
import { node, infoTip } from "./host-ui.js";
import qrcode from "./vendor/qrcode-generator.js";

// A QR code holds up to 2,953 bytes (error correction L); a Group's link
// can be longer. The image of the link, or null when it does not fit.
const qrLimit = 2953;
export function guestLinkQr(url) {
  for (const level of ["M", "L"])
    try {
      const qr = qrcode(0, level);
      qr.addData(url);
      qr.make();
      return qr.createDataURL(4, 8);
    } catch {
      // Too long for this level: try the next one.
    }
  return null;
}

// A real guest link, ready to share: the link, Copy, WhatsApp to the guest's
// own number, and a QR code. The card is the confirmation; nothing else says
// that it worked.
let cards = 0;
export function guestLinkCard({ url, phone, systemName }) {
  const id = `guest-link-${++cards}`;
  const card = node("div", undefined, {
    class: "link-card",
    "data-guest-link": "",
    "aria-labelledby": `${id}-title`,
    role: "group",
  });
  const title = node("h3", hostText("Guest link"), { id: `${id}-title` });
  const address = node("p", undefined, { class: "link-card__url", dir: "ltr" });
  address.append(node("bdi", url));
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
      await navigator.clipboard.writeText(url);
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
      range.selectNodeContents(address);
      getSelection()?.removeAllRanges();
      getSelection()?.addRange(range);
    }
  });
  // wa.me opens a chat with the guest's number (digits only, no +).
  const digits = String(phone ?? "").replace(/\D/g, "");
  const message = hostText("Your guest link for {p0}: {p1}", {
    p0: systemName,
    p1: url,
  });
  const whatsapp = node("a", "WhatsApp", {
    class: "button-link",
    href: `https://wa.me/${digits}?text=${encodeURIComponent(message)}`,
    target: "_blank",
    rel: "noopener noreferrer",
    "data-whatsapp": "",
  });
  const qrButton = node("button", hostText("QR code"), {
    type: "button",
    class: "button-secondary",
    "aria-expanded": "false",
    "aria-controls": `${id}-qr`,
  });
  const qrBox = node("div", undefined, {
    id: `${id}-qr`,
    class: "link-card__qr",
    hidden: "",
  });
  const actions = node("div", undefined, { class: "link-card__actions" });
  // A link too long for a QR code: the button stays, disabled, with why.
  const tooLong = () => {
    qrButton.disabled = true;
    qrButton.removeAttribute("aria-expanded");
    qrButton.removeAttribute("aria-controls");
    qrBox.hidden = true;
    const holder = node("span", undefined, { class: "system-action-blocked" });
    qrButton.replaceWith(holder);
    holder.append(
      qrButton,
      infoTip(
        hostText("This link is too long for a QR code. Use Copy or WhatsApp."),
      ),
    );
  };
  qrButton.addEventListener("click", () => {
    const show = qrBox.hidden;
    if (show && !qrBox.firstChild) {
      const image = guestLinkQr(url);
      if (!image) {
        tooLong();
        feedback.textContent = hostText(
          "This link is too long for a QR code. Use Copy or WhatsApp.",
        );
        copy.focus();
        return;
      }
      qrBox.append(
        node("img", undefined, {
          src: image,
          alt: hostText("QR code of the guest link"),
          width: "200",
          height: "200",
        }),
      );
    }
    qrBox.hidden = !show;
    qrButton.setAttribute("aria-expanded", String(show));
  });
  actions.append(copy, whatsapp, qrButton);
  if (new TextEncoder().encode(url).length > qrLimit) tooLong();
  card.append(title, address, actions, qrBox, feedback);
  return card;
}
