# Website accessibility controller behavior

Freeze the presentation and existing browser contracts before replacing the
controller. The existing locale copy, CSS, DOM IDs, button order, page routes,
video sources and all account/Manager/Host/Pay code are outside this rewrite.
Remove the old source in one commit and add an independently implemented
controller in the following commit. A lower blame count alone is not acceptance.

Preserve these visitor-visible contracts:

* Settings use `wifigate-accessibility-settings-v2`. Nine boolean preferences
  control the existing nine root classes. Text scale is the bounded index of
  100, 115, 130 or 150 percent. Read malformed/unavailable storage safely;
  inactive settings remove the key. Remove the obsolete v1 key.
* Apply preferences before DOM readiness. Scale uses the existing CSS property
  and class; reduced motion pauses all videos and removes autoplay. Publish
  `site-accessibility-change` with a fresh settings snapshot. The public
  `isReducedMotionRequested()` also honors the OS media query.
* Mount once when every required node and locale bundle exists, including when
  `setupAccessibilityWidget()` is called again by main.js. Select exact page
  language, then English, then first available copy. Keep all translated labels,
  titles, option descriptions, percentage/count placeholders and statement URL.
* The closed panel is inert. Opening updates ARIA, backdrop/body/panel classes
  and focuses Close on the next animation frame. Escape/backdrop/Close restore
  the launcher unless hidden. Tab cycles within visible enabled controls;
  Shift-Tab from outside or the first control goes to the last control.
* Primary-pointer long press takes 550 ms. Movement over 8px before activation
  cancels it. Preserve the original grab offset, best-effort pointer capture,
  optional 15ms vibration and placement within an 8px viewport margin. Dragging
  ends with click suppression, never opens the panel and remembers the reading-
  start fraction and vertical fraction in `wifigate-a11y-fab-position-v2`.
  Ignore/remove the obsolete physical-position key. Mirror saved placement when
  direction changes. Resize clamps the current position. Hide only until reload.
* The dismiss control appears for five seconds, follows the launcher and uses
  localized copy. Outside pointer/Escape hides it. Suppress context menu and
  native drag. A late real video start must not move an actively arranged target.
* An unarranged launcher clears hero actions and replay controls by 8px, with
  4px horizontal tolerance. Resolve intersecting targets from bottom to top,
  cap the lift at the top viewport margin and clear it when hidden, arranged or
  the dialog is open. Recompute on scroll, resize, target size, panel class and
  accessibility preference changes; coalesce observer updates into one frame.

Verify against real Chromium and the unchanged existing menu, FAB and CSS
presentation tests. Include unavailable/corrupt storage and absent/incomplete
DOM cases. These are website browser contracts, not substitutes for physical
phone, BLE, production authorization or legal ownership acceptance.
