import { productIds } from "./platform-model.js";
import { platformText } from "./platform-copy.js";

export function renderProductSwitcher(
  container,
  identity,
  selected,
  language = "en",
) {
  const copy = platformText(language);
  const label = document.createElement("label");
  label.textContent = copy.products;
  const select = document.createElement("select");
  select.setAttribute("aria-label", copy.products);
  for (const id of productIds) {
    const state = identity.products[id].state;
    const option = document.createElement("option");
    option.value = id;
    option.textContent = `WIFIGATE ${id[0].toUpperCase() + id.slice(1)} — ${copy[state]}`;
    option.disabled = state !== "active";
    select.append(option);
  }
  select.value = selected;
  select.addEventListener("change", () => {
    if (identity.products[select.value]?.state === "active") {
      location.assign(
        `/dashboard/${select.value}/${language === "he" ? "?lang=he" : ""}`,
      );
    }
  });
  label.append(select);
  const all = document.createElement("a");
  all.href = language === "he" ? "/dashboard/?lang=he" : "/dashboard/";
  all.textContent = copy.allProducts;
  container.replaceChildren(label, all);
}
