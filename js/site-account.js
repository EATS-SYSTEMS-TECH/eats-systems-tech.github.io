// /js/site-account.js
// The signed-in account in the shared header. /login/ keeps its Firebase Auth
// session in this tab's sessionStorage (js/site-auth.js,
// browserSessionPersistence). A page without that entry shows "Log in" and
// does nothing more: no Firebase code loads. With it, the header shows the
// account from the stored entry at once (the inline check in the header
// partial hides "Log in" before the first paint), and js/site-auth.js loads
// when the page is idle to confirm the session and to sign out.

(() => {
  const header = document.querySelector(".site-header");
  const account = header?.querySelector(".site-account");
  if (!account) return;

  const SESSION_KEY = /^firebase:authUser:[^:]+:\[DEFAULT\]$/;
  const SIGNED_IN = "site-header--account";
  const authUrl = new URL("site-auth.js", document.currentScript.src).href;
  const button = account.querySelector(".site-account__button");
  const panel = account.querySelector(".site-account__panel");
  const avatar = account.querySelector(".site-account__avatar");
  const nameLine = account.querySelector(".site-account__name");
  const emailLine = account.querySelector(".site-account__email");
  const items = [...account.querySelectorAll("[role='menuitem']")];
  const signOutItem = account.querySelector("[data-account-sign-out]");
  const login = header.querySelector(".site-login__trigger");
  const menuLabel = button.getAttribute("aria-label");
  let authModule;
  let watching = false;
  let signingOut = false;

  function sessionKeys() {
    const keys = [];
    try {
      for (let index = 0; index < sessionStorage.length; index += 1) {
        const key = sessionStorage.key(index);
        if (SESSION_KEY.test(key)) keys.push(key);
      }
    } catch {
      // Storage blocked: no session can exist in this tab.
    }
    return keys;
  }

  function storedUser() {
    for (const key of sessionKeys()) {
      try {
        const user = JSON.parse(sessionStorage.getItem(key));
        if (user && typeof user.uid === "string" && user.uid) return user;
      } catch {
        // An unreadable entry is no session.
      }
    }
    return null;
  }

  function initial(text) {
    const letter = Array.from(text.trim())[0] || "W";
    return letter.toLocaleUpperCase(document.documentElement.lang || undefined);
  }

  function showInitial(text) {
    avatar.replaceChildren(initial(text));
    avatar.classList.remove("site-account__avatar--photo");
  }

  function render(user) {
    const name = typeof user.displayName === "string" ? user.displayName.trim() : "";
    const email = typeof user.email === "string" ? user.email.trim() : "";
    const primary = name || email || "WIFIGATE";
    nameLine.textContent = primary;
    emailLine.textContent = name && email ? email : "";
    emailLine.hidden = !(name && email);
    button.setAttribute("aria-label", `${menuLabel}, ${primary}`);

    const photo = typeof user.photoURL === "string" && /^https:\/\//.test(user.photoURL) ? user.photoURL : "";
    const shown = avatar.querySelector("img");
    if (photo && shown?.getAttribute("src") !== photo) {
      const image = new Image();
      image.alt = "";
      image.width = 32;
      image.height = 32;
      image.decoding = "async";
      image.referrerPolicy = "no-referrer";
      image.addEventListener("error", () => showInitial(primary), { once: true });
      image.src = photo;
      avatar.replaceChildren(image);
      avatar.classList.add("site-account__avatar--photo");
    } else if (!photo) {
      showInitial(primary);
    }
    header.classList.add(SIGNED_IN);
  }

  function showSignedOut() {
    const hadFocus = account.contains(document.activeElement);
    closeMenu(false);
    header.classList.remove(SIGNED_IN);
    avatar.replaceChildren();
    nameLine.textContent = "";
    emailLine.textContent = "";
    button.setAttribute("aria-label", menuLabel);
    if (hadFocus) login?.focus();
  }

  function isOpen() {
    return !panel.hidden;
  }

  function openMenu(focusIndex = 0) {
    // One header popup at a time: the phone menu folds away.
    const links = header.querySelector(".nav__links-wrapper.is-open");
    if (links) {
      links.classList.remove("is-open");
      header.querySelector(".nav__toggle")?.setAttribute("aria-expanded", "false");
    }
    panel.hidden = false;
    account.classList.add("is-open");
    button.setAttribute("aria-expanded", "true");
    items.at(focusIndex)?.focus();
  }

  function closeMenu(returnFocus) {
    if (!isOpen()) return;
    panel.hidden = true;
    account.classList.remove("is-open");
    button.setAttribute("aria-expanded", "false");
    if (returnFocus) button.focus();
  }

  function loadAuth() {
    authModule ??= import(authUrl).catch((error) => {
      authModule = undefined;
      throw error;
    });
    return authModule;
  }

  // Firebase reloads the stored account when it starts: a session that ended
  // (revoked, deleted or disabled account) clears itself and reports null.
  function watchSession() {
    if (watching) return;
    watching = true;
    loadAuth()
      .then((auth) => auth.initializeSiteAuth((user) => (user ? render(user) : showSignedOut())))
      .catch(() => {
        // Offline or blocked: the header keeps the stored account.
        watching = false;
      });
  }

  function whenIdle(task) {
    const run = () => (window.requestIdleCallback ? requestIdleCallback(task, { timeout: 3000 }) : setTimeout(task, 1));
    if (document.readyState === "complete") run();
    else window.addEventListener("load", run, { once: true });
  }

  async function signOut() {
    if (signingOut) return;
    signingOut = true;
    signOutItem.setAttribute("aria-disabled", "true");
    try {
      const auth = await loadAuth();
      await auth.signOut();
    } catch {
      // Firebase could not load: end the session in this tab the way its
      // signOut does, by clearing the stored entry.
      for (const key of sessionKeys()) {
        try {
          sessionStorage.removeItem(key);
        } catch {
          // Nothing more to clear.
        }
      }
    } finally {
      signingOut = false;
      signOutItem.removeAttribute("aria-disabled");
    }
    showSignedOut();
  }

  function sync() {
    const user = storedUser();
    if (user) {
      render(user);
      whenIdle(watchSession);
    } else if (header.classList.contains(SIGNED_IN)) {
      showSignedOut();
    }
  }

  button.addEventListener("click", () => (isOpen() ? closeMenu(false) : openMenu(0)));
  // Enter and Space reach the button as a click; the arrows open the menu on
  // its first or last item.
  button.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      openMenu(event.key === "ArrowDown" ? 0 : -1);
    } else if (event.key === "Escape" && isOpen()) {
      event.preventDefault();
      closeMenu(true);
    }
  });
  panel.addEventListener("keydown", (event) => {
    const index = items.indexOf(document.activeElement);
    const move = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: items.length - 1 }[event.key];
    if (move !== undefined) {
      event.preventDefault();
      items[(move + items.length) % items.length].focus();
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeMenu(true);
    } else if (event.key === "Tab") {
      closeMenu(false);
    } else if (event.key === " " && document.activeElement?.matches("a[role='menuitem']")) {
      // A link menu item answers Space like the sign-out item does.
      event.preventDefault();
      document.activeElement.click();
    }
  });
  // Capture phase: the language selector stops its own clicks from bubbling.
  document.addEventListener(
    "click",
    (event) => {
      if (isOpen() && !account.contains(event.target)) closeMenu(false);
    },
    true,
  );
  account.addEventListener("focusout", (event) => {
    if (isOpen() && event.relatedTarget && !account.contains(event.relatedTarget)) closeMenu(false);
  });
  signOutItem.addEventListener("click", () => void signOut());
  // A page restored from the back/forward cache shows the session of now.
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) sync();
  });

  sync();
})();
