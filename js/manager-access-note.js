const element = (tag, text, className) => {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
};
export function accessNoteContent(note = {}, language = "en") {
  const t = (he, en) => language === "he" ? he : en;
  const content = element("div", undefined, "manager-access-note");
  const row = (parent, label, value) => {
    if (typeof value !== "string" || !value.trim()) return;
    const entry = element("div", undefined, "manager-access-note-row");
    entry.append(element("dt", label), element("dd", value));
    parent.append(entry);
  };
  const provider = element("dl");
  row(provider, t("נמסר על ידי", "Provided by"), note.residentName);
  if (provider.children.length) content.append(provider);
  const instructions = element("section");
  instructions.append(element("h3", t("הנחיות כניסה", "Entry instructions")));
  const text = element("p", typeof note.note === "string" && note.note.trim() ? note.note : t("לא נוספו הנחיות כניסה.", "No entry instructions added."));
  instructions.append(text);
  content.append(instructions);
  const arrival = element("section");
  arrival.append(element("h3", t("מיקום והגעה", "Location & arrival")));
  const details = element("dl");
  row(details, t("כתובת", "Address"), note.address);
  row(details, t("קומה", "Floor"), note.floorNumber);
  row(details, t("דירה", "Apartment"), note.apartmentNumber);
  row(details, t("מספר חניה", "Parking number"), note.parkingNumber);
  arrival.append(details);
  if (Number.isFinite(note.addressLatitude) && Number.isFinite(note.addressLongitude)) {
    const link = element("a", t("הצגה במפה", "View on map"));
    link.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(note.addressLatitude + "," + note.addressLongitude)}`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    arrival.append(link);
  }
  if (details.children.length || arrival.querySelector("a")) content.append(arrival);
  return content;
}
