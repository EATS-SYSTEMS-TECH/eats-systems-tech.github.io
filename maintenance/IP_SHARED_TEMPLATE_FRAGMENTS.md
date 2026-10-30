# Shared footer and Host detail fragments

Reconstruct both entire HTML files independently, after a separate deletion
commit. The frozen DOM fingerprints are behavioral inputs: they preserve every
element, attribute, meaningful text and SVG geometry while allowing authoring
comments, indentation and attribute serialization to differ. Preserve product
copy, translation keys, static paths, media, accessible labels and DOM order.
Do not regenerate or publish the primary website here.

The Host fragment has four sections in order: audience (`wa-audience`), security
(`section wa-secure`), pricing (`section wa-pricing`, id`wa-pricing`), and the
final contact action (`section wa-cta`). The audience has its existing English
accessible label and one empty `container wa-audience__row` mount. Security and
pricing keep their labelled heading IDs, eyebrow/title/subtitle copy markers,
`wa-head` wrapper and empty grid mount. Pricing also keeps its translated note.
The final contact action keeps its container/box/title/text/link structure,
`btn btn--primary btn--hero`, literal`../index.html#contact` destination and
translated CTA key. Preserve all existing English fallback meaning. The shared
renderer owns repeated cards, offers, quantities, benefits and runtime policy;
this fragment must not duplicate or invent them.

The footer is one `footer.site-footer[dir=ltr]` with its container/inner wrapper.
Keep four columns in order: brand, legal navigation, app/support, social. Brand
retains its existing384×384lazy/async logo, alternative text, classes and tagline
copy marker. The tagline's existing internal newline is intentional. Legal keeps
its navigation label and heading marker, followed by terms/privacy/cookies in
exact first/second/third child order, the cookie-settings button and accessibility
link. Preserve initial`../` paths and all direction/copy attributes.

App/support keeps both store anchors and their current placeholder destinations,
aria-labels, kicker/name spans and exact decorative SVG dimensions, colors and
geometry. Retain support mail and WhatsApp Business destinations, icon geometry,
support classes, English labels, LTR text and external-link protections. Social
keeps Facebook/YouTube/LinkedIn/Instagram/WhatsApp in order with exact destinations,
aria-labels, icon geometry and external-link protections. Keep the final2026
copyright text/class/copy marker/direction. Do not alter destination identifiers,
brand assets or contact actions.

Add English responsibility comments for each section/column. Validate the actual
original fragments against their frozen complete DOM fingerprints before the
deletion. Then validate the replacement with those same contracts, existing Host
composition contracts and actual full isolated CLI output comparison. Compare
every generated path/full meaningful DOM/text/attribute/JSON model, preserve all
failed attempts, and check unchanged source/config/assets. Run attribution for
all changed source/test/spec/fact paths separately. Git attribution does not by
itself determine legal ownership or final acceptance.
