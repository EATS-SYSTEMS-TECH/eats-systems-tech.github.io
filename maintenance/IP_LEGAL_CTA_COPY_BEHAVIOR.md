# Commercial next-step copy on legal pages

Delete the whole `scripts/legal/locale-cta.json` after freezing and checking the
original, then add independently worded commercial copy. This file contains no
governing privacy, terms, cookie or accessibility policy paragraphs. Those legal
documents, their English/Hebrew relationship, dates and company details remain
unchanged. Do not introduce pricing, installation-service or product guarantees.

Preserve all 26 locale IDs and their order, the eyebrow/pricing/back schema,
field order, existing legal eyebrow labels and native action button labels.
Independently word the four titles/paragraphs per locale: pricing.title,
pricing.text, back.title and back.text. The 104 fresh strings follow this meaning:
contact the team on WhatsApp for suitable product selection, installation
planning and next steps; explore the homepage for features, use cases, guides
and team contact routes. These are copy changes only; preserve operational logic.
JSON does not support comments; this document explains every schema block.

The module consumer reads the JSON once, then composes all four legal pages in
39 locales. Keep its current fallback logic: 13 uncovered locales use the
hardcoded English default, not the JSON English row. Hebrew remains Hebrew and
the other policy documents keep the governing English text and language notices.
Do not edit the consumer to simplify or broaden that behavior. Pricing action
labels must not become handles containing @. Keep every non-copy field exact.

The actual pricing anchors retain the WhatsApp Business URL
https://wa.me/message/NZWNMX6V2XVHJ1, external target and noopener/noreferrer.
Back anchors retain the builder's existing localized homepage route. Preserve
every surrounding DOM node, attribute, heading level and data-i18n marker.

The frozen fixture records original and approved replacement data digests,
per-field old/new hashes, fixed labels and all 156 complete consumer-bundle
fingerprints, with exactly the four permitted copy slots normalized for covered
locales. Four complete rendered-body fingerprints similarly normalize only
those slots. Original-phase testing is explicit before deletion; replacement
is the default acceptance phase. An unrecognized third wording must fail.

Acceptance requires the same contracts before/after, complete presentation
checks, an actual full isolated localized CLI run, and all 1,485 generated paths.
Exactly 104 legal pages may change, each in those four text nodes only. Assert
both old and new values against frozen normative copy before normalizing them;
then compare the entire remaining DOM/text/attribute/JSON model. All other output
must retain raw bytes. Preserve failed attempts. Check real Chrome layout for
the 104 changed pages at narrow and wide widths, plus keyboard actions and RTL.
Run verify-site, preserve all other tracked blobs/modes/config/assets and audit
every changed source/test/spec/fact/manifest path. Keep primary/main/hosting
untouched. Source attribution does not establish legal ownership or release
approval; unchanged short action labels remain fixed product facts.
