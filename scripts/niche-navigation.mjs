// Default anchors are template compatibility data. The existing locale pager
// later replaces their URLs and labels, or removes them for Host/Auto Open.
const PAGER_SHELLS = [
  { direction: "prev", href: "../sports-facilities/", label: "Previous use case", path: "M14.5 5L8 12L14.5 19" },
  { direction: "next", href: "../roller-shutters/", label: "Next use case", path: "M9.5 5L16 12L9.5 19" },
];

// Both navigation anchors share one structure and retain their public IDs,
// accessible labels and decorative SVGs. Build them before localized navigation
// and scene controls; validate the dedicated slot before replacing its content.
export function installUseCasePagerShells($) {
  const pager = $(".niche-hero__pager");
  if (pager.length !== 1) throw new Error("Use-case navigation requires one pager");
  const links = PAGER_SHELLS.map(item => `            <a href="${item.href}" class="niche-hero__nav-button niche-hero__nav-button--${item.direction}"
              id="niche-${item.direction}-link" aria-label="${item.label}" title="${item.label}">
              <svg class="niche-hero__nav-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="${item.path}" />
              </svg>
            </a>`);
  pager.html(`\n${links.join("\n")}\n          `);
}

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
