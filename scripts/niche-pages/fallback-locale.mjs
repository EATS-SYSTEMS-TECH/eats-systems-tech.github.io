import en from "./en.mjs";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

// New locales can be published before their long-form niche copy is complete.
// Keep the page model complete and make the fallback explicit so the build and
// SEO checks still cover every locale.
export function createFallbackLocale(copy) {
  const base = clone(en);

  return {
    ...base,
    home: { ...base.home, ...copy.home },
    where: { ...base.where, ...copy.where },
  };
}
