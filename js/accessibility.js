// /js/accessibility.js
// The accessibility menu (IS 5568 / WCAG 2.x AA support tools). Copy for every
// locale comes from js/accessibility-copy.js, loaded before this file.

const ACCESSIBILITY_STORAGE_KEY = "wifigate-accessibility-settings-v2"
const ACCESSIBILITY_TEXT_SCALES = [1, 1.15, 1.3, 1.5]
const ACCESSIBILITY_TOGGLES = {
  highContrast: "a11y-high-contrast",
  grayscale: "a11y-grayscale",
  underlineLinks: "a11y-underlined-links",
  readableFont: "a11y-readable-font",
  textSpacing: "a11y-text-spacing",
  highlightHeadings: "a11y-highlight-headings",
  bigCursor: "a11y-big-cursor",
  focusHighlight: "a11y-focus-highlight",
  reducedMotion: "a11y-reduced-motion",
}
const ACCESSIBILITY_DEFAULTS = {
  textScale: 0,
  ...Object.fromEntries(Object.keys(ACCESSIBILITY_TOGGLES).map((key) => [key, false])),
}

let accessibilityState = { ...ACCESSIBILITY_DEFAULTS }
let accessibilityRefs = null
let accessibilityPanelOpen = false

function getAccessibilityCopies() {
  return window.accessibilityCopy || {}
}

// A generated page embeds its own language only; the full file has them all.
function getAccessibilityLanguage() {
  const copies = getAccessibilityCopies()
  const lang = document.documentElement.getAttribute("lang") || "en"
  return copies[lang] ? lang : copies.en ? "en" : Object.keys(copies)[0]
}

function getAccessibilityBundle() {
  const copies = getAccessibilityCopies()
  return copies[getAccessibilityLanguage()] || copies.en
}

function loadAccessibilitySettings() {
  const next = { ...ACCESSIBILITY_DEFAULTS }
  try {
    const saved = JSON.parse(localStorage.getItem(ACCESSIBILITY_STORAGE_KEY) || "null")
    if (!saved || typeof saved !== "object") return next
    const scale = Number(saved.textScale)
    if (Number.isInteger(scale) && scale >= 0 && scale < ACCESSIBILITY_TEXT_SCALES.length) next.textScale = scale
    Object.keys(ACCESSIBILITY_TOGGLES).forEach((key) => {
      next[key] = saved[key] === true
    })
  } catch (error) {
    // Storage can be unavailable; the defaults apply.
  }
  return next
}

function saveAccessibilitySettings() {
  try {
    if (countAccessibilityAdjustments()) {
      localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(accessibilityState))
    } else {
      localStorage.removeItem(ACCESSIBILITY_STORAGE_KEY)
    }
  } catch (error) {
    // The settings still apply to this page.
  }
}

function countAccessibilityAdjustments() {
  return (accessibilityState.textScale ? 1 : 0) +
    Object.keys(ACCESSIBILITY_TOGGLES).filter((key) => accessibilityState[key]).length
}

function isReducedMotionRequested() {
  if (document.documentElement.classList.contains(ACCESSIBILITY_TOGGLES.reducedMotion)) return true
  try {
    return Boolean(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)
  } catch (error) {
    return false
  }
}

function dispatchAccessibilityChange() {
  document.dispatchEvent(
    new CustomEvent("site-accessibility-change", {
      detail: { settings: { ...accessibilityState } },
    })
  )
}

// Stop animations also stops every video and animated media on the page
// (WCAG 2.2.2 Pause, Stop, Hide).
function pauseAllMedia() {
  document.querySelectorAll("video").forEach((video) => {
    if (!video.paused) video.pause()
    video.removeAttribute("autoplay")
  })
}

function applyAccessibilitySettings() {
  const root = document.documentElement
  Object.entries(ACCESSIBILITY_TOGGLES).forEach(([key, className]) => {
    root.classList.toggle(className, Boolean(accessibilityState[key]))
  })
  const scale = ACCESSIBILITY_TEXT_SCALES[accessibilityState.textScale] || 1
  root.classList.toggle("a11y-text-scaled", scale !== 1)
  if (scale !== 1) root.style.setProperty("--a11y-text-scale", String(scale))
  else root.style.removeProperty("--a11y-text-scale")
  if (accessibilityState.reducedMotion) pauseAllMedia()

  updateAccessibilityControls()
  dispatchAccessibilityChange()
}

