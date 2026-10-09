import {
  hostText,
  hostLocale,
  initializeHostLocale,
  installHostLanguageSelector,
} from "./host-locale.js";
import "./host-dashboard-navigation.js";
import {
  loadAdminOverview,
  clearAdminOverview,
  adminActionInProgress,
} from "./host-admin-overview.js";
import { roleBadge } from "./host-role-badge.js";
import {
  Roles,
  PortalStates,
  AuthErrors,
  HttpStatus,
} from "./host-constants.js";
import {
  initializeSiteAuth,
  reauthenticate,
  beginTotpEnrollment,
  finishTotpEnrollment,
} from "./site-auth.js";
import {
  getProfile,
  createProfile,
  getPlatformProfile,
  changePortalAccess,
  deletePortalAccess,
} from "./api/index.js";
import {
  parsePlatformIdentity,
  pageLanguage,
  loginPath,
} from "./platform-model.js";
import { renderProductSwitcher } from "./product-switcher.js";
import { watchSession } from "./platform-session.js";
import {
  parseIdentity,
  portalState,
  canApproveEmail,
  canEnroll,
} from "./host-dashboard-model.js";
import { requestMfaChallenge } from "./host-mfa-challenge.js";
import { membershipActionInProgress } from "./host-membership-invitations.js";
import { authErrorMessage } from "./host-auth-errors.js";
import { isLocalStaging } from "./firebase-config.js";
import qrcode from "./vendor/qrcode-generator.js";
import { loadHostManagement, clearHostManagement } from "./host-management.js";
const $ = (selector) => document.querySelector(selector);
let currentUser;
let identity;
let generation = 0;
let enrollmentSecret;
let actionBusy = false;
let approvalAttempt;
let session;
const language = pageLanguage();
initializeHostLocale();
installHostLanguageSelector();
if (isLocalStaging) {
  $("[data-staging]").hidden = false;
}
function clearSecret() {
  enrollmentSecret = undefined;
  $("#totp-secret").value = "";
  $("#totp-qr").removeAttribute("src");
  $("#enrollment-form").reset();
  $("#totp-setup").hidden = true;
}
const protectedElements = {
  dashboard: $("#dashboard-content"),
  sidebar: $("#host-sidebar"),
  approval: $("#admin-approval"),
  enrollment: $("#mfa-enrollment"),
  verification: $("#mfa-verification"),
  account: $("#account-details"),
};
function hideProtected(sessionEnded = false) {
  clearAdminOverview();
  clearHostManagement({ sessionEnded });
  window.dispatchEvent(
    new CustomEvent("host:workspace-reset", { detail: { sessionEnded } }),
  );
  protectedElements.dashboard.hidden = true;
  protectedElements.sidebar.hidden = true;
  protectedElements.approval.hidden = true;
  protectedElements.enrollment.hidden = true;
  protectedElements.verification.hidden = true;
  protectedElements.account.hidden = true;
  clearSecret();
}
function clearSession() {
  ++generation;
  identity = undefined;
  approvalAttempt = undefined;
  hideProtected(true);
  $("#approval-form").reset();
  $("#product-switcher").replaceChildren();
  for (const element of document.querySelectorAll(
    ".profile-grid dd, #account-name, #sidebar-account-name, #sidebar-profile-name, #approval-status",
  ))
    element.textContent = "";
}
function showStatus(title, message, retry = true, loading = false) {
  $("#access-panel").hidden = false;
  $("#access-progress").hidden = !loading;
  $("#access-title").textContent = hostText(title);
  $("#dashboard-status").textContent = hostText(message);
  $("#refresh-access").hidden = !retry;
}
function renderProfile() {
  const profile = identity.user;
  $("#profile-name").textContent = profile.displayName || hostText("-");
  $("#sidebar-profile-name").textContent =
    profile.displayName || hostText("WIFIGATE Host");
  $("#sidebar-avatar").textContent = (
    profile.displayName ||
    profile.email ||
    "WG"
  )
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  $("#profile-email").textContent = profile.email || hostText("-");
  $("#profile-role").replaceChildren(roleBadge(identity.role, true));
  $("#profile-access").textContent = hostText(identity.access.state);
  $("#profile-mfa").textContent = identity.mfa.verified
    ? hostText("Enrolled - session verified")
    : identity.mfa.enrolled
      ? hostText("Enrolled - verification needed")
      : hostText("Not enrolled");
  $("#profile-mfa-policy").textContent =
    identity.role === Roles.ADMIN || identity.mfa.required
      ? hostText("Required")
      : hostText("Optional");
  $("#account-details").hidden = false;
  $("#optional-enrollment").hidden =
    portalState(identity) !== PortalStates.APPROVED ||
    identity.mfa.enrolled ||
    identity.role !== Roles.USER;
}
function showEnrollment(optional) {
  $("#mfa-enrollment").hidden = false;
  $("#enrollment-description").textContent = optional
    ? hostText(
        "Add an authenticator for extra account security. You can return to the calendar without enrolling.",
      )
    : hostText(
        "Your account requires an authenticator before you can enter the portal.",
      );
  $("#cancel-enrollment").hidden = !optional;
  $("#enrollment-status").textContent = "";
  $("#start-enrollment").hidden = false;
  $("#start-enrollment").disabled = false;
}
async function loadDashboard(user) {
  const requestGeneration = ++generation;
  currentUser = user;
  identity = undefined;
  hideProtected();
  $("#account-name").textContent = user.email || hostText("Signed-in account");
  $("#sidebar-account-name").textContent =
    user.email || hostText("Signed-in account");
  $("#sign-out").disabled = false;
  showStatus(
    hostText("Checking portal access"),
    hostText("Verifying your account..."),
    false,
    true,
  );
  try {
    const platform = parsePlatformIdentity(
      await getPlatformProfile(user),
      user.uid,
    );
    if (requestGeneration !== generation) return;
    if (platform.products.host.state !== "active") {
      location.replace(
        language === "he" ? "/dashboard/?lang=he" : "/dashboard/",
      );
      return;
    }
    renderProductSwitcher($("#product-switcher"), platform, "host", language);
    let value;
    try {
      value = await getProfile(user);
    } catch (error) {
      if (error.status !== 404) throw error;
      await createProfile(user);
      value = await getProfile(user);
    }
    if (requestGeneration !== generation) {
      return;
    }
    identity = parseIdentity(value);
    if (identity.user.uid !== user.uid) {
      throw new Error(AuthErrors.INCOMPLETE_CONTRACT);
    }
    renderProfile();
    const state = portalState(identity);
    if (state === PortalStates.PENDING) {
      clearHostManagement({ sessionEnded: true });
      showStatus(
        hostText("Approval pending"),
        hostText(
          "Your email is awaiting administrator approval. Check again after your admin approves it.",
        ),
      );
      return;
    }
    if (state === PortalStates.DENIED) {
      clearHostManagement({ sessionEnded: true });
      showStatus(
        hostText("Portal access denied"),
        hostText(
          "This verified email does not have active portal access. Contact your administrator. For Apple Hide My Email, provide your relay address.",
        ),
      );
      return;
    }
    $("#access-panel").hidden = true;
    if (state === PortalStates.ENROLLMENT) {
      showEnrollment(false);
      return;
    }
    if (state === PortalStates.VERIFICATION) {
      $("#mfa-verification").hidden = false;
      return;
    }
    $("#dashboard-content").hidden = false;
    $("#host-sidebar").hidden = false;
    $("#admin-approval").hidden = true;
    void loadHostManagement(user, identity);
    void loadAdminOverview(user, identity).then(() => {
      if (
        requestGeneration === generation &&
        location.pathname === "/dashboard/host/overview/" &&
        identity?.role === Roles.ADMIN
      ) {
        window.dispatchEvent(
          new CustomEvent("host:workspace-view", { detail: "Overview" }),
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
    if (error.status === HttpStatus.FORBIDDEN) {
      showStatus(
        error.code === AuthErrors.ACCESS_PENDING
          ? hostText("Approval pending")
          : hostText("Portal access denied"),
        hostText(
          "Your account is signed in but the server has not granted portal access. Contact your administrator.",
        ),
      );
    } else {
      showStatus(hostText("Unable to check access"), authErrorMessage(error));
    }
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
$("#optional-enrollment").addEventListener("click", () => {
  if (
    identity?.role !== Roles.USER ||
    portalState(identity) !== PortalStates.APPROVED
  ) {
    return;
  }
  clearSecret();
  showEnrollment(true);
  $("#dashboard-content").hidden = true;
  $("#host-sidebar").hidden = true;
});
$("#cancel-enrollment").addEventListener("click", () => {
  if (actionBusy) {
    return;
  }
  clearSecret();
  if (currentUser) {
    void loadDashboard(currentUser);
  }
});
$("#start-enrollment").addEventListener("click", async () => {
  if (actionBusy || !identity || !canEnroll(identity)) {
    return;
  }
  actionBusy = true;
  const user = currentUser;
  const requestGeneration = generation;
  $("#start-enrollment").disabled = true;
  $("#enrollment-status").textContent = hostText(
    "Confirm your identity in the provider window...",
  );
  try {
    await reauthenticate(user, requestMfaChallenge);
    if (requestGeneration !== generation) {
      return;
    }
    const fresh = parseIdentity(await getProfile(user));
    if (requestGeneration !== generation) {
      return;
    }
    if (fresh.user.uid !== user.uid || !canEnroll(fresh)) {
      await loadDashboard(user);
      return;
    }
    enrollmentSecret = await beginTotpEnrollment(user);
    if (requestGeneration !== generation) {
      clearSecret();
      return;
    }
    const qr = qrcode(0, "M");
    qr.addData(enrollmentSecret.generateQrCodeUrl(user.email, "WIFIGATE Host"));
    qr.make();
    $("#totp-qr").src = qr.createDataURL(5, 20);
    $("#totp-secret").value = enrollmentSecret.secretKey;
    $("#totp-settings").textContent = hostText(
      "Time-based code - {digits} digits - {seconds} seconds - {algorithm}",
      {
        digits: enrollmentSecret.codeLength,
        seconds: enrollmentSecret.codeIntervalSeconds,
        algorithm: enrollmentSecret.hashingAlgorithm,
      },
    );
    $("#totp-setup").hidden = false;
    $("#start-enrollment").hidden = true;
    $("#enrollment-status").textContent = hostText(
      "Enter the current code to confirm setup.",
    );
    $("#enrollment-form input").focus();
  } catch (error) {
    if (requestGeneration === generation) {
      clearSecret();
      $("#enrollment-status").textContent = authErrorMessage(error);
    }
  } finally {
    actionBusy = false;
    $("#start-enrollment").disabled = false;
  }
});
$("#enrollment-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (actionBusy || !enrollmentSecret) {
    return;
  }
  const user = currentUser;
  const requestGeneration = generation;
  const button = event.currentTarget.querySelector("button");
  actionBusy = true;
  button.disabled = true;
  $("#enrollment-status").textContent = hostText("Verifying setup...");
  try {
    await finishTotpEnrollment(
      user,
      enrollmentSecret,
      event.currentTarget.elements.namedItem("code").value.trim(),
    );
    clearSecret();
    if (requestGeneration === generation) {
      await loadDashboard(user);
    }
  } catch (error) {
    if (requestGeneration === generation) {
      $("#enrollment-status").textContent = authErrorMessage(error);
    }
  } finally {
    actionBusy = false;
    button.disabled = false;
  }
});
$("#verify-session").addEventListener("click", async () => {
  if (actionBusy || !currentUser) {
    return;
  }
  actionBusy = true;
  const user = currentUser;
  const requestGeneration = generation;
  $("#verify-session").disabled = true;
  $("#verification-status").textContent = hostText(
    "Confirm sign-in and enter your authenticator code...",
  );
  try {
    await reauthenticate(user, requestMfaChallenge);
    await user.getIdToken(true);
    if (requestGeneration === generation) {
      await loadDashboard(user);
    }
  } catch (error) {
    if (requestGeneration === generation) {
      $("#verification-status").textContent = authErrorMessage(error);
    }
  } finally {
    actionBusy = false;
    $("#verify-session").disabled = false;
  }
});
$("#approval-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (actionBusy || !canApproveEmail(identity)) {
    return;
  }
  const form = event.currentTarget;
  const email = form.elements.namedItem("email").value.trim().toLowerCase();
  const action = form.elements.namedItem("action").value;
  const role = form.elements.namedItem("role").value;
  const signature = JSON.stringify([
    email,
    action,
    action === "approve" ? role : null,
  ]);
  if (!approvalAttempt || approvalAttempt.signature !== signature) {
    approvalAttempt = { signature, key: crypto.randomUUID() };
  }
  const user = currentUser;
  const requestGeneration = generation;
  const button = form.querySelector("button");
  actionBusy = true;
  button.disabled = true;
  $("#approval-status").textContent = hostText(
    "Checking administrator access...",
  );
  try {
    const fresh = parseIdentity(await getProfile(user));
    if (requestGeneration !== generation) {
      return;
    }
    if (fresh.user.uid !== user.uid || !canApproveEmail(fresh)) {
      await loadDashboard(user);
      return;
    }
    if (action === "delete") {
      await reauthenticate(user, requestMfaChallenge);
      await user.getIdToken(true);
      if (requestGeneration !== generation) return;
      await deletePortalAccess(user, email, approvalAttempt.key);
    } else {
      await changePortalAccess(
        user,
        {
          email,
          status: action === "block" ? "blocked" : "active",
          ...(action === "approve" ? { role } : {}),
        },
        approvalAttempt.key,
      );
    }
    if (requestGeneration !== generation) {
      return;
    }
    $("#approval-status").textContent = hostText(
      action === "delete"
        ? "Portal access deleted for {email}."
        : action === "block"
          ? "Portal access blocked for {email}."
          : "Access approved for {email}. They can now sign in with that verified email.",
      { email },
    );
    approvalAttempt = undefined;
    form.reset();
    updateAccessAction();
  } catch (error) {
    if (requestGeneration !== generation) {
      return;
    }
    $("#approval-status").textContent = authErrorMessage(error);
    if (
      error.status === HttpStatus.UNAUTHORIZED ||
      (error.status === HttpStatus.FORBIDDEN &&
        error.code !== "SELF_ACCESS_PROTECTED")
    ) {
      await loadDashboard(user);
    }
  } finally {
    actionBusy = false;
    button.disabled = false;
  }
});
function updateAccessAction() {
  const action = $("#approval-form").elements.namedItem("action").value;
  $("#access-role-label").hidden = action !== "approve";
  $("#delete-access-note").hidden = action !== "delete";
}
window.addEventListener("host:totp-required", () => {
  if (!currentUser || !identity || actionBusy) return;
  if (!identity.mfa.enrolled) {
    showEnrollment(true);
    $("#dashboard-content").hidden = true;
    $("#host-sidebar").hidden = true;
  } else $("#mfa-verification").hidden = false;
});
$("#approval-form")
  .elements.namedItem("action")
  .addEventListener("change", updateAccessAction);
window.addEventListener("focus", () => {
  if (
    currentUser &&
    !actionBusy &&
    !enrollmentSecret &&
    !adminActionInProgress() &&
    !membershipActionInProgress()
  ) {
    void loadDashboard(currentUser);
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
