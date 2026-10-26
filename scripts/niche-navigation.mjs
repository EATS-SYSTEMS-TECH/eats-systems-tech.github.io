// The canonical array defines pager order. Stop at the first strict key match;
// empty/unknown selections have no pager, and a singleton points to itself.
export function circularNiches(definitions, currentKey) {
  let index = 0;
  for (const definition of definitions) {
    if (definition.key === currentKey) {
      return {
        previous: definitions[index === 0 ? definitions.length - 1 : index - 1],
        next: definitions[index + 1 === definitions.length ? 0 : index + 1],
      };
    }
    index++;
  }
  return null;
}

// Resolve both labels before changing either link. Preserve truthy localized,
// English and raw-key fallback, with no new copy, normalization or URL policy.
export function setNichePager($, adjacent, { localeNicheContent, defaultNicheContent, locale, buildPagePath }) {
  if (!adjacent) return;
  const previousLabel = localeNicheContent?.niches?.[adjacent.previous.key]?.label
    || defaultNicheContent?.niches?.[adjacent.previous.key]?.label
    || adjacent.previous.key;
  const nextLabel = localeNicheContent?.niches?.[adjacent.next.key]?.label
    || defaultNicheContent?.niches?.[adjacent.next.key]?.label
    || adjacent.next.key;

  // Install previous before next, retaining each href/aria/title sequence.
  // A later path error therefore leaves the earlier link already installed.
  for (const [selector, item, label] of [
    ["#niche-prev-link", adjacent.previous, previousLabel],
    ["#niche-next-link", adjacent.next, nextLabel],
  ]) {
    $(selector).attr("href", buildPagePath(locale, item.key)).attr("aria-label", label).attr("title", label);
  }
}
