export function renderProfileAvatar(avatar, name, photoURL, language = "en") {
  const initial = [...name][0]?.toLocaleUpperCase(language) || "W";
  avatar.textContent = initial;
  if (typeof photoURL !== "string" || !/^https:\/\//i.test(photoURL)) return;
  try {
    const url = new URL(photoURL);
    if (!url.hostname || url.username || url.password) return;
    const image = document.createElement("img");
    image.alt = "";
    image.referrerPolicy = "no-referrer";
    image.width = 40;
    image.height = 40;
    image.addEventListener("error", () => {
      if (avatar.contains(image)) avatar.textContent = initial;
    }, { once: true });
    image.src = url.href;
    avatar.replaceChildren(image);
  } catch {
    // Keep the initial when the account has no usable image.
  }
}
