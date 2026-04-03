// /js/accessibility.js
// Version: 1.0.0

const ACCESSIBILITY_STORAGE_KEY = "wifigate-accessibility-settings-v1"
const ACCESSIBILITY_DEFAULTS = {
  largeText: false,
  highContrast: false,
  underlineLinks: false,
  readableFont: false,
  reducedMotion: false,
}

const ACCESSIBILITY_ROOT_CLASSES = {
  largeText: "a11y-large-text",
  highContrast: "a11y-high-contrast",
  underlineLinks: "a11y-underlined-links",
  readableFont: "a11y-readable-font",
  reducedMotion: "a11y-reduced-motion",
}

const accessibilityCopy = {
  en: {
    skipLink: "Skip to main content",
    eyebrow: "Accessibility",
    openButton: "Open accessibility center",
    closeButton: "Close accessibility center",
    title: "Accessibility Center",
    description: "Adjust the site to suit your reading and navigation preferences.",
    reset: "Reset",
    statusDefault: "Standard site view",
    statusActive: "{count} accessibility adjustments active",
    options: {
      largeText: {
        label: "Larger text",
        description: "Increase font size across the site.",
      },
      highContrast: {
        label: "High contrast",
        description: "Strengthen contrast for text and interface.",
      },
      underlineLinks: {
        label: "Underline links",
        description: "Make links easier to identify.",
      },
      readableFont: {
        label: "Readable font",
        description: "Switch to a cleaner, more legible font.",
      },
      reducedMotion: {
        label: "Reduced motion",
        description: "Minimize animations and motion effects.",
      },
    },
    siteSupportTitle: "Built into this site",
    siteSupport: [
      "Keyboard-friendly navigation",
      "Clear focus indicators",
      "Multi-language and RTL support",
      "Responsive layout for mobile and desktop",
    ],
  },
  he: {
    skipLink: "דלג לתוכן הראשי",
    eyebrow: "נגישות",
    openButton: "פתח מרכז נגישות",
    closeButton: "סגור מרכז נגישות",
    title: "מרכז נגישות",
    description: "התאם את האתר להעדפות הקריאה והניווט שלך.",
    reset: "איפוס",
    statusDefault: "תצוגה רגילה של האתר",
    statusActive: "{count} התאמות נגישות פעילות",
    options: {
      largeText: {
        label: "טקסט גדול",
        description: "הגדלת הטקסט בכל האתר.",
      },
      highContrast: {
        label: "ניגודיות גבוהה",
        description: "חיזוק הניגודיות לטקסט ולממשק.",
      },
      underlineLinks: {
        label: "הדגשת קישורים",
        description: "הצגת קישורים עם קו תחתי לזיהוי מהיר יותר.",
      },
      readableFont: {
        label: "פונט קריא",
        description: "מעבר לגופן נקי וקריא יותר.",
      },
      reducedMotion: {
        label: "הפחתת תנועה",
        description: "מזעור אנימציות ואפקטים של תנועה.",
      },
    },
    siteSupportTitle: "קיים כבר באתר",
    siteSupport: [
      "ניווט נוח במקלדת",
      "סימון פוקוס ברור",
      "תמיכה בריבוי שפות וב-RTL",
      "תצוגה רספונסיבית לנייד ולמחשב",
    ],
  },
  es: {
    skipLink: "Saltar al contenido principal",
    eyebrow: "Accesibilidad",
    openButton: "Abrir centro de accesibilidad",
    closeButton: "Cerrar centro de accesibilidad",
    title: "Centro de accesibilidad",
    description: "Ajusta el sitio según tus preferencias de lectura y navegación.",
    reset: "Restablecer",
    statusDefault: "Vista estándar del sitio",
    statusActive: "{count} ajustes de accesibilidad activos",
    options: {
      largeText: {
        label: "Texto grande",
        description: "Aumenta el tamaño del texto en todo el sitio.",
      },
      highContrast: {
        label: "Alto contraste",
        description: "Refuerza el contraste del texto y la interfaz.",
      },
      underlineLinks: {
        label: "Subrayar enlaces",
        description: "Facilita la identificación de los enlaces.",
      },
      readableFont: {
        label: "Fuente legible",
        description: "Cambia a una fuente más limpia y legible.",
      },
      reducedMotion: {
        label: "Reducir movimiento",
        description: "Minimiza animaciones y efectos de movimiento.",
      },
    },
    siteSupportTitle: "Incluido en este sitio",
    siteSupport: [
      "Navegación apta para teclado",
      "Indicadores de foco claros",
      "Soporte multilingüe y RTL",
      "Diseño adaptable para móvil y escritorio",
    ],
  },
  pt: {
    skipLink: "Saltar para o conteúdo principal",
    eyebrow: "Acessibilidade",
    openButton: "Abrir centro de acessibilidade",
    closeButton: "Fechar centro de acessibilidade",
    title: "Centro de acessibilidade",
    description: "Ajuste o site às suas preferências de leitura e navegação.",
    reset: "Repor",
    statusDefault: "Vista padrão do site",
    statusActive: "{count} ajustes de acessibilidade ativos",
    options: {
      largeText: {
        label: "Texto maior",
        description: "Aumenta o tamanho do texto em todo o site.",
      },
      highContrast: {
        label: "Alto contraste",
        description: "Reforça o contraste do texto e da interface.",
      },
      underlineLinks: {
        label: "Sublinhar ligações",
        description: "Torna as ligações mais fáceis de identificar.",
      },
      readableFont: {
        label: "Tipo de letra legível",
        description: "Muda para uma fonte mais limpa e legível.",
      },
      reducedMotion: {
        label: "Reduzir movimento",
        description: "Minimiza animações e efeitos de movimento.",
      },
    },
    siteSupportTitle: "Já incluído no site",
    siteSupport: [
      "Navegação compatível com teclado",
      "Indicadores de foco claros",
      "Suporte multilingue e RTL",
      "Layout responsivo para telemóvel e computador",
    ],
  },
  pl: {
    skipLink: "Przejdź do głównej treści",
    eyebrow: "Dostępność",
    openButton: "Otwórz centrum dostępności",
    closeButton: "Zamknij centrum dostępności",
    title: "Centrum dostępności",
    description: "Dostosuj stronę do swoich preferencji czytania i nawigacji.",
    reset: "Resetuj",
    statusDefault: "Standardowy widok strony",
    statusActive: "{count} aktywnych ustawień dostępności",
    options: {
      largeText: {
        label: "Większy tekst",
        description: "Zwiększa rozmiar tekstu w całej witrynie.",
      },
      highContrast: {
        label: "Wysoki kontrast",
        description: "Wzmacnia kontrast tekstu i interfejsu.",
      },
      underlineLinks: {
        label: "Podkreśl linki",
        description: "Ułatwia rozpoznawanie linków.",
      },
      readableFont: {
        label: "Czytelna czcionka",
        description: "Przełącza na czystszą i bardziej czytelną czcionkę.",
      },
      reducedMotion: {
        label: "Mniej ruchu",
        description: "Ogranicza animacje i efekty ruchu.",
      },
    },
    siteSupportTitle: "Wbudowane w tę stronę",
    siteSupport: [
      "Nawigacja przyjazna dla klawiatury",
      "Wyraźne wskaźniki fokusu",
      "Obsługa wielu języków i RTL",
      "Responsywny układ na telefon i komputer",
    ],
  },
  ru: {
    skipLink: "Перейти к основному содержимому",
    eyebrow: "Доступность",
    openButton: "Открыть центр доступности",
    closeButton: "Закрыть центр доступности",
    title: "Центр доступности",
    description: "Настройте сайт под свои предпочтения чтения и навигации.",
    reset: "Сбросить",
    statusDefault: "Стандартный вид сайта",
    statusActive: "Активно настроек доступности: {count}",
    options: {
      largeText: {
        label: "Крупный текст",
        description: "Увеличивает размер текста на всём сайте.",
      },
      highContrast: {
        label: "Высокий контраст",
        description: "Усиливает контраст текста и интерфейса.",
      },
      underlineLinks: {
        label: "Подчеркнуть ссылки",
        description: "Помогает быстрее распознавать ссылки.",
      },
      readableFont: {
        label: "Читаемый шрифт",
        description: "Переключает сайт на более чистый и читаемый шрифт.",
      },
      reducedMotion: {
        label: "Меньше движения",
        description: "Снижает количество анимаций и эффектов движения.",
      },
    },
    siteSupportTitle: "Уже есть на сайте",
    siteSupport: [
      "Навигация, удобная для клавиатуры",
      "Чёткие индикаторы фокуса",
      "Поддержка нескольких языков и RTL",
      "Адаптивная вёрстка для телефона и компьютера",
    ],
  },
  cs: {
    skipLink: "Přeskočit na hlavní obsah",
    eyebrow: "Přístupnost",
    openButton: "Otevřít centrum přístupnosti",
    closeButton: "Zavřít centrum přístupnosti",
    title: "Centrum přístupnosti",
    description: "Přizpůsobte web svým preferencím pro čtení a navigaci.",
    reset: "Obnovit",
    statusDefault: "Standardní zobrazení webu",
    statusActive: "Aktivní úpravy přístupnosti: {count}",
    options: {
      largeText: {
        label: "Větší text",
        description: "Zvětší text na celém webu.",
      },
      highContrast: {
        label: "Vysoký kontrast",
        description: "Zvýrazní kontrast textu a rozhraní.",
      },
      underlineLinks: {
        label: "Podtrhnout odkazy",
        description: "Usnadní rozpoznání odkazů.",
      },
      readableFont: {
        label: "Čitelnější písmo",
        description: "Přepne na čistší a lépe čitelné písmo.",
      },
      reducedMotion: {
        label: "Omezit pohyb",
        description: "Omezí animace a pohybové efekty.",
      },
    },
    siteSupportTitle: "Součást tohoto webu",
    siteSupport: [
      "Navigace vhodná pro klávesnici",
      "Jasné indikátory fokusu",
      "Podpora více jazyků a RTL",
      "Responzivní rozložení pro mobil i desktop",
    ],
  },
  ar: {
    skipLink: "انتقل إلى المحتوى الرئيسي",
    eyebrow: "إمكانية الوصول",
    openButton: "افتح مركز إمكانية الوصول",
    closeButton: "أغلق مركز إمكانية الوصول",
    title: "مركز إمكانية الوصول",
    description: "اضبط الموقع بما يناسب تفضيلاتك في القراءة والتنقل.",
    reset: "إعادة ضبط",
    statusDefault: "العرض القياسي للموقع",
    statusActive: "تعديلات إمكانية الوصول النشطة: {count}",
    options: {
      largeText: {
        label: "نص أكبر",
        description: "يزيد حجم النص في جميع أجزاء الموقع.",
      },
      highContrast: {
        label: "تباين عالٍ",
        description: "يعزز تباين النص والواجهة.",
      },
      underlineLinks: {
        label: "تسطير الروابط",
        description: "يجعل الروابط أسهل في التمييز.",
      },
      readableFont: {
        label: "خط أكثر وضوحًا",
        description: "يبدل إلى خط أنظف وأسهل للقراءة.",
      },
      reducedMotion: {
        label: "تقليل الحركة",
        description: "يقلل الرسوم المتحركة وتأثيرات الحركة.",
      },
    },
    siteSupportTitle: "مضمن في هذا الموقع",
    siteSupport: [
      "تنقل مناسب للوحة المفاتيح",
      "مؤشرات تركيز واضحة",
      "دعم تعدد اللغات واتجاه RTL",
      "تصميم متجاوب للهاتف وسطح المكتب",
    ],
  },
}

