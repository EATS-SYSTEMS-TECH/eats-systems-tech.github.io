import { renderProfileAvatar } from "./profile-avatar.js";
import { renderProfileRoles } from "./profile-roles.js";
import {
  hostText,
  hostLocale,
  hostLanguage,
  initializeHostLocale,
  installHostLanguageSelector,
} from "./host-locale.js";
import "./host-dashboard-navigation.js";
import {
  loadAdminOverview,
  clearAdminOverview,
  adminActionInProgress,
} from "./host-admin-overview.js";
import { Roles, PortalStates, HttpStatus } from "./host-constants.js";
import { initializeSiteAuth, reauthenticate } from "./site-auth.js";
import { getPlatformProfile } from "./api/index.js";
import { parsePlatformIdentity, loginPath } from "./platform-model.js";
import { renderProductSwitcher } from "./product-switcher.js";
import { watchSession } from "./platform-session.js";
import {
  hostIdentity,
  portalState,
  sameHostAccess,
} from "./host-dashboard-model.js";
import { requestMfaChallenge } from "./host-mfa-challenge.js";
import { membershipActionInProgress } from "./host-membership-invitations.js";
import { recentIdentityActionInProgress } from "./host-recent-identity.js";
import { authErrorMessage } from "./host-auth-errors.js";
import { isLocalStaging } from "./firebase-config.js";
import { attachPopover, firstFocusable } from "./popover.js";
import { loadHostManagement, clearHostManagement } from "./host-management.js";
import { mountRoleGuideButton } from "./role-guide.js";

// The Host dashboard shell. Access comes from GET /api/v1/platform/me alone:
//   active + plan role (admin/user): the workspace with My systems;
//   active + role null: an organization member, the workspace without it;
//   pending: only the join-organization view, to accept an invitation;
//   anything else: back to the product picker, which explains the state and
//   holds authenticator setup.
const $ = (selector) => document.querySelector(selector);
const language = hostLanguage;
const pickerPath = language === "he" ? "/dashboard/?lang=he" : "/dashboard/";
let currentUser;
let identity;
let generation = 0;
let actionBusy = false;
let session;
let accessCheckInProgress = false;
initializeHostLocale();
installHostLanguageSelector();
for (const link of document.querySelectorAll("[data-products-link]"))
  link.href = pickerPath;
if (isLocalStaging) {
  $("[data-staging]").hidden = false;
}
// The account menu opens on its first item a keyboard can reach at this
// width (the language item shows only on phones; a pending account has no
// Account and security).
const accountMenu = attachPopover($("#account-button"), $("#account-menu"), {
  align: "end",
  focus: () =>
    !$("#account-security").hidden
      ? $("#account-security")
      : firstFocusable($("#account-menu")),
});

