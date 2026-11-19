// The History master switch at the top of the History tab: whether the gate
// records new History at all. It reads and writes the gate itself
// (ADMIN_GET/SET_HISTORY_CONFIG, feature HISTORY_SWITCH, firmware 11.26.29+)
// over the encrypted Manager channel; nothing is stored in the cloud. The
// checkbox shows only what the gate acknowledged. Turning History off asks
// first; a CONFLICT (an administrator changed it in the app) reloads.
const el = (tag, text, cls) => {
  const n = document.createElement(tag);
  if (text !== undefined) n.textContent = text;
  if (cls) n.className = cls;
  return n;
};

export function validManagerHistoryConfig(value) {
  return typeof value?.config?.enabled === "boolean" &&
    Number.isInteger(value?.revision) && value.revision > 0;
}

export async function renderManagerHistorySwitch({ root, connection, language = "en", confirm, isCurrent, errorText }) {
  const t = (he, en) => (language === "he" ? he : en);
  if (!connection.capabilities?.data?.features?.includes("HISTORY_SWITCH")) return null;
  const card = el("section", undefined, "manager-history-switch manager-settings-card");
  const label = el("label", undefined, "manager-control-switch");
  const input = el("input");
  input.type = "checkbox";
  input.disabled = true;
  const text = el("span", t("שמירת היסטוריה", "Keep history"));
  label.append(input, text);
  const hint = el("p", "", "manager-supporting-copy");
  const status = el("p", "", "manager-note");
  status.setAttribute("role", "status");
  status.hidden = true;
  card.append(label, hint, status);
  root.append(card);

  let config = null, busy = false;
  const alive = () => isCurrent() && card.isConnected;
  const show = () => {
    const enabled = config?.config.enabled === true;
    input.checked = enabled;
    input.disabled = busy || !config;
    card.dataset.historyEnabled = config ? String(enabled) : "";
    hint.textContent = !config ? "" : enabled
      ? t("השער רושם כל פתיחה, סגירה ופעולה.", "The gate records every opening, closing and action.")
      : t("ההיסטוריה כבויה. השער לא רושם פעולות חדשות עד שתפעילו אותה שוב. ההיסטוריה הקיימת נשמרת.",
        "History is off. The gate records no new activity until you turn it back on. Existing history is kept.");
  };
  const fail = (error) => {
    if (!alive()) return;
    status.hidden = false;
    status.textContent = errorText(error);
    status.setAttribute("role", "alert");
  };
  const load = async () => {
    const reply = await connection.command("ADMIN_GET_HISTORY_CONFIG", {});
    if (!alive()) return;
    if (!validManagerHistoryConfig(reply?.data)) throw new Error("INVALID_RESPONSE");
    config = reply.data;
  };
  input.addEventListener("change", async () => {
    const next = input.checked;
    input.checked = !next; // only the gate's ACK moves the switch
    if (busy || !config || !alive()) return;
    busy = true;
    status.hidden = true;
    show();
    try {
      if (!next && !(await confirm(t(
        "לכבות את ההיסטוריה? השער יפסיק לרשום פתיחות ופעולות חדשות. ההיסטוריה הקיימת תישאר, ואפשר להפעיל אותה שוב בכל עת.",
        "Turn off history? The gate will stop recording openings and actions. Existing history stays, and you can turn it back on at any time.",
      )))) return;
      if (!alive()) return;
      try {
        const reply = await connection.command("ADMIN_SET_HISTORY_CONFIG", { enabled: next, expectedRevision: config.revision });
        if (!alive()) return;
        if (!validManagerHistoryConfig(reply?.data)) throw new Error("INVALID_RESPONSE");
        config = reply.data;
      } catch (error) {
        fail(error);
        if (error?.code === "CONFLICT" || error?.message === "CONFLICT") await load().catch(fail);
      }
    } finally {
      busy = false;
      if (alive()) show();
    }
  });
  try {
    await load();
  } catch (error) {
    fail(error);
  }
  if (alive()) show();
  return card;
}
