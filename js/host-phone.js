import { hostText, hostLanguage, hostLocale } from "./host-locale.js";
import { node } from "./host-ui.js";

// A guest's phone: a country picker and the number as people write it
// ("050-123-4567"), sent as E.164 ("+972501234567"). A number typed with
// + or 00 keeps its own country code; one typed with the country code but
// without them ("972 50-123-4567", "1 555 123 4567") is read as
// international too.
// [country, dial code, national number length (min, max), trunk prefix].
// The trunk prefix is what people dial before a national number at home
// (0, 1 in North America, 8 in Russia, 06 in Hungary) and never part of
// the international number; Italy keeps its leading 0.
const plans = new Map(
  [
    ["IL", "972", 8, 10, "0"],
    ["US", "1", 10, 10, "1"],
    ["CA", "1", 10, 10, "1"],
    ["GB", "44", 7, 10, "0"],
    ["IE", "353", 7, 9, "0"],
    ["FR", "33", 9, 9, "0"],
    ["DE", "49", 5, 13, "0"],
    ["IT", "39", 6, 11, ""],
    ["ES", "34", 9, 9, ""],
    ["PT", "351", 9, 9, ""],
    ["NL", "31", 9, 9, "0"],
    ["BE", "32", 8, 9, "0"],
    ["CH", "41", 9, 9, "0"],
    ["AT", "43", 4, 13, "0"],
    ["GR", "30", 10, 10, ""],
    ["CY", "357", 8, 8, ""],
    ["TR", "90", 10, 10, "0"],
    ["PL", "48", 9, 9, ""],
    ["CZ", "420", 9, 9, ""],
    ["HU", "36", 8, 9, "06"],
    ["RO", "40", 9, 9, "0"],
    ["BG", "359", 7, 9, "0"],
    ["HR", "385", 8, 9, "0"],
    ["RS", "381", 7, 12, "0"],
    ["UA", "380", 9, 9, "0"],
    ["RU", "7", 10, 10, "8"],
    ["SE", "46", 7, 10, "0"],
    ["NO", "47", 8, 8, ""],
    ["DK", "45", 8, 8, ""],
    ["FI", "358", 5, 12, "0"],
    ["AE", "971", 8, 9, "0"],
    ["JO", "962", 8, 9, "0"],
    ["EG", "20", 8, 10, "0"],
    ["MA", "212", 9, 9, "0"],
    ["ZA", "27", 9, 9, "0"],
    ["IN", "91", 10, 10, "0"],
    ["TH", "66", 8, 9, "0"],
    ["SG", "65", 8, 8, ""],
    ["PH", "63", 8, 10, "0"],
    ["JP", "81", 9, 10, "0"],
    ["KR", "82", 8, 10, "0"],
    ["CN", "86", 7, 11, "0"],
    ["AU", "61", 9, 9, "0"],
    ["NZ", "64", 8, 10, "0"],
    ["MX", "52", 10, 10, ""],
    ["BR", "55", 10, 11, "0"],
    ["AR", "54", 10, 11, "0"],
  ].map(([country, code, min, max, trunk]) => [
    country,
    { code, min, max, trunk },
  ]),
);
const dialCodes = new Map(
  [...plans].map(([country, plan]) => [country, plan.code]),
);
// Countries whose numbers keep a leading 0 after the country code.
const keepsZero = new Set(["IT"]);
const zoneCountries = {
  "Asia/Jerusalem": "IL",
  "Asia/Tel_Aviv": "IL",
  "Europe/London": "GB",
  "Europe/Dublin": "IE",
  "Europe/Paris": "FR",
  "Europe/Berlin": "DE",
  "Europe/Rome": "IT",
  "Europe/Madrid": "ES",
  "Europe/Lisbon": "PT",
  "Europe/Amsterdam": "NL",
  "Europe/Athens": "GR",
  "Asia/Nicosia": "CY",
  "Europe/Istanbul": "TR",
  "Asia/Dubai": "AE",
  "America/New_York": "US",
  "America/Chicago": "US",
  "America/Denver": "US",
  "America/Los_Angeles": "US",
  "America/Toronto": "CA",
  "Australia/Sydney": "AU",
};

const valid = (value) => /^\+[1-9]\d{6,14}$/.test(value);
const compactOf = (typed) =>
  String(typed ?? "")
    .trim()
    .replace(/[\s().\-\u2010-\u2015\u200e\u200f\u2066-\u2069]/g, "");

// The national number without its trunk prefix ("0501234567" → "501234567").
function nationalNumber(plan, country, digits) {
  const rest =
    plan.trunk && digits.startsWith(plan.trunk)
      ? digits.slice(plan.trunk.length)
      : digits;
  return keepsZero.has(country) ? rest : rest.replace(/^0+/, "");
}

