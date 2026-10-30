# Localized static-site builder

Reconstruct the **entire** `scripts/build-localized-site.mjs` program from
this behavior contract. Freeze the original full CLI output and existing
presentation contracts first. Commit a whole-file deletion separately from the
new implementation. The earlier script-data fix and zero Git attribution do
not establish this independent reconstruction.

The new design may separate document/chrome, translated content and orchestration
into `localized-builder-document.mjs`, `localized-builder-content.mjs` and the
CLI. Keep existing imported renderers and their contracts. Add English comments
for responsibility blocks. Do not change inputs, locales, URLs, assets, dependency
versions, account services, product portals, manifests or published output here.

## Inputs, validation and paths

Work relative to the invocation's current directory. Use the existing
`SITE_ORIGIN`, `SITE_LANGUAGES`, `RTL_LANGUAGES` and canonical definitions. English
is the fallback. Import each locale's homepage and optional Host copy once;
evaluate the two plain runtime copy scripts in an isolated `window` sandbox.
Load the accepted scene manifest. Reject missing localized cookie reopening
labels and every reported niche/landing/Auto Open content problem before writing.

Validate each homepage against English recursively: required object keys must
match, arrays must have the same length and element shape, primitive types must
match and strings must contain non-whitespace text. Ignore the optional paths
`hero.statement`, `footer.taglineLines`, `platform.subscriptionNote`,
`why.pointsNote` and the first three automation point icons on both sides of the
required-key comparison. A supplied optional path also present in English still
has its shape checked. Reject untranslated English navigation-account strings
in other locales, preserving the locale and key in the diagnostic.

English home is `/`; other locales use their lowercase code as the first path
segment. Append the literal page-key segments for non-home pages. Canonical URLs
end in `/`, output files in `index.html`, and asset depth is one `../` per
directory segment. Leave empty, fragment, protocol-relative and scheme URLs
untouched; otherwise remove leading root/parent/current prefixes in the existing
order and prepend the page's asset depth. Rewrite scripts, images, sources,
video posters and non-canonical/non-alternate/non-preconnect stylesheet/icon links.

## Shared document contract

Replace only whole-line, double-quoted `data-partial` placeholders for the three
known header/footer/accessibility partials. Strip a BOM and the first authoring
comment, trim/cache each nonempty partial, reject unknown or empty names, and
reindent each nonblank line to the placeholder. Preserve nonmatching source.

Set html language/direction and the body's RTL class. Translate string-valued
`data-i18n` paths and preserve non-string/missing values. In RTL append RLM after
terminal ASCII punctuation only when no terminal direction mark exists; retain
existing whitespace. Keep localized line breaks and element direction.

Use the curated homepage footer for every document that has a footer. Preserve
the three heading/link positions, multiline tagline, 2026 copyright fallback,
contact directions and localized legal/accessibility paths. Accessibility UI
retains its exact selectors, titles, labels, defaults, setting descriptions and
localized statement link; reject a missing setting copy.

The language picker retains canonical per-page destinations, selected class and
aria-current, flag paths/sizes/alternative text and RTL/auto option labels. The
shared header retains navigation order, contact class, home/hash routes, account
labels/direction and English dashboard fallback outside Hebrew. Keep the shop
and cart's existing English/Hebrew copy, data-cart-copy fields, classes and IDs.
Retain all cache-version strings and runtime insertion positions. Standalone
headers remove navigation/account/cart/language actions and unwrap their logo
and navigation into noninteractive spans/divs as before.

Final serialization applies the shared header, media watermarks, localized
cookie reopening label/style/runtime and **only the current locale's** inline
cookie/accessibility copies through `serializeScriptData`. Host and Auto Open
retain their distinct consent runtime versions. Remove trailing horizontal
whitespace, retain meaningful text/attributes and ensure a final newline.

## Page content and metadata

