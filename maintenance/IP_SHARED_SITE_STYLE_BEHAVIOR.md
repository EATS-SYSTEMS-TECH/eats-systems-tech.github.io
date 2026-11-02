# Independent primary website presentation

Reconstruct the complete css/styles.css after freezing and checking the original
browser behavior, with a separate whole-file deletion commit followed by the new
implementation. Author responsibilities from this prose and frozen design facts;
do not regenerate the former declaration list or use formatting as an ownership
fix. Group shared responsibilities and use local parameters for repeated
geometry while preserving public selectors, specificity, cascade and state.
Add English comments for each responsibility. Existing design values and public
selector names remain compatibility inputs, not a legal ownership conclusion.

Preserve the public color palette, radii, shadows, container width and transition
tokens: light-blue background, white surfaces, blue primary/soft/dark variants,
dark text, muted text, subtle borders and visible focus; 1.25rem/0.9rem/pill radii;
1120px container; 160ms and 220ms ease-out feedback; 420ms rotator duration.
Retain every existing CSS custom-property name/value at its original scope.
New internal implementation parameters may be added. Header height is 3.4rem,
4.8rem at 769–1024px, and 4.2rem from 1200px. Contact keeps its public dark token.

Reset/layout: border-box everywhere and pseudos; zero body margin, full viewport
minimum, system font stack, 1.5 line height and existing background/ink; smooth
anchor scrolling with header-aware section offsets. Preserve generic image,
anchor, paragraph and unordered-list defaults, visible keyboard focus and the
centered inset container. Sections, alternate surfaces, eyebrow/title/subtitle
metrics and the separately centered advantages/where headers retain geometry,
responsive type scales, reading widths and whitespace behavior.

Navigation: sticky translucent blurred header, flexible branded row, existing
link spacing, directional isolation, pointer color/lift and gradient underline.
Selected links retain their underline/color. Language selection keeps a relative
frame, white 170px-minimum button, 42px flag holder/40px image with the Israeli
36px exception, arrow rotation, absolute scrollable dropdown and selected/hover
option surfaces. Keep current option/label shrink behavior and keyboard ring.
The hamburger remains hidden on desktop and preserves its bar dimensions.

At 768px and below the language control is centered over the row and ellipsizes
its selection. Menu links become a translated off-screen grid until open, with
the same opacity/pointer state and motion. Preserve English logo-right/toggle-
left ordering and the stronger RTL opposite ordering, column alignment and
direction. At 769px and above retain desktop language auto margins, navigation
direction and opposite 2rem wrapper offsets. Keep the distinct 769–1024px and
1200px scaling for logo, gaps, links and row alignment. Final effective logo
widths are 65px mobile, 95px tablet/wide, and 48px otherwise. The earlier 70px
unconditional logo declaration is always overwritten and can be removed.

Buttons: preserve inline-flex geometry, pill, typography, wrapping policy,
feedback timings and small variant. Primary and ghost surfaces keep their
gradient/color/shadow/border states. Mouse focus suppresses its ring; keyboard
focus retains the blue outline and offset. Do not change links or handlers.

Hero: retain the dark isolated clipped viewport, complete absolute media crop,
poster scaling, video opacity transition, image-state hit-testing removal and
directional contrast overlays. Preserve video/pause/mute/replay public states,
control hit areas, glass surfaces, positions, glyph visibility, keyboard outline,
hover feedback and hidden-state display. The replay retains its separate
geometry, decorative glyph and initially hidden SVGs in the base sheet. Keep
the text layer's empty-space pointer pass-through and restored descendant input,
Day One font, type scales, readable measures and wrapping actions. Active scene
artwork alone receives input and its existing elevation/filter.

Preserve inclusive 768px/480px hero changes and the later desktop viewport rules.
The later phone rules own minimum height/block padding; the stronger hero action
row exception wins over the generic phone action column. Earlier phone action
gap/margin declarations that are unconditionally overwritten by the later base
rule may be omitted. Keep the original effective values, not contradictory dead
values. Existing breakpoint order is part of the contract.

Features: three columns, then two at 960px, then one at 768px. Cards keep their
centered flexible frames, clipping, media aspect ratio, shadows and hover lift.
Artwork sizing and filter are independent from card geometry. Preserve all nine
public modifiers and their exact source-order precedence, including combined
modifier cases: no-SIM/quick variants precede history on desktop; the other six
follow it. On mobile no-subscription/no-SIM/quick precede history; the other five
follow it. History retains automatic height and bounded 84% width; the rest keep
their appropriate 96% desktop/90% mobile sizes and reduced inset. Preserve title
balance, centered copy and bounded readable measure.