let accessibilityState = { ...ACCESSIBILITY_DEFAULTS }
let accessibilityRefs = null
let accessibilityPanelOpen = false

function getAccessibilityLanguage() {
  const fallback = document.documentElement.getAttribute("lang") || "en"

  if (typeof getResolvedLanguage === "function") {
    return getResolvedLanguage(typeof currentLang === "string" ? currentLang : fallback)
  }

  return accessibilityCopy[fallback] ? fallback : "en"
}

function getAccessibilityBundle() {
  const lang = getAccessibilityLanguage()
  return accessibilityCopy[lang] || accessibilityCopy.en
}

function loadAccessibilitySettings() {
  try {
    const raw = localStorage.getItem(ACCESSIBILITY_STORAGE_KEY)
    if (!raw) return { ...ACCESSIBILITY_DEFAULTS }

    const parsed = JSON.parse(raw)
    const nextState = { ...ACCESSIBILITY_DEFAULTS }

    Object.keys(ACCESSIBILITY_DEFAULTS).forEach((key) => {
      nextState[key] = Boolean(parsed?.[key])
    })

    return nextState
  } catch (error) {
    return { ...ACCESSIBILITY_DEFAULTS }
  }
}

function saveAccessibilitySettings() {
  try {
    localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(accessibilityState))
  } catch (error) {
    // Ignore storage failures.
  }
}

