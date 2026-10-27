import {
  createOrganizationLogo,
  validOrganizationLogo,
} from "./manager-organization-card.js";

const node = (tag, text, className) => {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text;
  if (className) el.className = className;
  return el;
};
const trash =
  '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 10v7M14 10v7"/></svg>';

/** Normalize locally before transmission: no metadata, external image URL or active format. */
export async function prepareOrganizationLogo(file) {
  if (
    !file ||
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size > 5 * 1024 * 1024
  )
    throw new Error("INVALID_ORGANIZATION_LOGO");
  const image = await createImageBitmap(file).catch(() => {
    throw new Error("INVALID_ORGANIZATION_LOGO");
  });
  try {
    if (!image.width || !image.height || image.width * image.height > 20000000)
      throw new Error("INVALID_ORGANIZATION_LOGO");
    for (const size of [256, 192, 128, 96]) {
      const canvas = document.createElement("canvas");
      const ratio = Math.min(size / image.width, size / image.height, 1);
      canvas.width = Math.max(1, Math.round(image.width * ratio));
      canvas.height = Math.max(1, Math.round(image.height * ratio));
      canvas
        .getContext("2d")
        .drawImage(image, 0, 0, canvas.width, canvas.height);
      const result = canvas.toDataURL("image/png");
      if (result.length <= 32022) return result;
    }
    throw new Error("INVALID_ORGANIZATION_LOGO");
  } finally {
    image.close();
  }
}

