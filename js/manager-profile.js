import { attachPopover } from "./popover.js";

// Mounted once per page so authentication refreshes never duplicate listeners.
export function createManagerProfile({
  root,
  language = "en",
  product = "manager",
}) {
  if (!root) return;
  const he = language === "he";
  root.innerHTML = `
    <button id="manager-profile-button" class="manager-profile-button dashboard-profile-button" type="button" aria-haspopup="dialog" aria-controls="manager-profile-panel" disabled>
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/></svg>
    </button>
    <section id="manager-profile-panel" class="manager-profile-panel dashboard-profile-panel" role="dialog" tabindex="-1" hidden>
      <a class="manager-profile-identity dashboard-profile-identity"><span id="platform-avatar" class="platform-avatar" aria-hidden="true"></span><div><strong id="platform-account" dir="auto"></strong><span id="manager-profile-email" dir="ltr"></span></div></a>
      <div id="manager-profile-roles" class="manager-profile-roles dashboard-profile-roles"></div>
      <button id="platform-sign-out" class="platform-sign-out" type="button" data-copy="signOut" disabled></button>
    </section>`;
  const find = (selector) => root.querySelector(selector);
  find(".dashboard-profile-identity").href = he
    ? "/dashboard/?lang=he"
    : "/dashboard/";
  const button = find("#manager-profile-button");
  const panel = find("#manager-profile-panel");
  panel.setAttribute("aria-label", he ? "הפרופיל שלי" : "My profile");
  button.setAttribute("aria-label", he ? "הפרופיל שלי" : "My profile");
  find("#platform-sign-out").textContent = he ? "התנתקות" : "Sign out";
  const popover = attachPopover(button, panel, { align: "end" });
  return {
    update(profile, user = {}) {
      const name =
        profile.user?.name ||
        user.displayName ||
        profile.user?.email ||
        user.email ||
        "WIFIGATE";
      find("#platform-account").textContent = name;
      find("#platform-avatar").textContent = [...name][0].toLocaleUpperCase(
        language,
      );
      find("#manager-profile-email").textContent =
        profile.user?.email || user.email || "";
      const roles = find("#manager-profile-roles");
      roles.replaceChildren();
      for (const role of profile.roles?.length
        ? profile.roles
        : [profile.role].filter(Boolean)) {
        const badge = document.createElement("span");
        badge.className = "manager-role-badge";
        badge.textContent =
          {
            admin: `WIFIGATE ${product === "host" ? "Host" : product === "pay" ? "Pay" : "Manager"} admin`,
            user: `WIFIGATE ${product === "host" ? "Host" : product === "pay" ? "Pay" : "Manager"} user`,
            "organization-admin": `WIFIGATE ${product === "host" ? "Host" : "Manager"} organization admin`,
          }[role] || (he ? "ממתין להרשאה" : "Access pending");
        roles.append(badge);
      }
      button.disabled = false;
      if (product === "manager" && "role" in profile)
        document.body.classList.add("manager-ready");
      if (popover.isOpen) popover.place();
    },
    clear() {
      popover.close();
      button.disabled = true;
      for (const selector of [
        "#platform-account",
        "#platform-avatar",
        "#manager-profile-email",
        "#manager-profile-roles",
      ])
        find(selector).replaceChildren();
      document.body.classList.remove("manager-ready");
    },
  };
}