function isReducedMotionRequested() {
  const root = document.documentElement

  if (root.classList.contains(ACCESSIBILITY_ROOT_CLASSES.reducedMotion)) {
    return true
  }

  try {
    return Boolean(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)
  } catch (error) {
    return false
  }
}

function dispatchAccessibilityChange() {
  document.dispatchEvent(
    new CustomEvent("site-accessibility-change", {
      detail: {
        settings: { ...accessibilityState },
      },
    })
  )
}

function updateAccessibilityToggleLabel() {
  if (!accessibilityRefs) return

  const copy = getAccessibilityBundle()
  const label = accessibilityPanelOpen ? copy.closeButton : copy.openButton

  accessibilityRefs.fab.setAttribute("aria-label", label)
  accessibilityRefs.fab.setAttribute("title", label)
  accessibilityRefs.closeButton.setAttribute("aria-label", copy.closeButton)
}

function updateAccessibilityStatus() {
  if (!accessibilityRefs) return

  const copy = getAccessibilityBundle()
  const activeCount = Object.values(accessibilityState).filter(Boolean).length

  accessibilityRefs.status.textContent = activeCount
    ? copy.statusActive.replace("{count}", activeCount)
    : copy.statusDefault
}

function updateAccessibilityOptionStates() {
  if (!accessibilityRefs) return

  accessibilityRefs.optionButtons.forEach((button) => {
    const key = button.dataset.a11ySetting
    const enabled = Boolean(accessibilityState[key])

    button.classList.toggle("is-active", enabled)
    button.setAttribute("aria-pressed", String(enabled))
  })
}