export async function renderManagerOrganization({
  root,
  path,
  api,
  language,
  user,
  dialogs,
  ensureRecent,
  run,
  onRefresh,
  onBack,
  errorText,
  isCurrent,
}) {
  const t = (he, en) => (language === "he" ? he : en);
  const detail = await api(path);
  if (!isCurrent()) return null;
  const { organization: org, permissions, owner, counts } = detail;
  const all = async (suffix) => {
    const items = [],
      seen = new Set();
    let cursor;
    do {
      const row = await api(
        path +
          suffix +
          "?limit=100" +
          (cursor ? "&cursor=" + encodeURIComponent(cursor) : ""),
      );
      items.push(...row.items);
      cursor = row.nextCursor;
      if ((cursor && seen.has(cursor)) || items.length > 10000)
        throw new Error("LIST_LIMIT");
      if (cursor) seen.add(cursor);
    } while (cursor);
    return items;
  };
  const [members, invitations] = await Promise.all([
    all("/members"),
    permissions.managePeople ? all("/invitations") : [],
  ]);
  if (!isCurrent()) return null;
  const section = node("section", undefined, "manager-organization-workspace");
  const button = (text, action, cls = "") => {
    const b = node("button", text, "manager-button " + cls);
    b.type = "button";
    b.addEventListener("click", () => void run(action, b));
    return b;
  };
  section.append(
    button(
      t("כל הארגונים", "All organizations"),
      onBack,
      "manager-organization-back",
    ),
  );
  const header = node("div", undefined, "manager-organization-header");
  const artwork = createOrganizationLogo(
    org,
    language,
    "manager-organization-logo",
  );
  const validLogo = validOrganizationLogo(org.logoDataUrl);
  const identity = node("div", undefined, "manager-organization-identity");
  identity.append(
    node(
      "span",
      t("סביבת הארגון", "Organization workspace"),
      "manager-eyebrow",
    ),
    node("h2", org.name),
    node(
      "p",
      permissions.managePeople
        ? t(
            "ניהול האנשים והמערכות של הארגון",
            "Manage your organization’s people and systems",
          )
        : t(
            "צפייה באנשים ובמערכות של הארגון",
            "View your organization’s people and systems",
          ),
    ),
  );
  const ownerLine = node("p", undefined, "manager-organization-owner-line");
  const ownerEmail = node("span", owner.email);
  ownerEmail.dir = "ltr";
  ownerLine.append(
    node("span", t("בעל הארגון", "Organization owner")),
    ownerEmail,
  );
  identity.append(ownerLine);
  header.append(artwork, identity);
  if (permissions.manageLogo) {
    const tools = node("div", undefined, "manager-organization-brand-actions");
    const input = node("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp";
    input.hidden = true;
    input.setAttribute("aria-label", t("בחירת קובץ לוגו", "Choose logo file"));
    const upload = button(
      validLogo
        ? t("החלפת לוגו", "Change logo")
        : t("העלאת לוגו", "Upload logo"),
      () => input.click(),
    );
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      input.value = "";
      if (!file) return;
      void run(async () => {
        const dataUrl = await prepareOrganizationLogo(file);
        if (!isCurrent()) return;
        const preview = node(
            "div",
            undefined,
            "manager-organization-logo-preview",
          ),
          image = node("img");
        image.src = dataUrl;
        image.alt = t("תצוגה מקדימה של הלוגו", "Logo preview");
        preview.append(image);
        const saved = await dialogs.form({
          title: t("עדכון לוגו הארגון", "Update organization logo"),
          message: t(
            "כך הלוגו יוצג בסביבת הארגון.",
            "This logo will appear in your organization workspace.",
          ),
          content: preview,
          fields: [],
          submitLabel: t("שמירת לוגו", "Save logo"),
          errorText,
          onSubmit: async () => {
            if (!isCurrent()) throw new Error("CANCELLED");
            await ensureRecent();
            await api(path + "/logo", "POST", {
              logoDataUrl: dataUrl,
              expectedVersion: org.version,
            });
          },
        });
        if (saved && isCurrent()) await onRefresh();
      }, upload);
    });
    tools.append(
      input,
      upload,
      node(
        "small",
        t("PNG, JPG או WebP · עד 5 MB", "PNG, JPG or WebP · up to 5 MB"),
      ),
    );
    if (validLogo)
      tools.append(
        button(t("הסרת לוגו", "Remove logo"), async () => {
          if (
            !(await dialogs.confirm(
              t("להסיר את לוגו הארגון?", "Remove the organization logo?"),
            ))
          )
            return;
          await ensureRecent();
          await api(path + "/logo", "POST", {
            logoDataUrl: null,
            expectedVersion: org.version,
          });
          await onRefresh();
        }),
      );
    header.append(tools);
  }
  section.append(header);
  const metrics = node("div", undefined, "manager-organization-metrics");
  for (const [key, label] of [
    ["administrators", t("מנהלי ארגון", "Organization admins")],
    ["users", t("משתמשי ארגון", "Organization users")],
    ["systems", t("מערכות", "Systems")],
  ]) {
    const tile = button(
      "",
      () => {
        const target =
          key === "systems"
            ? root.querySelector('[data-organization-section="systems"]')
            : section.querySelector(
                `[data-organization-role="organization-${key === "users" ? "user" : "admin"}"]`,
              );
        if (target) {
          target.tabIndex = -1;
          target.focus({ preventScroll: true });
          target.scrollIntoView({ block: "start", behavior: "auto" });
        }
      },
      "manager-organization-metric",
    );
    tile.append(
      node(
        "strong",
        Number.isSafeInteger(counts[key])
          ? String(counts[key])
          : t("לא זמין", "Unavailable"),
      ),
      node("span", label),
    );
    metrics.append(tile);
  }
  section.append(metrics);
  const search = node("label", undefined, "manager-organization-search");
  search.append(
    node("span", t("חיפוש באנשי הארגון", "Search organization people")),
  );
  const searchInput = node("input");
  searchInput.type = "search";
  searchInput.placeholder = t("חיפוש לפי אימייל", "Search by email");
  searchInput.setAttribute(
    "aria-label",
    t("חיפוש באנשי הארגון", "Search organization people"),
  );
  search.append(searchInput);
  const searchStatus = node("p", "", "manager-organization-search-status");
  searchStatus.setAttribute("role", "status");
  searchStatus.setAttribute("aria-live", "polite");
  section.append(search, searchStatus);
  const people = node("div", undefined, "manager-organization-people");
  const invite = async (role) => {
    const saved = await dialogs.form({
      title:
        role === "organization-admin"
          ? t("הוספת מנהל ארגון", "Add organization admin")
          : t("הוספת משתמש לארגון", "Add organization user"),
      message:
        role === "organization-admin"
          ? t(
              "מנהל יוכל לנהל חברים, לוגו ומערכות בארגון הזה בלבד. ההזמנה תמתין לאישור בחשבון שלו.",
              "An admin can manage people, branding and systems in this organization only. The invitation waits for acceptance in their account.",
            )
          : t(
              "המשתמש יוכל לצפות באנשי הארגון ובפרטי המערכות. לא תינתן הרשאת ניהול שער.",
              "The user can view organization members and system details. Hardware management is not granted.",
            ),
      fields: [["email", t("כתובת אימייל", "Email address"), "email"]],
      submitLabel: t("יצירת הזמנה", "Create invitation"),
      errorText,
      onSubmit: async (values) => {
        await ensureRecent();
        await api(path + "/invitations", "POST", {
          email: values.email.trim().toLowerCase(),
          role,
        });
      },
    });
    if (saved && isCurrent()) await onRefresh();
  };
  for (const [role, label] of [
    ["organization-admin", t("מנהלי הארגון", "Organization admins")],
    ["organization-user", t("משתמשי הארגון", "Organization users")],
  ]) {
    const column = node(
        "section",
        undefined,
        "manager-organization-person-column",
      ),
      heading = node("div", undefined, "manager-organization-people-head");
    column.dataset.organizationRole = role;
    const title = node("div", undefined, "manager-organization-people-title");
    title.append(
      node("h3", label),
      node(
        "span",
        String(
          counts[role === "organization-admin" ? "administrators" : "users"],
        ),
        "manager-organization-people-count",
      ),
    );
    heading.append(title);
    if (permissions.managePeople)
      heading.append(
        button(
          role === "organization-admin"
            ? t("הוספת מנהל", "Add admin")
            : t("הוספת משתמש", "Add user"),
          () => invite(role),
          "primary",
        ),
      );
    column.append(heading);
    const rows = members.filter(
      (m) => m.status === "active" && m.role === role && m.uid !== owner.uid,
    );
    if (role === "organization-admin")
      rows.unshift({ ...owner, isOwner: true });
    if (!rows.length)
      column.append(
        node(
          "p",
          t("עדיין אין משתמשים בארגון", "No users in this organization yet"),
          "manager-muted",
        ),
      );
    for (const person of rows) {
      const row = node("div", undefined, "manager-organization-person"),
        avatar = node(
          "span",
          person.email?.slice(0, 1).toUpperCase(),
          "manager-organization-person-avatar",
        );
      row.dataset.organizationEmail = person.email?.toLowerCase() ?? "";
      avatar.setAttribute("aria-hidden", "true");
      const text = node("div");
      const email = node("strong", person.email);
      email.dir = "ltr";
      text.append(
        email,
        node(
          "small",
          person.isOwner
            ? t("בעל הארגון", "Organization owner")
            : role === "organization-admin"
              ? t("מנהל ארגון", "Organization admin")
              : t("משתמש · צפייה בלבד", "User · View only"),
        ),
      );
      row.append(avatar, text);
      if (
        permissions.managePeople &&
        !person.isOwner &&
        person.uid !== user.uid
      ) {
        const remove = button(
          "",
          async () => {
            if (
              !(await dialogs.confirm(
                t(
                  `להסיר את הגישה של ${person.email} לארגון הזה? החשבון והגישה לארגונים אחרים יישארו.`,
                  `Remove ${person.email} from this organization? Their account and access to other organizations will remain.`,
                ),
              ))
            )
              return;
            await ensureRecent();
            await api(
              path + "/members/" + encodeURIComponent(person.uid) + "/remove",
              "POST",
              {},
            );
            await onRefresh();
          },
          "danger manager-organization-remove",
        );
        remove.innerHTML = trash;
        remove.setAttribute("aria-label", t("הסרת ", "Remove ") + person.email);
        row.append(remove);
      }
      column.append(row);
    }
    const noMatches = node(
      "p",
      t("לא נמצאו אנשים מתאימים", "No matching people"),
      "manager-muted manager-organization-search-empty",
    );
    noMatches.hidden = true;
    column.append(noMatches);
    people.append(column);
  }
  section.append(people);
  searchInput.addEventListener("input", () => {
    const term = searchInput.value.trim().toLowerCase();
    const rows = [...people.querySelectorAll("[data-organization-email]")];
    rows.forEach((row) => {
      row.hidden = !row.dataset.organizationEmail.includes(term);
    });
    for (const column of people.children) {
      const visible = [
        ...column.querySelectorAll("[data-organization-email]"),
      ].some((row) => !row.hidden);
      column.querySelector(".manager-organization-search-empty").hidden =
        !term || visible;
      const empty = column.querySelector(
        ".manager-muted:not(.manager-organization-search-empty)",
      );
      if (empty) empty.hidden = Boolean(term);
    }
    const shown = rows.filter((row) => !row.hidden).length;
    searchStatus.textContent = term
      ? t(
          `מוצגים ${shown} מתוך ${rows.length} אנשים`,
          `Showing ${shown} of ${rows.length} people`,
        )
      : "";
  });
  if (invitations.length) {
    const pending = node("section", undefined, "manager-organization-pending");
    pending.append(node("h3", t("הזמנות ממתינות", "Pending invitations")));
    for (const inv of invitations) {
      const row = node("div", undefined, "manager-organization-person");
      const email = node("strong", inv.email);
      email.dir = "ltr";
      row.append(
        email,
        node(
          "span",
          inv.role === "organization-user"
            ? t("משתמש", "User")
            : t("מנהל ארגון", "Organization admin"),
        ),
        button(t("ביטול הזמנה", "Cancel invitation"), async () => {
          if (
            !(await dialogs.confirm(
              t(
                "לבטל את ההזמנה לארגון?",
                "Cancel this organization invitation?",
              ),
            ))
          )
            return;
          await ensureRecent();
          await api(
            path + "/invitations/" + encodeURIComponent(inv.id) + "/cancel",
            "POST",
            {},
          );
          await onRefresh();
        }),
      );
      pending.append(row);
    }
    section.append(pending);
  }
  root.append(section);
  return detail;
}
