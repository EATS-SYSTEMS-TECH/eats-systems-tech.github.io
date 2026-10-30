# Public Host presentation adapter

Replace the complete adapter after a separate deletion commit. Keep the
existing browser/presentation and Host adapter tests as frozen contracts.
This concerns public marketing composition only; it changes no Host backend,
account, billing operation or legal terms.

The public exports remain HOST_PAGE_KEY (`wifigate-host`), getHostPageContent,
installHomeHostPointShells, installHostPricingShells, installHostDetailShells and
appendHostMarketingDetails. Fresh construction uses DOM nodes and text setters
rather than inherited multiline markup templates. Product copy, amounts, icon
geometry, public selectors and translation keys are frozen input data.

getHostPageContent projects the existing locale hero/SEO, homepage automation
image description, three steps and six benefits into new result arrays/objects.
Icons stay calendar/invite/phone and key-off/calendar-clock/shield-check/
door-open/building/layers in that order. Require nonblank string copy with the
existing field-specific error; never mutate source locales or add claims/FAQ.

The homepage installer fills only the Host promo list with three decorative
phone/clock/lock icons and the existing pointNTitle/pointNText slots. Documents
without that scoped list remain unchanged. Keep SVG geometry and attributes,
CSS classes and LTR text markers.

The pricing installer requires exactly one scoped grid before mutation. Keep
Starter/Pro/Hotel/Enterprise, amounts ₪29/₪99/₪299/Custom, their three existing
features/descriptions, Hotel-only badge/primary CTA and Enterprise-only amount
translation/no monthly suffix. All contact actions keep ../index.html#contact.
Use the existing per/planCta/description/feature translation paths and the
decorative checkmark attributes. Preserve headings and pricing note.

The combined detail installer validates all audience/security/pricing slots
before modifying any. Keep four audience chips (hotels/rentals/guesthouses/
parking), three security cards with iNt/iNx keys and all existing English
fallback copy. Headings, notes, accessible section labels and final CTA stay
in the separate template and remain unchanged.

Appending localized detail sections requires a callable source document,
exactly one benefits anchor, no existing wrapper and exactly one source section
of each kind. Clone audience/security/pricing/CTA in source document order into
one wa-page host-marketing-details wrapper after the shared benefits section.
Validate before mutation and never consume or modify the localized source.

Acceptance: all39locale projection and failure-boundary tests, actual Chromium
presentation, independent full CLI generation, complete generated DOM models
with every mismatch recorded, and complete attribution for the rewritten scope.
Whitespace-only serialization may differ; localized visible text, DOM semantics,
classes, routes, data keys, geometry and scoped layout must agree. A source
delivery does not close remaining website/final-main/legal acceptance.