function applyAccessibilitySettings() {
  const root = document.documentElement

  Object.entries(ACCESSIBILITY_ROOT_CLASSES).forEach(([key, className]) => {
    root.classList.toggle(className, Boolean(accessibilityState[key]))
  })

  updateAccessibilityOptionStates()
  updateAccessibilityStatus()
  dispatchAccessibilityChange()
}

function updateAccessibilityCopy() {
  if (!accessibilityRefs) return

  const copy = getAccessibilityBundle()

  accessibilityRefs.skipLink.textContent = copy.skipLink
  accessibilityRefs.eyebrow.textContent = copy.eyebrow
  accessibilityRefs.title.textContent = copy.title
  accessibilityRefs.description.textContent = copy.description
  accessibilityRefs.resetButton.textContent = copy.reset
  accessibilityRefs.supportTitle.textContent = copy.siteSupportTitle

  accessibilityRefs.optionButtons.forEach((button) => {
    const key = button.dataset.a11ySetting
    const optionCopy = copy.options[key]
    if (!optionCopy) return

    const titleEl = button.querySelector(".a11y-option__title")
    const descriptionEl = button.querySelector(".a11y-option__description")

    if (titleEl) titleEl.textContent = optionCopy.label
    if (descriptionEl) descriptionEl.textContent = optionCopy.description
  })

  accessibilityRefs.supportItems.forEach((item, index) => {
    item.textContent = copy.siteSupport[index] || accessibilityCopy.en.siteSupport[index] || ""
  })

  updateAccessibilityStatus()
  updateAccessibilityToggleLabel()
}