// The number as E.164, or null when it cannot be one.
export function toE164(country, typed) {
  const compact = compactOf(typed);
  if (/^(\+|00)/.test(compact)) {
    const full = compact.replace(/^00/, "+");
    return valid(full) ? full : null;
  }
  const plan = plans.get(country);
  if (!plan || !/^\d+$/.test(compact)) return null;
  const fits = (number) =>
    number.length >= plan.min && number.length <= plan.max;
  const national = nationalNumber(plan, country, compact);
  // Written with the country code but without + or 00: too long to be a
  // national number, and a national number once the code is taken off.
  if (
    compact.startsWith(plan.code) &&
    fits(compact.slice(plan.code.length)) &&
    !fits(national)
  )
    return valid(`+${compact}`) ? `+${compact}` : null;
  const full = `+${plan.code}${national}`;
  return valid(full) ? full : null;
}

// A search for a phone number as it is stored (E.164, "+972501234567"):
// the number without its country code and trunk prefix, so "050-123-4567",
// "0501234567" and "+972 50 123 4567" all find "+972501234567". Anything
// that is not written like a phone number is searched as typed.
export function phoneSearch(country, typed) {
  const text = String(typed ?? "").trim();
  if (!/^\+?[\d\s().\-\u2010-\u2015]+$/.test(text)) return text;
  const compact = compactOf(text);
  if (/^(\+|00)/.test(compact)) return compact.replace(/^(\+|00)/, "");
  const full = toE164(country, compact);
  const code = dialCodes.get(country);
  if (full && code && full.startsWith(`+${code}`))
    return full.slice(code.length + 1);
  return compact.replace(/^0+/, "") || compact;
}

// A stored number (E.164) as people read it: the organization's own
// country in its national form ("+972501234567" → "050-123-4567", a US
// number "(555) 123-4567"), another country with its code apart
// ("+44 7700900212"). Anything else shows as stored.
export function phoneDisplay(value, country) {
  const text = String(value ?? "").trim();
  if (!valid(text)) return text;
  const plan = plans.get(country);
  if (plan && text.startsWith(`+${plan.code}`)) {
    const national = text.slice(plan.code.length + 1);
    if (plan.code === "1" && national.length === 10)
      return `(${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6)}`;
    const local =
      (keepsZero.has(country) || plan.trunk !== "0" ? "" : plan.trunk) +
      national;
    if (country === "IL" && /^0\d{8,9}$/.test(local)) {
      const head = local.length === 10 ? 3 : 2;
      return `${local.slice(0, head)}-${local.slice(head, head + 3)}-${local.slice(head + 3)}`;
    }
    return local;
  }
  const codes = [...new Set(dialCodes.values())].sort(
    (a, b) => b.length - a.length,
  );
  const code = codes.find((item) => text.startsWith(`+${item}`));
  return code ? `+${code} ${text.slice(code.length + 1)}` : text;
}

// The country a phone field starts with: the organization's, then the
// page language's, then the browser's.
export function defaultCountry(timeZone) {
  if (zoneCountries[timeZone]) return zoneCountries[timeZone];
  if (hostLanguage === "he") return "IL";
  const region = String(navigator.language ?? "")
    .split("-")[1]
    ?.toUpperCase();
  return dialCodes.has(region) ? region : "US";
}

let fields = 0;
// {element, input, value() → E.164 | null}. `phone` is a stored E.164 value.
export function phoneField({ phone = "", timeZone, label = "Phone" } = {}) {
  const id = `phone-field-${++fields}`;
  const wrapper = node("div", undefined, { class: "phone-field" });
  const title = node("label", hostText(label), {
    for: `${id}-number`,
    class: "phone-field__label",
  });
  const row = node("div", undefined, { class: "phone-field__row" });
  const names = (() => {
    try {
      return new Intl.DisplayNames([hostLocale], { type: "region" });
    } catch {
      return null;
    }
  })();
  const country = node("select", undefined, {
    name: "country",
    "aria-label": "Country code",
    class: "phone-field__country",
  });
  const chosen = defaultCountry(timeZone);
  const options = [...dialCodes]
    .map(([code, dial]) => ({
      code,
      dial,
      name: names?.of(code) ?? code,
    }))
    .sort(
      (a, b) =>
        (b.code === chosen) - (a.code === chosen) ||
        a.name.localeCompare(b.name, hostLocale),
    );
  for (const option of options)
    // The dial code comes first and is isolated, so "+972" stays whole
    // and in order (Hebrew too) when a narrow picker cuts the name.
    country.append(
      node("option", `\u2066+${option.dial}\u2069 ${option.name}`, {
        value: option.code,
      }),
    );
  country.value = chosen;
  const picker = node("span", undefined, { class: "phone-field__picker" });
  const code = node("span", "", {
    class: "phone-field__code",
    dir: "ltr",
    "aria-hidden": "true",
  });
  const showCode = () => {
    code.textContent = `+${dialCodes.get(country.value) ?? ""}`;
  };
  country.addEventListener("change", showCode);
  showCode();
  picker.append(code, country);
  const input = node("input", undefined, {
    id: `${id}-number`,
    name: "phone",
    type: "tel",
    inputmode: "tel",
    autocomplete: "off",
    dir: "ltr",
    maxlength: "24",
    required: "",
  });
  input.value = phone;
  row.append(picker, input);
  wrapper.append(title, row);
  return {
    element: wrapper,
    input,
    country,
    // After a script sets the country, the closed picker follows.
    refresh: showCode,
    value: () => toE164(country.value, input.value),
  };
}