Home: install feature/Host shells before translation. Retain the statement hero
branch and the conventional hero branch (brand/category order, title lines,
subtitle sentence/comma/word splitting and proof list). Apply every existing
platform, private-access, solution, automation, tutorial, invitation, FAQ, why
and contact copy slot and image alt. Optional subscription/entry-point notes
remain visible only with copy. Preserve icon overrides and reject unknown icons.
Localize niche and Host links; wrap both Auto Open media and title with its page
link; apply both accepted montage/hospitality scenes and localized media labels.
Retain section order, inline hero-locale data, SEO keywords/brand/FAQ graph,
canonical and complete hreflang cluster.

Legal: generate each existing legal main in the shared shell for all locales.
Keep English legal body lang/direction under localized language notes, remove
absent notes, and preserve legal company/TOC/section semantics. Only English and
Hebrew form legal hreflang clusters; all legal variants remain index/follow.
Preserve exact-home, literal-fragment, footer, cross-legal and final ghost-link
rewrite order. Utility pages retain heading/status/buttons and localized fallback
JSON, noindex/follow and their existing page graph, outside the sitemap.

Use-case bodies retain hero/optional lead/proof precedence, accepted imagery,
highlights and optional CTA, bento benefits and tags/illustrations, accessible
FAQ details and year. Preserve every icon geometry and all visual data as display
facts. Benefit spans: first two lead/feature; remaining thirds, with a lone last
card full width or final pair half width; a single overall card is full width.
Roster/invite initials use the first Unicode grapheme; schedule positions use
24-hour minutes over1440 and time labels stay LTR. Unknown illustration types
fail. Preserve the canonical circular pager and literal home-fragment/legacy
Host rewrites. Initialize direction, body skin, assets, language runtime and
pager shells in their existing order. Keep image dimensions, SEO article graph,
breadcrumbs, optional FAQ/service/about/mentions and publication dates.

Landing pages retain intro/date, ordered steps/note and accessible fact table
positions, Gregorian/Latin-digit localized UTC long date, heading-bearing FAQ
summaries with stable anchors, removed pager and landing stylesheet. Auto Open
requires its scene, keeps its skin/media and removes FAQ/navigation assets.
Host requires hospitality media, composes and translates its four detail
sections, preserves automation stylesheet, service metadata and both aliases.
Shop keeps translated content language, breadcrumbs/product image and noindex,
and stays outside the sitemap. Do not change any service/pricing/account behavior.

## Publication, failures and acceptance

Every canonical use-case or Host write completes before alias discovery and
ordered redirect writes, and before its sitemap registration. Keep all existing
redirect bodies/URLs. A failed earlier step stops later publication.

Create parent directories, read previous output if possible and skip writing
LF-equivalent content. Otherwise mark the resolved path changed before writing.
Retry only EACCES/EBUSY/EPERM/UNKNOWN, at most five attempts, with100/200/400/800ms
delays. Propagate other/final errors. Preserve original prior sitemap dates for
unchanged content and current UTC date for changed content through the existing
sitemap helper. Contact uses its last Git commit date or today's fallback.

Full run order is home, shop, legal, niche, landing, Auto Open, Host, utility,
login, contact sitemap entry, sitemap, llms and404. Login/shop/utility remain
outside the sitemap. `--scene-media-only` stops after home+niche;
`--consumer-consent-only` stops after home/shop/legal/niche/landing/Auto Open+404.
Keep current order, frequencies/priorities, canonical-only sitemap and llms data.
Report failures to stderr and return a nonzero exit code.

Acceptance requires all existing presentation contracts, the frozen edge-case
contracts and two actual full isolated CLI runs over identical frozen inputs.
Compare **every** generated path and full meaningful DOM/attribute/text/JSON
model (or exact text for llms), retain all mismatches and all failed attempts,
and verify unchanged configuration/assets/dependencies. Source attribution is
separate from behavior, legal ownership and production approval. Do not replace
or publish primary/main/hosting output during this work.