function hideProtected(sessionEnded = false) {
  clearAdminOverview();
  clearHostManagement({ sessionEnded });
  window.dispatchEvent(
    new CustomEvent("host:workspace-reset", { detail: { sessionEnded } }),
  );
  $("#dashboard-content").hidden = true;
  $("#host-sidebar").hidden = true;
  $("#host-tabbar").hidden = true;
  $("#host-platform-navigation").hidden = true;
  document.body.classList.remove("host-ready");
  accountMenu.close();
}
function clearSession() {
  ++generation;
  identity = undefined;
  renderProfileRoles($("#account-plan"));
  hideProtected(true);
  $("#product-switcher").closeProductSwitcher?.();
  $("#product-switcher").replaceChildren();
  for (const element of document.querySelectorAll(
    "#account-name, #account-email, #account-plan",
  ))
    element.replaceChildren();
  $("#account-avatar").textContent = "";
  $("#host-workspace-roles")?.replaceChildren();
}
function showStatus(title, message, retry = true, loading = false) {
  $("#access-panel").hidden = false;
  $("#access-progress").hidden = !loading;
  $("#access-title").textContent = hostText(title);
  $("#dashboard-status").textContent = hostText(message);
  $("#refresh-access").hidden = !retry;
}
function initial(text) {
  return (Array.from(String(text ?? "").trim())[0] || "W").toLocaleUpperCase(
    hostLocale,
  );
}
function renderAccount(user) {
  const profile = identity?.user ?? {};
  const name = profile.displayName || profile.email || user?.email || "";
  renderProfileAvatar($("#account-avatar"), name, user?.photoURL, language);
  $("#account-name").textContent = name;
  $("#account-email").textContent = profile.email || "";
  renderProfileRoles($("#account-plan"), { platformRole: identity?.platformRole, product: "host", role: identity?.hasPlan ? identity.role : null });
  const workspaceRoles = $("#host-workspace-roles");
  if (workspaceRoles) {
    workspaceRoles.replaceChildren();
    workspaceRoles.hidden = !identity?.hasPlan;
    if (identity?.hasPlan) {
      const role = document.createElement("span");
      role.dir = "ltr";
      role.textContent = identity.role === Roles.ADMIN ? "WIFIGATE Host Admin" : "WIFIGATE Host User";
      workspaceRoles.append(role);
    }
  }
  mountRoleGuideButton({
    product: "host",
    language: hostLocale,
    context: () => ({
      product: "host",
      plan: identity?.platformRole === "admin" ? "admin" : identity?.hasPlan ? identity.role : null,
      organizationRole: document.body.dataset.organizationRole,
    }),
  });
  $("#account-button").setAttribute(
    "aria-label",
    hostText("Account: {p0}", { p0: name || hostText("Signed-in account") }),
  );
}
function toPicker() {
  hideProtected(true);
  location.replace(pickerPath);
}

async function loadDashboard(user) {
  const requestGeneration = ++generation;
  currentUser = user;
  identity = undefined;
  hideProtected();
  $("#sign-out").disabled = false;
  renderAccount(user);
  showStatus(
    hostText("Opening WIFIGATE Host"),
    hostText("Checking your access…"),
    false,
    true,
  );
  try {
    const platform = parsePlatformIdentity(
      await getPlatformProfile(user),
      user.uid,
    );
    if (requestGeneration !== generation) return;
    const fresh = hostIdentity(platform);
    const state = portalState(fresh);
    if (state !== PortalStates.APPROVED && state !== PortalStates.PENDING) {
      // No Host access here (no plan, blocked, authenticator to finish or
      // unavailable): the picker explains the state and offers the next step.
      toPicker();
      return;
    }
    identity = fresh;
    renderProductSwitcher($("#product-switcher"), platform, "host", language);
    renderAccount(user);
    $("#access-panel").hidden = true;
    $("#dashboard-content").hidden = false;
    $("#host-sidebar").hidden = false;
    $("#host-platform-navigation").hidden = state !== PortalStates.APPROVED || identity.role !== Roles.ADMIN;
    document.body.classList.add("host-ready");
    document.body.dataset.hostAccess =
      state === PortalStates.PENDING
        ? "pending"
        : identity.hasPlan
          ? "plan"
          : "member";
    // A pending account has nothing to navigate. Anyone else gets the menu
    // at once, also while the workspace loads right after joining from the
    // pending view (the navigation settles it once the panels exist).
    document.body.classList.toggle(
      "host-menu-empty",
      state === PortalStates.PENDING,
    );
    // Settings (and its Account tab) open once the account is in Host; a
    // pending account reaches its account through All products.
    $("#account-security").hidden = state === PortalStates.PENDING;
    void loadHostManagement(user, identity);
    if (state !== PortalStates.APPROVED) return;
    void loadAdminOverview(user, identity).then(() => {
      if (
        requestGeneration === generation &&
        location.pathname === "/dashboard/host/overview/" &&
        identity?.role === Roles.ADMIN
      ) {
        window.dispatchEvent(
          new CustomEvent("host:workspace-view", { detail: "overview" }),
        );
      }
    });
  } catch (error) {
    if (requestGeneration !== generation) {
      return;
    }
    hideProtected(
      error.status === HttpStatus.FORBIDDEN ||
        error.status === HttpStatus.UNAUTHORIZED,
    );
    identity = undefined;
    showStatus(hostText("Unable to check access"), authErrorMessage(error));
  }
}
initializeSiteAuth((user) => {
  if (!user) {
    ++generation;
    currentUser = undefined;
    identity = undefined;
    hideProtected(true);
    session?.stop();
    if (session?.ended) return;
    location.replace(
      loginPath(location.pathname + location.search + location.hash, language),
    );
    return;
  }
  session?.stop();
  session = watchSession({ clear: clearSession });
  void loadDashboard(user);
}).catch((error) =>
  showStatus(hostText("Unable to sign in"), authErrorMessage(error), false),
);
$("#sign-out").addEventListener("click", async () => {
  ++generation;
  hideProtected();
  identity = undefined;
  $("#sign-out").disabled = true;
  try {
    await session.endSession();
  } catch (error) {
    $("#sign-out").disabled = false;
    showStatus(hostText("Unable to sign out"), authErrorMessage(error));
  }
});
$("#refresh-access").addEventListener("click", () => {
  if (currentUser && !actionBusy) {
    void loadDashboard(currentUser);
  }
});
$("#account-security").addEventListener("click", () => {
  accountMenu.close();
  window.dispatchEvent(
    new CustomEvent("host:workspace-view", { detail: "account" }),
  );
});