function updateAccessibilityControls() {
  if (!accessibilityRefs) return
  const copy = getAccessibilityBundle()

  accessibilityRefs.optionButtons.forEach((button) => {
    const enabled = Boolean(accessibilityState[button.dataset.a11ySetting])
    button.classList.toggle("is-active", enabled)
    button.setAttribute("aria-pressed", String(enabled))
  })

  const percent = Math.round((ACCESSIBILITY_TEXT_SCALES[accessibilityState.textScale] || 1) * 100)
  accessibilityRefs.textSizeValue.textContent = `${percent}%`
  accessibilityRefs.textSizeValue.setAttribute("aria-label", copy.textSize.level.replace("{percent}", percent))
  accessibilityRefs.textSmaller.disabled = accessibilityState.textScale === 0
  accessibilityRefs.textLarger.disabled = accessibilityState.textScale === ACCESSIBILITY_TEXT_SCALES.length - 1

  const count = countAccessibilityAdjustments()
  accessibilityRefs.status.textContent = count ? copy.statusActive.replace("{count}", count) : copy.statusDefault
  accessibilityRefs.resetButton.disabled = count === 0
}

function updateAccessibilityCopy() {
  if (!accessibilityRefs) return
  const copy = getAccessibilityBundle()
  const refs = accessibilityRefs

  if (refs.skipLink) refs.skipLink.textContent = copy.skipLink
  refs.eyebrow.textContent = copy.eyebrow
  refs.title.textContent = copy.title
  refs.description.textContent = copy.description
  refs.resetButton.textContent = copy.reset
  refs.closeButton.setAttribute("aria-label", copy.closeButton)
  refs.textSizeTitle.textContent = copy.textSize.label
  refs.textSizeDescription.textContent = copy.textSize.description
  refs.textSmaller.setAttribute("aria-label", copy.textSize.decrease)
  refs.textSmaller.title = copy.textSize.decrease
  refs.textLarger.setAttribute("aria-label", copy.textSize.increase)
  refs.textLarger.title = copy.textSize.increase
  refs.statement.textContent = copy.statementLink

  refs.optionButtons.forEach((button) => {
    const optionCopy = copy.options[button.dataset.a11ySetting]
    if (!optionCopy) return
    button.querySelector(".a11y-option__title").textContent = optionCopy.label
    button.querySelector(".a11y-option__description").textContent = optionCopy.description
  })

  const label = accessibilityPanelOpen ? copy.closeButton : copy.openButton
  refs.fab.setAttribute("aria-label", label)
  refs.fab.title = label
  updateAccessibilityControls()
}

function getPanelFocusables() {
  return Array.from(
    accessibilityRefs.panel.querySelectorAll("button:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])")
  ).filter((element) => element.offsetParent !== null)
}

function openAccessibilityPanel() {
  if (!accessibilityRefs || accessibilityPanelOpen) return
  const { fab, panel, backdrop, closeButton } = accessibilityRefs

  accessibilityPanelOpen = true
  fab.setAttribute("aria-expanded", "true")
  panel.setAttribute("aria-hidden", "false")
  panel.inert = false
  backdrop.classList.add("is-visible")
  panel.classList.add("is-open")
  document.body.classList.add("a11y-panel-open")
  updateAccessibilityCopy()
  requestAnimationFrame(() => closeButton.focus())
}

function closeAccessibilityPanel(restoreFocus = true) {
  if (!accessibilityRefs || !accessibilityPanelOpen) return
  const { fab, panel, backdrop } = accessibilityRefs

  accessibilityPanelOpen = false
  fab.setAttribute("aria-expanded", "false")
  panel.setAttribute("aria-hidden", "true")
  // Closed: out of the tab order as well as hidden from screen readers.
  panel.inert = true
  backdrop.classList.remove("is-visible")
  panel.classList.remove("is-open")
  document.body.classList.remove("a11y-panel-open")
  updateAccessibilityCopy()
  if (restoreFocus && !fab.hidden) fab.focus()
}

function handleAccessibilityKeydown(event) {
  if (!accessibilityPanelOpen) return
  if (event.key === "Escape") {
    event.preventDefault()
    closeAccessibilityPanel()
    return
  }
  // The menu is a modal dialog: Tab stays inside it.
  if (event.key === "Tab") {
    const focusables = getPanelFocusables()
    if (!focusables.length) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (event.shiftKey && (document.activeElement === first || !accessibilityRefs.panel.contains(document.activeElement))) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }
}

function toggleAccessibilitySetting(key) {
  if (!(key in ACCESSIBILITY_TOGGLES)) return
  accessibilityState[key] = !accessibilityState[key]
  applyAccessibilitySettings()
  saveAccessibilitySettings()
}