function openAccessibilityPanel() {
  if (!accessibilityRefs || accessibilityPanelOpen) return

  accessibilityPanelOpen = true

  accessibilityRefs.fab.setAttribute("aria-expanded", "true")
  accessibilityRefs.panel.setAttribute("aria-hidden", "false")
  accessibilityRefs.backdrop.classList.add("is-visible")
  accessibilityRefs.panel.classList.add("is-open")
  document.body.classList.add("a11y-panel-open")

  updateAccessibilityToggleLabel()

  requestAnimationFrame(() => {
    accessibilityRefs.closeButton.focus()
  })
}

function closeAccessibilityPanel(restoreFocus = true) {
  if (!accessibilityRefs || !accessibilityPanelOpen) return

  accessibilityPanelOpen = false

  accessibilityRefs.fab.setAttribute("aria-expanded", "false")
  accessibilityRefs.panel.setAttribute("aria-hidden", "true")
  accessibilityRefs.backdrop.classList.remove("is-visible")
  accessibilityRefs.panel.classList.remove("is-open")
  document.body.classList.remove("a11y-panel-open")

  updateAccessibilityToggleLabel()

  if (restoreFocus) {
    accessibilityRefs.fab.focus()
  }
}

function toggleAccessibilitySetting(key) {
  if (!(key in ACCESSIBILITY_DEFAULTS)) return

  accessibilityState[key] = !accessibilityState[key]
  applyAccessibilitySettings()
  saveAccessibilitySettings()
}

function resetAccessibilitySettings() {
  accessibilityState = { ...ACCESSIBILITY_DEFAULTS }
  applyAccessibilitySettings()
  saveAccessibilitySettings()
}

function handleAccessibilityEscape(event) {
  if (event.key === "Escape") {
    closeAccessibilityPanel()
  }
}

function handleAccessibilityMotionPreferenceChange() {
  dispatchAccessibilityChange()
}

function setupAccessibilityWidget() {
  if (accessibilityRefs) return

  const fab = document.getElementById("a11y-fab")
  const panel = document.getElementById("a11y-panel")
  const backdrop = document.getElementById("a11y-backdrop")
  const closeButton = document.getElementById("a11y-close")
  const resetButton = document.getElementById("a11y-reset")
  const status = document.getElementById("a11y-status")
  const title = document.getElementById("a11y-title")
  const description = document.getElementById("a11y-description")
  const eyebrow = document.getElementById("a11y-eyebrow")
  const supportTitle = document.getElementById("a11y-support-title")
  const skipLink = document.querySelector(".skip-link")
  const optionButtons = Array.from(document.querySelectorAll(".a11y-option"))
  const supportItems = Array.from(document.querySelectorAll(".a11y-support__item"))

  if (!fab || !panel || !backdrop || !closeButton || !resetButton || !status || !title || !description || !eyebrow || !supportTitle || !skipLink || !optionButtons.length) {
    return
  }

  accessibilityRefs = {
    fab,
    panel,
    backdrop,
    closeButton,
    resetButton,
    status,
    title,
    description,
    eyebrow,
    supportTitle,
    skipLink,
    optionButtons,
    supportItems,
  }

  accessibilityState = loadAccessibilitySettings()

  fab.addEventListener("click", () => {
    if (accessibilityPanelOpen) {
      closeAccessibilityPanel()
      return
    }

    openAccessibilityPanel()
  })

  closeButton.addEventListener("click", () => closeAccessibilityPanel())
  backdrop.addEventListener("click", () => closeAccessibilityPanel())
  resetButton.addEventListener("click", () => resetAccessibilitySettings())

  optionButtons.forEach((button) => {
    button.addEventListener("click", () => toggleAccessibilitySetting(button.dataset.a11ySetting))
  })

  document.addEventListener("keydown", handleAccessibilityEscape)
  document.addEventListener("site-language-change", updateAccessibilityCopy)

  if (window.matchMedia) {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")

    if (motionQuery.addEventListener) {
      motionQuery.addEventListener("change", handleAccessibilityMotionPreferenceChange)
    } else if (motionQuery.addListener) {
      motionQuery.addListener(handleAccessibilityMotionPreferenceChange)
    }
  }

  updateAccessibilityCopy()
  applyAccessibilitySettings()
}
