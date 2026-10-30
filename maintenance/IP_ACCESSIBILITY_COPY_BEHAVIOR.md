# Accessibility locale dictionary

Reconstruct the entire `js/accessibility-copy.js` program after a separate whole
deletion commit. Its public contract is one ordinary mutable
`window.accessibilityCopy` dictionary, with39locales and34string leaves per locale.
The browser controller and static generator both evaluate this same script.

Keep the existing locale order, complete nested property order and every localized
label exactly. These words and the`{count}`/`{percent}`tokens are fixed product
inputs to the behavior contract;preserving them is **not** a claim that existing
words have been newly authored or that legal ownership has been determined.
Freeze the original complete global JSON serialization hash, all per-locale
serialization hashes and the ordered34field schema before deleting the source.
Raw source and the fixed label facts remain private, with verified backups.

The independent implementation composes ordinary nested records from that
ordered field schema and locale value rows. It must create independent objects
for each locale, including text-size and option groups. It must not freeze them,
share mutable groups, add window globals, retain stale dictionary fields or
touch unrelated window properties. Re-evaluation replaces the dictionary with a
fresh equivalent one. Missing`window`retains the original ReferenceError boundary.

Keep all39locale identifiers, label strings, whitespace/direction marks, option
names, nested shapes and insertion order. Do not rewrite labels, translate
anything anew, add fallbacks, change the controller or alter dependency/product
configuration. Add English comments for the schema, locale facts and hydration.

Acceptance requires the original and replacement to pass the same frozen
dictionary contracts, actual Chrome controller checks and complete isolated
CLI output comparison. Every generated path/full DOM/text/attribute/JSON model
must remain equivalent;keep byte differences visible. Verify unchanged product
configuration/assets and audit all changed source/test/spec/fact paths. Retain
failed attempts and keep primary/main/hosting unpublished.
