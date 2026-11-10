import {
  createOrganizationLogo,
  hasOrganizationLogo,
} from "./manager-organization-card.js";
import { managerUiIcon } from "./manager-ui-icons.js";
import { createManagerSectionHeading } from "./manager-section-heading.js";
import {
  createOrganizationRoleCard,
  createOrganizationRoleMatrix,
  sharedOrganizationRole,
} from "./role-guide.js";

// Invitations keep the legacy names the API accepted before the shared roles,
// so admin and staff invitations work against either API version.
const invitationRole = {
  admin: "organization-admin",
  staff: "organization-user",
  viewer: "viewer",
};

const node = (tag, text, className) => {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text;
  if (className) el.className = className;
  return el;
};
const trash =
  '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 10v7M14 10v7"/></svg>';
// Scoped to the mounted dashboard and organization, never shared across accounts
// or persisted to browser storage. Refreshing after an edit preserves context.
const disclosureStates = new WeakMap();

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
  onSectionChange = () => {},
  partitioned = false,
  errorText,
  isCurrent,
}) {
  const t = (he, en) => (language === "he" ? he : en);
  const detail = await api(path);
  if (!isCurrent()) return null;
  const { organization: org, permissions, owner } = detail;
  // Older API responses count staff and viewers together as users.
  const counts = {
    ...detail.counts,
    staff: detail.counts?.staff ?? detail.counts?.users,
    viewers: detail.counts?.viewers ?? 0,
  };
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
  const roleOf = (member) => sharedOrganizationRole(member.role);
  // The server's legacy administrator total includes the owner. The people
  // directory uses four disjoint roles, counted from the loaded memberships.
  counts.owners = owner ? 1 : 0;
  for (const [key, role] of [["administrators", "admin"], ["staff", "staff"], ["viewers", "viewer"]]) {
    counts[key] = members.filter(m => m.status === "active" && roleOf(m) === role && m.uid !== owner?.uid).length;
  }
  const ownRole =
    owner?.uid === user.uid
      ? "owner"
      : sharedOrganizationRole(detail.role) ??
        roleOf(members.find((m) => m.uid === user.uid && m.status === "active") ?? {});
  const section = node("section", undefined, "manager-organization-workspace");
  if (permissions.openWorkspace !== false) {
    document.body.dataset.organizationRole = ownRole ?? "";
    const roleCard = createOrganizationRoleCard({
        product: "manager",
        language,
        role: ownRole,
        organizationName: org.name,
      });
    if (partitioned) roleCard.dataset.organizationSection = "settings";
    section.append(roleCard);
  }
  if (!disclosureStates.has(root)) disclosureStates.set(root, new Map());
  const states = disclosureStates.get(root);
  const stateKey = user.uid + ":" + path + ":" + org.id;
  if (!states.has(stateKey)) states.set(stateKey, {});
  const state = states.get(stateKey);
  const disclosure = (key, title, open = false) => {
    const details = node(
      "details",
      undefined,
      "dashboard-examples manager-organization-disclosure",
    );
    details.dataset.organizationDisclosure = key;
    details.dataset.organizationSection = key === "branding" ? "settings" : "people";
    details.open = state[key] ?? open;
    details.append(node("summary", title));
    details.addEventListener("toggle", () => {
      state[key] = details.open;
    });
    return details;
  };
  const branding = partitioned ? node("section", undefined, "manager-settings-brand-card") : disclosure(
    "branding",
    t("פרטי הארגון והלוגו", "Organization details and logo"),
  );
  if (partitioned) {
    branding.dataset.organizationSection = "settings";
    const brandHeading = node("div", undefined, "manager-settings-card-heading");
    brandHeading.append(managerUiIcon("organizations"), node("h4", t("לוגו הארגון", "Organization logo")));
    branding.append(brandHeading, node("p", t("כך הארגון שלכם מזוהה באתר וברשימות הארגונים.", "How your organization appears in its workspace and organization lists."), "manager-settings-card-description"));
  }
  const brandingBody = node(
    "div",
    undefined,
    "manager-organization-branding-body",
  );
  branding.append(brandingBody);
  const peopleDisclosure = partitioned ? node("section", undefined, "manager-organization-people-panel") : disclosure(
    "people",
    t("אנשי הארגון", "Organization people"),
  );
  if (partitioned) peopleDisclosure.dataset.organizationSection = "people";
  if (
    !partitioned &&
    Number.isSafeInteger(counts.administrators) &&
    Number.isSafeInteger(counts.staff) &&
    Number.isSafeInteger(counts.viewers)
  )
    peopleDisclosure
      .querySelector("summary")
      .append(
        node(
          "span",
          String(counts.owners + counts.administrators + counts.staff + counts.viewers),
          "manager-organization-people-count",
        ),
      );
  const peopleBody = node("div", undefined, "manager-organization-people-body");
  peopleDisclosure.append(peopleBody);
  const button = (text, action, cls = "") => {
    const b = node("button", text, "manager-button " + cls);
    b.type = "button";
    b.addEventListener("click", () => void run(action, b));
    return b;
  };
  const back = button(
    t("כל הארגונים", "All organizations"),
    onBack,
    "manager-organization-back",
  );
  const header = node("div", undefined, "manager-organization-header");
  if (partitioned) header.dataset.organizationSection = "settings";
  const artwork = createOrganizationLogo(
    org,
    language,
    "manager-organization-logo",
  );
  const validLogo = hasOrganizationLogo(org);
  const identity = node("div", undefined, "manager-organization-identity");
  identity.append(
    node(
      "span",
      partitioned ? t("הגדרות הארגון", "Organization settings") : t("סביבת הארגון", "Organization workspace"),
      "manager-eyebrow",
    ),
    node("h2", org.name),
    node(
      "p",
      partitioned
        ? t("שם הארגון, הלוגו והרשאות התפקיד שלכם", "Organization name, logo and your role permissions")
        : permissions.managePeople
        ? t(
            "ניהול האנשים והמערכות של הארגון",
            "Manage your organization’s people and systems",
          )
        : t(
            "גישה למערכות הארגון ולסביבת הניהול שלהן",
            "Access your organization’s systems and their workspaces",
          ),
    ),
  );
  const organizationTitle = identity.querySelector("h2");
  const nameRow = node("div", undefined, "manager-organization-name-row");
  organizationTitle.replaceWith(nameRow); nameRow.append(organizationTitle);
  if (permissions.manageLogo) {
    const editName = button("", async () => {
      const saved = await dialogs.form({
        title: t("שינוי שם הארגון", "Rename organization"),
        message: t("השם המעודכן יופיע לכל אנשי הארגון ובכל רשימות הארגונים.", "The updated name will appear for all organization members and in organization lists."),
        fields: [["name", t("שם הארגון", "Organization name")]],
        initialValues: { name: org.name },
        submitLabel: t("שמירת השם", "Save name"), errorText,
        onSubmit: async (values) => {
          if (!isCurrent()) throw new Error("CANCELLED");
          const name = values.name.trim();
          if (!name || name.length > 100) throw new Error("INVALID_REQUEST");
          if (name === org.name) return;
          await ensureRecent();
          if (!isCurrent()) throw new Error("CANCELLED");
          await api(path + "/name", "POST", { name, expectedVersion: org.version });
        },
      });
      if (saved && isCurrent()) await onRefresh();
    }, "manager-organization-rename");
    editName.setAttribute("aria-label", t("שינוי שם הארגון", "Rename organization"));
    editName.title = t("שינוי שם הארגון", "Rename organization");
    editName.innerHTML = '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15z"/></svg>';
    nameRow.append(editName);
  }
  const ownerLine = node("p", undefined, "manager-organization-owner-line");
  const ownerEmail = node("span", owner.email);
  ownerEmail.dir = "ltr";
  ownerLine.append(
    node("span", t("בעל הארגון", "Organization owner")),
    ownerEmail,
  );
  brandingBody.append(ownerLine);
  const headerActions = node("div", undefined, "manager-organization-header-actions");
  headerActions.append(back);
  if (permissions.managePeople === true && !partitioned) {
    const manage = button(t("ניהול ארגון", "Manage organization"), () => {
      if (!isCurrent()) return;
      onSectionChange("people");
      for (const fold of [branding, peopleDisclosure]) {
        fold.open = true;
        state[fold.dataset.organizationDisclosure] = true;
      }
      peopleDisclosure.querySelector("summary").focus({ preventScroll: true });
      peopleDisclosure.scrollIntoView({ block: "start", behavior: "auto" });
    }, "primary manager-organization-manage");
    headerActions.append(manage);
  }
  header.append(artwork, identity, headerActions);
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
    brandingBody.append(tools);
  }
  section.append(header);
  if (partitioned) {
    header.classList.add("manager-settings-identity");
    artwork.remove();
    brandingBody.prepend(artwork);
    identity.querySelector(".manager-eyebrow").textContent = t("שם הארגון", "Organization name");
    identity.querySelector("p").textContent = t("השם מוצג לכל אנשי הארגון ובכל רשימות הארגונים.", "This name appears for everyone in the organization and in organization lists.");
    const renameButton = nameRow.querySelector("button");
    if (renameButton) renameButton.append(node("span", t("עריכת שם", "Edit name")));
    else identity.append(node("small", t("לשינוי שם או לוגו, פנו לבעל הארגון או למנהל ארגון.", "Ask the owner or an organization admin to change the name or logo."), "manager-settings-readonly"));
  }
  if (partitioned) {
    const settingsHeader = createManagerSectionHeading({title:t("הגדרות הארגון", "Organization settings"),description:t("פרטי הארגון, המיתוג והתפקיד שלכם.", "Organization details, branding and your role."),icon:"settings",className:"manager-toolbar manager-people-page-heading"});
    settingsHeader.dataset.organizationSection = "settings";
    settingsHeader.querySelector(".manager-section-identity > div").prepend(node("span", org.name, "manager-people-eyebrow"));
    const refreshSettings = button(t("רענון", "Refresh"), onRefresh);
    refreshSettings.prepend(managerUiIcon("refresh"));
    settingsHeader.append(refreshSettings);
    section.prepend(settingsHeader);
    const peopleHeader = createManagerSectionHeading({title:t("אנשי הארגון", "Organization people"),description:t("האנשים שאיתכם, כל אחד והתפקיד שלו.", "Your team, with a clear role for everyone."),icon:"people",className:"manager-toolbar manager-people-page-heading"});
    peopleHeader.dataset.organizationSection = "people";
    peopleHeader.classList.add("manager-people-page-heading");
    peopleHeader.querySelector(".manager-section-identity > div").prepend(node("span", org.name, "manager-people-eyebrow"));
    const refreshPeople = button(t("רענון", "Refresh"), onRefresh);
    refreshPeople.prepend(managerUiIcon("refresh"));
    peopleHeader.append(refreshPeople);
    section.append(peopleHeader);
  }
  const metrics = node("div", undefined, "manager-organization-metrics");
  if (partitioned) metrics.classList.add("manager-people-metrics");
  if (partitioned) metrics.dataset.organizationSection = "people";
  for (const [key, label] of [
    ["owners", t("בעל הארגון", "Organization owner")],
    ["administrators", t("מנהלי ארגון", "Organization admins")],
    ["staff", t("צוות הארגון", "Organization staff")],
    ["viewers", t("צופים בארגון", "Organization viewers")],
    ["systems", t("מערכות", "Systems")],
  ]) {
    if (partitioned && key === "systems") continue;
    const tile = button(
      "",
      () => {
        onSectionChange(key === "systems" ? "systems" : "people");
        const target =
          key === "systems"
            ? root.querySelector('[data-organization-section="systems"]')
            : section.querySelector(
                `[data-organization-role="${{ owners: "owner", administrators: "admin", staff: "staff", viewers: "viewer" }[key]}"]`,
              );
        if (target) {
          const fold = target.closest("details");
          if (fold) {
            fold.open = true;
            state[fold.dataset.organizationDisclosure] = true;
          }
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
    if (partitioned) {
      tile.dataset.peopleRole = key;
      tile.prepend(managerUiIcon({ owners: "founder", administrators: "admin", staff: "people", viewers: "viewer" }[key]));
    }
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
  const searchField = node("span", undefined, "manager-people-search-field");
  searchField.append(managerUiIcon("search"), searchInput);
  search.append(searchField);
  const searchStatus = node("p", "", "manager-organization-search-status");
  searchStatus.setAttribute("role", "status");
  searchStatus.setAttribute("aria-live", "polite");
  peopleBody.append(search, searchStatus);
  const people = node("div", undefined, "manager-organization-people");
  const roleNames = {
    admin: t("מנהל ארגון", "Organization Admin"),
    staff: t("צוות הארגון", "Organization Staff"),
    viewer: t("צופה בארגון", "Organization Viewer"),
  };
  const invite = async (role) => {
    if (!Object.hasOwn(invitationRole, role) || !isCurrent()) return;
    const invitationTitle = {admin:t("הוספת מנהל לארגון", "Add an organization admin"),staff:t("הוספת צוות לארגון", "Add organization staff"),viewer:t("הוספת צופה לארגון", "Add an organization viewer")}[role];
    const roleSummary = createManagerSectionHeading({title:roleNames[role],description:org.name,icon:role === "staff" ? "people" : role,level:"h4",className:"manager-invitation-role"});
    roleSummary.dataset.role = role;
    const saved = await dialogs.form({
      title: invitationTitle,
      message: t(
        "הזינו את כתובת האימייל של מי שתרצו להזמין. ההצטרפות תושלם לאחר אישור ההזמנה בחשבון שלו. תפקיד בארגון אינו דורש מנוי.",
        "Enter the email address of the person you want to invite. They will join after accepting in their account. An organization role needs no subscription.",
      ),
      fields: [["email", t("כתובת אימייל", "Email address"), "email"]],
      content: roleSummary,
      submitLabel: t("שליחת הזמנה", "Send invitation"),
      errorText,
      onSubmit: async (values) => {
        if (!isCurrent()) throw new Error("CANCELLED");
        await ensureRecent();
        if (!isCurrent()) throw new Error("CANCELLED");
        await api(path + "/invitations", "POST", {
          email: values.email.trim().toLowerCase(),
          role: invitationRole[role],
        });
      },
    });
    if (saved && isCurrent()) await onRefresh();
  };
  for (const [role, label, count] of [
    ["owner", t("בעל הארגון", "Organization owner"), counts.owners],
    ["admin", t("מנהלי הארגון", "Organization admins"), counts.administrators],
    ["staff", t("צוות הארגון", "Organization staff"), counts.staff],
    ["viewer", t("צופים בארגון", "Organization viewers"), counts.viewers],
  ]) {
    const column = node(
        "section",
        undefined,
        "manager-organization-person-column",
      ),
      heading = node("div", undefined, "manager-organization-people-head");
    column.dataset.organizationRole = role;
    const title = node("div", undefined, "manager-organization-people-title");
    const roleIcon = node("span", undefined, "manager-people-role-icon");
    roleIcon.append(managerUiIcon(role === "owner" ? "founder" : role === "staff" ? "people" : role));
    title.append(roleIcon);
    title.append(
      node("h3", label),
      node("span", String(count ?? 0), "manager-organization-people-count"),
    );
    heading.append(title);
    heading.append(node("p", {
      owner:t("כל הרשאות הארגון, כולל מערכות ובעלות.", "Full organization permissions, including systems and ownership."),
      admin:t("ניהול אנשים, מיתוג ותפעול שוטף.", "People, branding and daily operations."),
      staff:t("תפעול שערים והגדרת Wi-Fi.", "Gate operation and Wi-Fi setup."),
      viewer:t("צפייה בארגון, באנשים ובשערים.", "View the organization, people and gates."),
    }[role], "manager-people-role-description"));
    if (permissions.managePeople && role !== "owner") {
        const addPerson = button(
          { admin: t("הוספת מנהל", "Add admin"), staff: t("הוספת צוות", "Add staff"), viewer: t("הוספת צופה", "Add viewer") }[role],
          () => invite(role),
          "primary manager-people-add",
        );
        addPerson.prepend(managerUiIcon("add"));
        heading.append(addPerson);
      }
    if (role === "owner") {
      const protectedRole = node("span", t("בעלות הארגון", "Organization ownership"), "manager-people-owner-locked");
      protectedRole.prepend(managerUiIcon("admin"));
      heading.append(protectedRole);
    }
    column.append(heading);
    const rows = members.filter(
      (m) => m.status === "active" && roleOf(m) === role && m.uid !== owner.uid,
    );
    if (role === "owner" && owner)
      rows.unshift({ ...owner, isOwner: true });
    if (!rows.length) {
      const empty = node("div", undefined, "manager-people-role-empty");
      empty.append(managerUiIcon(role === "staff" ? "people" : role), node("strong", t("עדיין אין אנשים בתפקיד הזה", "No people in this role yet")), node("p", permissions.managePeople ? t("כשתזמינו אנשים והם יאשרו, הם יופיעו כאן.", "Invite someone to this role. They will appear here after accepting.") : t("אנשים שיצטרפו בתפקיד הזה יופיעו כאן.", "People who join in this role will appear here.")));
      column.append(empty);
    }
    for (const person of rows) {
      const row = node("div", undefined, "manager-organization-person"),
        avatar = node(
          "span",
          person.email?.slice(0, 1).toUpperCase(),
          "manager-organization-person-avatar",
        );
      row.dataset.organizationEmail = person.email?.toLowerCase() ?? "";
      if (person.isOwner) {
        row.dataset.owner = "true";
        avatar.replaceChildren(managerUiIcon("founder"));
      }
      avatar.setAttribute("aria-hidden", "true");
      const text = node("div");
      const email = node("strong", person.email);
      email.dir = "ltr";
      text.append(
        email,
        node(
          "small",
          person.isOwner
            ? t("בעל הארגון", "Organization Owner")
            : roleNames[role],
        ),
      );
      row.append(avatar, text);
      if (person.uid === user.uid) text.append(node("span", t("את/ה", "You"), "manager-people-you"));
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
  peopleBody.append(people);
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
        ".manager-people-role-empty",
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
  if (partitioned) {
    const settingsGrid = node("div", undefined, "manager-settings-grid");
    settingsGrid.dataset.organizationSection = "settings";
    const accessCard = node("section", undefined, "manager-settings-access-card");
    const roleCard = section.querySelector(":scope > .role-guide-card");
    if (roleCard) {
      const roleDetails = roleCard.querySelector(".role-guide-card__details");
      if (roleDetails) roleDetails.open = true;
      accessCard.append(roleCard);
    }
    const ownerHeading = node("div", undefined, "manager-settings-card-heading");
    ownerHeading.append(managerUiIcon("founder"), node("h4", t("בעלות הארגון", "Organization ownership")));
    accessCard.append(ownerHeading, ownerLine);
    settingsGrid.append(branding, accessCard);
    section.append(settingsGrid, peopleDisclosure);
  } else section.append(branding, peopleDisclosure);
  if (invitations.length) {
    const pending = disclosure(
      "pending",
      t("הזמנות ממתינות", "Pending invitations"),
      true,
    );
    pending.classList.add("manager-organization-pending");
    const pendingBody = node(
      "div",
      undefined,
      "manager-organization-pending-body",
    );
    pending.append(pendingBody);
    pending
      .querySelector("summary")
      .append(
        node(
          "span",
          String(invitations.length),
          "manager-organization-people-count",
        ),
      );
    for (const inv of invitations) {
      const row = node("div", undefined, "manager-organization-person");
      const email = node("strong", inv.email);
      email.dir = "ltr";
      row.append(
        email,
        node(
          "span",
          roleNames[sharedOrganizationRole(inv.role) ?? "admin"],
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
      pendingBody.append(row);
    }
    pending.dataset.organizationSection = "people";
    section.append(pending);
  }
  // What each role can do, last in the organization's people.
  if (permissions.openWorkspace !== false) {
    const roleMatrix = createOrganizationRoleMatrix({
      product: "manager",
      language,
      role: ownRole,
    });
    if (partitioned) {
      roleMatrix.dataset.organizationSection = "people";
      section.append(roleMatrix);
    } else peopleBody.append(roleMatrix);
  }
  root.append(section);
  return detail;
}