function stepAccessibilityTextScale(delta) {
  const next = Math.min(ACCESSIBILITY_TEXT_SCALES.length - 1, Math.max(0, accessibilityState.textScale + delta))
  if (next === accessibilityState.textScale) return
  accessibilityState.textScale = next
  applyAccessibilitySettings()
  saveAccessibilitySettings()
}

function resetAccessibilitySettings() {
  accessibilityState = { ...ACCESSIBILITY_DEFAULTS }
  applyAccessibilitySettings()
  saveAccessibilitySettings()
}

// Long press on the accessibility button lets the visitor drag it to another
// place (remembered on this device) or hide it with the X; a hidden button is
// back as soon as the page is loaded again.
const A11Y_FAB_POSITION_KEY = "wifigate-a11y-fab-position"
const A11Y_FAB_LONG_PRESS_MS = 550
const A11Y_FAB_MARGIN = 8

function placeAccessibilityFab(fab, left, top) {
  const rect = fab.getBoundingClientRect()
  const maxLeft = Math.max(A11Y_FAB_MARGIN, window.innerWidth - rect.width - A11Y_FAB_MARGIN)
  const maxTop = Math.max(A11Y_FAB_MARGIN, window.innerHeight - rect.height - A11Y_FAB_MARGIN)
  const x = Math.min(Math.max(A11Y_FAB_MARGIN, left), maxLeft)
  const y = Math.min(Math.max(A11Y_FAB_MARGIN, top), maxTop)
  // Logical insets first: in RTL inset-inline-end is the same property as left.
  fab.style.insetInlineEnd = "auto"
  fab.style.insetBlockEnd = "auto"
  fab.style.right = "auto"
  fab.style.bottom = "auto"
  fab.style.left = x + "px"
  fab.style.top = y + "px"
  return { x, y }
}

function setupAccessibilityFabArrange(fab) {
  function applySavedPosition() {
    try {
      const saved = JSON.parse(localStorage.getItem(A11Y_FAB_POSITION_KEY) || "null")
      if (saved && typeof saved.x === "number" && typeof saved.y === "number") {
        placeAccessibilityFab(fab, saved.x * window.innerWidth, saved.y * window.innerHeight)
      }
    } catch (error) {
      // Ignore a missing or malformed saved position.
    }
  }

  const dismiss = document.createElement("button")
  dismiss.type = "button"
  dismiss.className = "a11y-fab__dismiss"
  dismiss.hidden = true
  dismiss.textContent = "×"
  document.body.appendChild(dismiss)

  let pressTimer = null
  let pressStart = null
  let grabOffset = null
  let arranging = false
  let moved = false
  let hideDismissTimer = null

  function positionDismiss() {
    const rect = fab.getBoundingClientRect()
    dismiss.style.left = Math.max(4, rect.left - 6) + "px"
    dismiss.style.top = Math.max(4, rect.top - 6) + "px"
  }

  function showDismiss() {
    const label = getAccessibilityBundle().hideButton
    dismiss.setAttribute("aria-label", label)
    dismiss.title = label
    positionDismiss()
    dismiss.hidden = false
    clearTimeout(hideDismissTimer)
    hideDismissTimer = setTimeout(() => {
      dismiss.hidden = true
    }, 5000)
  }

  function cancelPress() {
    clearTimeout(pressTimer)
    pressTimer = null
  }

  fab.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return
    const rect = fab.getBoundingClientRect()
    pressStart = { x: event.clientX, y: event.clientY }
    grabOffset = { x: event.clientX - rect.left, y: event.clientY - rect.top }
    moved = false
    cancelPress()
    pressTimer = setTimeout(() => {
      arranging = true
      fab.classList.add("is-arranging")
      if (fab.setPointerCapture) {
        try {
          fab.setPointerCapture(event.pointerId)
        } catch (error) {
          // Capture is best-effort; dragging still follows the pointer.
        }
      }
      if (navigator.vibrate) navigator.vibrate(15)
      showDismiss()
    }, A11Y_FAB_LONG_PRESS_MS)
  })

  fab.addEventListener("pointermove", (event) => {
    if (!arranging) {
      if (pressStart && Math.hypot(event.clientX - pressStart.x, event.clientY - pressStart.y) > 8) cancelPress()
      return
    }
    event.preventDefault()
    moved = true
    placeAccessibilityFab(fab, event.clientX - grabOffset.x, event.clientY - grabOffset.y)
    positionDismiss()
  })

  function endPress() {
    cancelPress()
    pressStart = null
    if (!arranging) return
    arranging = false
    fab.classList.remove("is-arranging")
    fab.dataset.suppressClick = "true"
    if (moved) {
      const rect = fab.getBoundingClientRect()
      try {
        localStorage.setItem(A11Y_FAB_POSITION_KEY, JSON.stringify({ x: rect.left / window.innerWidth, y: rect.top / window.innerHeight }))
      } catch (error) {
        // The new position still applies for this page.
      }
      showDismiss()
    }
  }

  fab.addEventListener("pointerup", endPress)
  fab.addEventListener("pointercancel", endPress)
  fab.addEventListener("contextmenu", (event) => event.preventDefault())
  // A native drag of anything inside the button would cancel the long press.
  fab.addEventListener("dragstart", (event) => event.preventDefault())

  dismiss.addEventListener("click", () => {
    if (accessibilityPanelOpen) closeAccessibilityPanel(false)
    fab.hidden = true
    dismiss.hidden = true
  })

  document.addEventListener("pointerdown", (event) => {
    if (event.target !== dismiss && !fab.contains(event.target)) dismiss.hidden = true
  })
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") dismiss.hidden = true
  })
  window.addEventListener("resize", () => {
    if (fab.style.left) placeAccessibilityFab(fab, parseFloat(fab.style.left), parseFloat(fab.style.top))
    if (!dismiss.hidden) positionDismiss()
  })

  applySavedPosition()
}

