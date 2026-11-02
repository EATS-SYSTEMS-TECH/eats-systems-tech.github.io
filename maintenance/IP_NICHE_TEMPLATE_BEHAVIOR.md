# Shared use-case template contract

Start at `ba1e9c8d8988ef9598714bf0ebb7c17dcae2b630`. Freeze the complete
actual HTML parser tree before a separate removal and addition of
`templates/niche.template.html`. The template is a declarative interface;
the existing layout, wording, selectors and asset/cache references are facts
that must remain identical. No new layout authorship is claimed.

The head retains English language, UTF8, responsive viewport, default title,
description/author/robots, canonical hospitality URL, article Open Graph,
large-card Twitter metadata, share logo and English alternate. Keep all six
favicon/mobile icon sizes and their paths. Preserve stylesheet order: fonts,
base styles, accessibility, niche, FAQ. Preserve deferred script order: utils,
navigation, accessibility copy, accessibility behavior, niche page, FAQ;
every existing version query stays identical.

The body retains its niche-page class, skip link and shared header placeholder.
The sole main region contains the labelled hero, its eager priority image with
1280x720 dimensions and overlay, then the content container. Its top bar has
the ordered two-item breadcrumb and previous/next links with unchanged
accessible labels, default routes and arrow vector facts. The text block
has eyebrow, h1, initially hidden optional lead, WhatsApp/new-tab action with
noopener+noreferrer, benefits anchor, and an initially empty proof list.

After the hero, retain the initially hidden highlights/grid, labelled benefits
section with empty bento list, and labelled FAQ section with its header/list.
The shared footer and accessibility placeholders follow main. Every original
element, attribute/value, child order, visible fallback string, ID and class
must remain identical after parsing. Only comments, indentation, attribute
serialization and empty-element syntax may differ. Explain each region in
English comments. Preserve the original partial-placeholder syntax required
by the actual build.

The independently executed full generator already produced 1483 HTML outputs,
sitemap and llms in a separate scratch directory from this exact prior source.
After reconstruction, run the actual generator there with the new template,
compare all 1485 output files to baseline, and retain changed/failed attempts.
This is source/generator evidence. Browser, remaining W3 styles/builder,
final generated delivery and legal acceptance remain separate.
