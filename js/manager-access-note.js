const element = (tag, text, className) => {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  if (["p", "dd", "strong"].includes(tag)) node.dir = "auto";
  return node;
};
// Fixed provider hosts; displaying a note never sends its address to them.
export function arrivalLinks(note = {}) {
  const { addressLatitude: lat, addressLongitude: lon } = note;
  const coordinates =
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lon) <= 180;
  const address = typeof note.address === "string" ? note.address.trim() : "";
  if (!coordinates && !address) return [];
  const query = encodeURIComponent(coordinates ? `${lat},${lon}` : address);
  return [
    {
      name: "Google Maps",
      icon: "google-maps.svg",
      href: `https://www.google.com/maps/search/?api=1&query=${query}`,
    },
    {
      name: "Waze",
      icon: "waze.svg",
      href: `https://www.waze.com/ul?${coordinates ? "ll" : "q"}=${query}&navigate=yes`,
    },
  ];
}
export function accessNoteContent(note = {}, language = "en") {
  const t = (he, en) => (language === "he" ? he : en);
  const content = element("div", undefined, "manager-access-note");
  const row = (parent, label, value) => {
    if (typeof value !== "string" || !value.trim()) return;
    const entry = element("div", undefined, "manager-access-note-row");
    entry.append(element("dt", label), element("dd", value));
    parent.append(entry);
  };
  if (typeof note.residentName === "string" && note.residentName.trim()) {
    const provider = element("section", undefined, "manager-access-provider");
    const avatar = element(
      "span",
      note.residentName.trim().slice(0, 1),
      "manager-access-avatar",
    );
    avatar.setAttribute("aria-hidden", "true");
    const person = element("div");
    person.append(
      element("span", t("נמסר על ידי", "Provided by")),
      element("strong", note.residentName),
    );
    provider.append(avatar, person);
    content.append(provider);
  }
  const instructions = element(
    "section",
    undefined,
    "manager-access-instructions",
  );
  instructions.append(element("h3", t("הנחיות כניסה", "Entry instructions")));
  const text = element(
    "p",
    typeof note.note === "string" && note.note.trim()
      ? note.note
      : t("לא נוספו הנחיות כניסה.", "No entry instructions added."),
  );
  instructions.append(text);
  content.append(instructions);
  const arrival = element("section", undefined, "manager-access-arrival");
  arrival.append(element("h3", t("מיקום והגעה", "Location & arrival")));
  if (typeof note.address === "string" && note.address.trim()) {
    const address = element("div", undefined, "manager-access-address");
    address.append(
      element("span", t("כתובת", "Address")),
      element("p", note.address),
    );
    arrival.append(address);
  }
  const details = element("dl", undefined, "manager-access-metrics");
  row(details, t("קומה", "Floor"), note.floorNumber);
  row(details, t("דירה", "Apartment"), note.apartmentNumber);
  row(details, t("מספר חניה", "Parking number"), note.parkingNumber);
  arrival.append(details);
  const navigation = element("nav", undefined, "manager-access-navigation");
  navigation.setAttribute(
    "aria-label",
    t("ניווט לכתובת", "Navigate to address"),
  );
  for (const target of arrivalLinks(note)) {
    const link = element("a");
    link.href = target.href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute(
      "aria-label",
      t("ניווט עם ", "Navigate with ") + target.name,
    );
    const icon = element("img");
    icon.src = "/assets/icons/" + target.icon;
    icon.width = 24;
    icon.height = 24;
    icon.alt = "";
    link.append(icon, element("span", target.name));
    navigation.append(link);
  }
  if (navigation.children.length) arrival.append(navigation);
  if (
    details.children.length ||
    arrival.querySelector("a") ||
    arrival.querySelector(".manager-access-address")
  )
    content.append(arrival);
  return content;
}