Tutorials: retain gradient cards, hover feedback, numbers supplied elsewhere,
flexible content and bottom-aligned coming-soon status. Preserve the actual
cascade: the later 960px rule gives the base tutorial grid two tracks even below
768px, overriding an earlier phone one-track declaration. The composed homepage
skin owns its further responsive changes; do not silently change the base
behavior during reconstruction.

Contact: dark clipped band with white heading/light subtitle and raised content;
centered option heading and three equal white flexible cards. Preserve icon size,
type, color, minimum heights and bottom action alignment. Email and buttons keep
shared geometry and separate state/timing roles; muted and primary options retain
their surfaces. At 768px retain the single bounded column, lower minimum heights
and action margins. Keep the separate legacy form surface and feedback text.

Footer: retain one dark skin and all four column responsibilities. Brand artwork
and translated multiline copy, bright headings, muted stacked legal/support
links, wrapped fixed-size store badges and square social controls keep their
geometry, typography and hover behavior. Copyright spans the grid with its
divider. Preserve 480px one-column, 768px two-column, 769–1199px three-column and
1200px asymmetric four-column rules, brand/copyright spans and logo sizing.
Keep the separate second WhatsApp support row. Later page skins must retain
their existing cascade strength. The duplicated identical tab-dot rule family
may be represented once; preserve active, pointer and keyboard feedback.

Compatibility: retain hidden tab buttons, inactive/active panes, two-column
why/where layout and its phone collapse, image frames and copy inset, framed
where showcase, row separators, direction-aware arrows and selected edges. Keep
RTL arrow/translation/surface selectors at their original strengths; text color
must remain overridable by later skins. Retain the three separate RTL story
header/heading/video-meta rules. Reveal opacity/translation and 500ms timings
remain unchanged. Do not remove a compatibility role merely because the current
homepage does not instantiate it.

Before deletion, freeze 376 actual Chrome component-rendering cases: default
at 14 widths around every relevant boundary, both English/LTR and Hebrew/RTL,
with base and fully composed homepage styles. At 320/480/768/769/1440px also cover
open navigation/language menus, alternate media state, reveal, six pointer roles,
keyboard focus, 150% text, contrast, reduced motion, print and forced colors.
The fixture uses current real templates/partials/composition and independent
legacy role examples. It does not load media/font assets or execute application
controllers; those bytes and behavior have separate guards/contracts. Do not
present component rendering as a physical-device or deployed-site acceptance.

Hash every standard computed property, both pseudo-elements, border-box sizes and
all pre-existing public custom properties. Capture original timing metadata
before suppressing animations/transitions only for stable paint measurement.
Check repeatability on independent runs before freezing. Retain original source
privately; publish hashes and behavior facts only. Validate the original against
the immutable fixture, then compare the replacement without refreshing it.
Preflight probes expose native hover-scroll positioning and transient internal
scroll-overflow bookkeeping differences under unchanged CSS, while computed
styles remain exact. Retain these diagnostics. Viewport offsets and DOM internal
scroll metrics are outside the immutable style fingerprint. Freeze exact actual
border-box width/height and every computed layout/transform property instead.
Real generated-page clipping/overflow assertions remain separately required;
no computed property is dropped or normalized to hide a source difference.
Capture the actual hovered/focused state's timing and scroll-behavior metadata
before stabilizing movement. Then suppress transitions, animations and smooth
viewport scrolling for measurement only, reset the viewport and replay the same
native pointer/focus input against stable geometry. Include the original timing
and scroll policy in the fingerprint; this must not discard or replace a source
policy change. Preserve every preflight repeatability failure and its diagnostic.
Capture timing metadata
for both pseudo-elements as well, suppress movement on elements and pseudos,
and wait two actual animation frames after stable input replay before sampling.
This settles paint before measuring exact box dimensions and computed styles.
Existing 280 use-case and 192 accessibility cases, complete presentation tests,
actual isolated full localized CLI output parity, real generated-page browser
checks, configuration/assets/other-tree guards and all changed-path attribution
remain required. Record every failure. Keep primary/main/hosting untouched.