function setupAccessibilityWidget() {
  if (accessibilityRefs) return
  const byId = (id) => document.getElementById(id)
  const refs = {
    fab: byId("a11y-fab"),
    panel: byId("a11y-panel"),
    backdrop: byId("a11y-backdrop"),
    closeButton: byId("a11y-close"),
    resetButton: byId("a11y-reset"),
    status: byId("a11y-status"),
    title: byId("a11y-title"),
    description: byId("a11y-description"),
    eyebrow: byId("a11y-eyebrow"),
    textSizeTitle: byId("a11y-text-size-title"),
    textSizeDescription: byId("a11y-text-size-description"),
    textSizeValue: byId("a11y-text-size-value"),
    textSmaller: byId("a11y-text-smaller"),
    textLarger: byId("a11y-text-larger"),
    statement: byId("a11y-statement"),
  }
  if (Object.values(refs).some((element) => !element) || !getAccessibilityBundle()) return
  refs.skipLink = document.querySelector(".skip-link")
  refs.optionButtons = Array.from(document.querySelectorAll(".a11y-option[data-a11y-setting]"))
  accessibilityRefs = refs

  // The panel starts closed, so its controls must not take keyboard focus.
  refs.panel.inert = true
  // The statement in this page's language.
  const lang = getAccessibilityLanguage()
  refs.statement.href = lang === "en" ? "/accessibility/" : `/${lang.toLowerCase()}/accessibility/`

  refs.fab.addEventListener("click", () => {
    // The click that ends a long press only arranges the button.
    if (refs.fab.dataset.suppressClick === "true") {
      delete refs.fab.dataset.suppressClick
      return
    }
    if (accessibilityPanelOpen) closeAccessibilityPanel()
    else openAccessibilityPanel()
  })
  refs.closeButton.addEventListener("click", () => closeAccessibilityPanel())
  refs.backdrop.addEventListener("click", () => closeAccessibilityPanel())
  refs.resetButton.addEventListener("click", resetAccessibilitySettings)
  refs.textSmaller.addEventListener("click", () => stepAccessibilityTextScale(-1))
  refs.textLarger.addEventListener("click", () => stepAccessibilityTextScale(1))
  refs.optionButtons.forEach((button) => {
    button.addEventListener("click", () => toggleAccessibilitySetting(button.dataset.a11ySetting))
  })
  document.addEventListener("keydown", handleAccessibilityKeydown)
  document.addEventListener("site-language-change", updateAccessibilityCopy)

  if (window.matchMedia) {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (motionQuery.addEventListener) motionQuery.addEventListener("change", dispatchAccessibilityChange)
    else if (motionQuery.addListener) motionQuery.addListener(dispatchAccessibilityChange)
  }

  setupAccessibilityFabArrange(refs.fab)
  updateAccessibilityCopy()
  applyAccessibilitySettings()
}

// Saved settings apply as soon as this script runs.
accessibilityState = loadAccessibilitySettings()
applyAccessibilitySettings()
try {
  localStorage.removeItem("wifigate-accessibility-settings-v1")
} catch (error) {
  // Nothing stored.
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupAccessibilityWidget, { once: true })
} else {
  setupAccessibilityWidget()
}
