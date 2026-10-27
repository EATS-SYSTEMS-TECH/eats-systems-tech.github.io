const node = (tag, text, className) => {
  const value = document.createElement(tag);
  if (text !== undefined) value.textContent = text;
  if (className) value.className = className;
  return value;
};
export const validOrganizationLogo = (value) =>
  typeof value === "string" &&
  value.length <= 32022 &&
  /^data:image\/png;base64,[A-Za-z0-9+/]+=*$/.test(value);

export function createOrganizationLogo(org, language, className) {
  const artwork = node("div", undefined, className);
  if (validOrganizationLogo(org.logoDataUrl)) {
    const image = node("img");
    image.src = org.logoDataUrl;
    image.alt = (language === "he" ? "לוגו של " : "Logo of ") + org.name;
    artwork.append(image);
  } else {
    artwork.textContent = org.name.trim().slice(0, 1).toUpperCase();
    artwork.setAttribute("aria-hidden", "true");
  }
  return artwork;
}

/** Owned, appointed and simulated organizations share one card structure. */
export function createManagerOrganizationCard({
  organization: org,
  language = "en",
  actions,
  example = false,
}) {
  const t = (he, en) => (language === "he" ? he : en);
  const card = node("article", undefined, "manager-card manager-org-column");
  actions.firstElementChild?.classList.add("primary");
  if (example) card.dataset.exampleOrganization = "true";
  else card.dataset.organization = org.id;
  const identity = node("div", undefined, "manager-org-identity");
  const name = node("div", undefined, "manager-org-name");
  name.append(node("small", t("ארגון", "Organization")), node("h4", org.name));
  identity.append(
    createOrganizationLogo(org, language, "manager-org-avatar"),
    name,
  );
  if (example)
    identity.append(
      node("span", t("דוגמה", "Example"), "manager-example-badge"),
    );
  card.append(identity);
  const owner = node("section", undefined, "manager-org-owner");
  const email = node("strong", org.owner?.email ?? t("לא זמין", "Unavailable"));
  email.dir = "ltr";
  owner.append(node("small", t("בעל הארגון", "Organization owner")), email);
  card.append(owner);
  const count = node("p", undefined, "manager-org-count");
  count.append(
    node("b", String(org.linkedSystemCount)),
    node("span", t("מערכות מקושרות", "Linked systems")),
  );
  card.append(count, actions);
  return card;
}