// An action needs the authenticator. Without one, setup lives on the product
// picker (shared by every product); with one, this sign-in is verified here
// and the dashboard reloads.
window.addEventListener("host:totp-required", async () => {
  if (!currentUser || !identity || actionBusy) return;
  if (!identity.mfa.enrolled) {
    hideProtected(true);
    location.assign(pickerPath);
    return;
  }
  actionBusy = true;
  const user = currentUser;
  const requestGeneration = generation;
  try {
    await reauthenticate(user, requestMfaChallenge);
    await user.getIdToken(true);
    if (requestGeneration === generation) await loadDashboard(user);
  } catch (error) {
    if (requestGeneration === generation)
      showStatus(hostText("Unable to verify"), authErrorMessage(error));
  } finally {
    actionBusy = false;
  }
});
// Joining an organization from the pending view makes Host active.
window.addEventListener("platform:refresh", () => {
  if (currentUser && !actionBusy) void loadDashboard(currentUser);
});

async function recheckDashboardAccess() {
  if (accessCheckInProgress) return;
  if (!identity) {
    await loadDashboard(currentUser);
    return;
  }
  accessCheckInProgress = true;
  const user = currentUser;
  const requestGeneration = generation;
  try {
    const platform = parsePlatformIdentity(
      await getPlatformProfile(user),
      user.uid,
    );
    if (requestGeneration !== generation) return;
    const fresh = hostIdentity(platform);
    if (!sameHostAccess(identity, fresh)) {
      await loadDashboard(user);
      return;
    }
    renderProductSwitcher($("#product-switcher"), platform, "host", language);
  } catch (error) {
    if (requestGeneration !== generation) return;
    hideProtected();
    identity = undefined;
    showStatus(hostText("Unable to check access"), authErrorMessage(error));
  } finally {
    accessCheckInProgress = false;
  }
}
window.addEventListener("host:admin-updated", (event) => {
  if (
    currentUser?.uid === event.detail?.uid &&
    identity?.user.uid === currentUser.uid &&
    identity.role === Roles.ADMIN &&
    portalState(identity) === PortalStates.APPROVED
  ) {
    void loadHostManagement(currentUser, identity);
  }
});
window.addEventListener("focus", () => {
  if (
    currentUser &&
    !actionBusy &&
    !adminActionInProgress() &&
    !membershipActionInProgress() &&
    !recentIdentityActionInProgress()
  ) {
    void recheckDashboardAccess();
  }
});
window.addEventListener("pagehide", () => {
  ++generation;
  hideProtected();
});
window.addEventListener("pageshow", (event) => {
  if (event.persisted && currentUser) {
    void loadDashboard(currentUser);
  }
});
