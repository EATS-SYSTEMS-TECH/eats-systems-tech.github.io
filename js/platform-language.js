import { attachPopover } from "./popover.js";

// Match the public site's flag, language name and compact dropdown while
// retaining the current dashboard route, query parameters and fragment.
export function renderPlatformLanguage(select, language, label) {
  if (!select) return;
  const choices = [
    { code: "en", name: "English", flag: "flag-us.webp" },
    { code: "he", name: "עברית", flag: "flag-il.svg" },
  ];
  const wrapper = document.createElement("div");
  wrapper.className = "platform-language";
  const button = document.createElement("button");
  button.id = select.id;
  button.type = "button";
  button.className = "platform-language__button";
  button.setAttribute("aria-label", label);
  button.setAttribute("aria-controls", "platform-language-options");
  button.setAttribute("aria-expanded", "false");
  const panel = document.createElement("nav");
  panel.id = "platform-language-options";
  panel.className = "platform-language__dropdown";
  panel.setAttribute("aria-label", label);
  panel.hidden = true;
  function flag(choice) {
    const image = document.createElement("img");
    image.src = `/assets/img/flags/${choice.flag}`;
    image.alt = "";
    image.width = 30;
    image.height = 20;
    return image;
  }
  const selected = choices.find((choice) => choice.code === language);
  const name = document.createElement("span");
  name.textContent = selected.name;
  name.lang = selected.code;
  const arrow = document.createElement("span");
  arrow.className = "platform-language__arrow";
  arrow.textContent = "▾";
  arrow.setAttribute("aria-hidden", "true");
  button.append(flag(selected), name, arrow);
  for (const choice of choices) {
    const link = document.createElement("a");
    const url = new URL(location.href);
    if (choice.code === "he") url.searchParams.set("lang", "he");
    else url.searchParams.delete("lang");
    link.href = url.href;
    link.lang = choice.code;
    link.hreflang = choice.code;
    if (choice.code === language) link.setAttribute("aria-current", "true");
    link.append(flag(choice), document.createTextNode(choice.name));
    panel.append(link);
  }
  wrapper.append(button, panel);
  select.replaceWith(wrapper);
  const popover = attachPopover(button, panel, {
    align: "end",
    focus: () => panel.querySelector('[aria-current="true"]'),
  });
  button.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      popover.open();
    }
  });
}
