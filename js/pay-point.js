import { getPayPoint } from "./api/index.js";
import { payMoney } from "./pay-dashboard.js";

const language = new URLSearchParams(location.search).get("lang") === "he" ? "he" : "en";
const t = (he, en) => language === "he" ? he : en;
document.documentElement.lang = language;
document.documentElement.dir = language === "he" ? "rtl" : "ltr";
document.title = t("תצוגת נקודת תשלום | WIFIGATE", "Payment point preview | WIFIGATE");
const root = document.querySelector("#pay-point");
const text = (tag, value, cls) => {
  const node = document.createElement(tag); node.textContent = value;
  if (cls) node.className = cls;
  return node;
};
const footer = document.querySelector(".pay-public-footer");
footer.textContent = t("WIFIGATE Pay · תצוגה מקדימה בלבד", "WIFIGATE Pay · Preview only");
let generation = 0;
async function load() {
  const guard = ++generation;
  root.replaceChildren(); root.setAttribute("aria-busy", "true");
  root.append(text("h1", t("טוענים את פרטי הנקודה", "Loading point details")), text("p", t("רק עוד רגע…", "One moment…")));
  const id = new URLSearchParams(location.search).get("id");
  try {
    if (!/^[a-f0-9]{64}$/.test(id || "")) throw Object.assign(new Error("invalid-point"), { status: 404 });
    const result = await getPayPoint(id);
    if (guard !== generation) return;
    const point = result.point;
    if (point?.id !== id || result.paymentsEnabled !== false || point.paymentsEnabled !== false || point.canPay !== false || point.status !== "preview_only") throw new Error("invalid-response");
    root.replaceChildren();
    root.className = "pay-customer-preview";
    root.append(text("span", "WIFIGATE PAY", "pay-eyebrow"), text("span", t("תצוגה מקדימה", "Preview"), "pay-pill"), text("h1", point.displayName || "WIFIGATE Pay"));
    if (point.description) root.append(text("p", point.description));
    root.append(text("strong", payMoney(point.accessMode === "metered" ? point.hourlyRateMinor : point.priceMinor, point.currency, language), "pay-preview-price"));
    root.append(text("p", point.accessMode === "metered" ? t("תעריף מתוכנן לשעה", "Planned hourly tariff") : point.accessMode === "timed" ? t(`חלון גישה מתוכנן: ${point.windowMin} דקות`, `Planned access window: ${point.windowMin} minutes`) : t("תעריף מתוכנן לכניסה בודדת", "Planned single entry tariff"), "pay-muted"));
    root.append(text("div", t("התשלום אינו פעיל כרגע", "Payments are not active"), "pay-unavailable"), text("small", t("זוהי תצוגה בלבד. לא ניתן לשלם או לפתוח את המערכת מהעמוד הזה.", "This is a preview. Payments and system opening are not available on this page.")));
  } catch (error) {
    if (guard !== generation) return;
    root.className = "pay-panel"; root.replaceChildren();
    root.append(text("h1", error?.status === 404 ? t("הנקודה אינה זמינה", "Point unavailable") : t("לא הצלחנו לטעון את הנקודה", "Unable to load this point")), text("p", error?.status === 404 ? t("בדקו שהקישור נכון ופנו לבעל המקום במידת הצורך.", "Check the link and contact the location operator if needed.") : t("בדקו את החיבור לאינטרנט ונסו שוב.", "Check your internet connection and try again.")));
    if (error?.status !== 404) {
      const retry = text("button", t("ניסיון נוסף", "Try again"), "pay-button"); retry.type = "button"; retry.addEventListener("click", () => void load()); root.append(retry);
    }
  } finally { if (guard === generation) root.removeAttribute("aria-busy"); }
}
void load();
