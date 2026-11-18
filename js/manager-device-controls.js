import { managerFeatureArt } from "./manager-art.js";
import qrcode from "./vendor/qrcode-generator.js";
import { prepareManagerFirmware } from "./manager-firmware-package.js";
import { managerRfDetails } from "./manager-device-details.js";

const el = (tag, text, cls) => {
  const n = document.createElement(tag);
  if (text !== undefined) n.textContent = text;
  if (cls) n.className = cls;
  return n;
};
const definitions = {
  override: {
    feature: "GATE_OVERRIDE",
    read: "ADMIN_GET_GATE_OVERRIDE",
    title: ["עקיפת מצב השער", "Gate override"],
  },
  wiring: {
    feature: "RELAY_WIRING",
    read: "ADMIN_GET_RELAY_WIRING",
    title: ["החלפת חיווט", "Swap wiring"],
  },
  sensor: {
    feature: "SENSORS",
    read: "ADMIN_GET_SENSOR_CONFIG",
    title: ["חיישן", "Sensor"],
  },
  rf: {
    feature: "RF_LEARN",
    read: "ADMIN_RF_GET",
    title: ["לימוד שלט", "Remote learning"],
  },
  firmware: {
    feature: "FOTA",
    read: "ADMIN_FOTA_GET_STATUS",
    title: ["עדכון קושחה", "Firmware update"],
  },
  reset: {
    feature: "MANAGER_FACTORY_RESET",
    title: ["איפוס להגדרות יצרן", "Factory reset"],
  },
  qr: {
    feature: "MANAGER_QR_LABEL",
    title: ["מדבקת QR Code", "QR Code label"],
  },
};

export async function renderManagerDeviceControls({
  root,
  kind,
  connection,
  language = "en",
  confirm,
  ensureRecent,
  isCurrent,
  errorText,
  onRefresh,
  onFirmwareUpdate,
  onFactoryReset,
}) {
  const t = (he, en) => (language === "he" ? he : en),
    spec = definitions[kind];
  let disposed = false,
    timer,
    operation,
    labelTimer,
    labelImage;
  const alive = () => !disposed && isCurrent() && Boolean(connection.session);
  const panel = el(
    "section",
    undefined,
    "manager-device-controls manager-settings-card",
  );
  panel.append(managerFeatureArt(kind), el("h3", t(...spec.title)));
  const state = el("p", "", "manager-supporting-copy");
  state.setAttribute("role", "status");
  panel.append(state);
  root.append(panel);
  const clearLabel = () => {
    clearTimeout(labelTimer);
    labelImage?.replaceChildren();
  };
  const visibility = () => {
    if (document.hidden) clearLabel();
  };
  const dispose = () => {
    disposed = true;
    clearTimeout(timer);
    clearLabel();
    document.removeEventListener("visibilitychange", visibility);
  };
  const message = (error) => {
    if (alive()) {
      state.textContent = errorText(error);
      state.setAttribute("role", "alert");
    }
  };
  const button = (text, action, primary = false) => {
    const b = el(
      "button",
      text,
      "manager-button" + (primary ? " primary" : ""),
    );
    b.type = "button";
    b.addEventListener("click", async () => {
      if (!alive() || b.disabled) return;
      b.disabled = true;
      try {
        await action();
      } catch (error) {
        message(error);
      } finally {
        b.disabled = false;
      }
    });
    panel.append(b);
    return b;
  };
  if (!connection.capabilities?.data?.features?.includes(spec.feature)) {
    state.textContent = t(
      "הקושחה במערכת זו עדיין אינה תומכת בפעולה הזו דרך Manager.",
      "This system's firmware does not yet support this action through Manager.",
    );
    return { dispose };
  }
  const data = spec.read ? (await connection.command(spec.read)).data : null;
  if (!alive()) return { dispose };
  const save = async (command, payload, question) => {
    if (!Number.isInteger(data?.revision)) throw new Error("INVALID_RESPONSE");
    if (!(await confirm(question)) || !alive()) return;
    await connection.command(command, {
      ...payload,
      expectedRevision: data.revision,
    });
    if (alive()) await onRefresh();
  };
  if (kind === "override") {
    panel.append(
      el(
        "p",
        t(
          "בחרו מצב רגיל או מצב קבוע שגובר על לוח האירועים והפתיחה הרגילה.",
          "Choose normal operation or a fixed mode that overrides scheduled events and normal opening.",
        ),
      ),
    );
    const label = el("label", t("מצב השער", "Gate mode")),
      select = el("select");
    for (const [value, name] of [
      ["NORMAL", t("רגיל", "Normal")],
      ["FORCE_NO", t("פתוח קבוע", "Held open")],
      ["FORCE_NC", t("סגור קבוע", "Held closed")],
    ]) {
      const option = el("option", name);
      option.value = value;
      select.append(option);
    }
    select.value = data.override?.mode;
    label.append(select);
    panel.append(label);
    button(
      t("שמירת מצב השער", "Save gate mode"),
      () =>
        save(
          "ADMIN_SET_GATE_OVERRIDE",
          { mode: select.value },
          t("לשנות את המצב הקבוע של השער?", "Change the gate override?"),
        ),
      true,
    );
  } else if (kind === "wiring" || kind === "sensor") {
    const wiring = kind === "wiring",
      label = el("label", undefined, "manager-control-switch"),
      input = el("input");
    input.type = "checkbox";
    input.checked = wiring
      ? Boolean(data.config?.swapWiring)
      : Boolean(data.config?.enabled);
    label.append(
      input,
      el(
        "span",
        wiring
          ? t(
              "החלפת מגעי NO/NC לכל פעולות השער",
              "Swap NO/NC for all gate operations",
            )
          : t("הפעלת חיישן", "Enable sensor"),
      ),
    );
    panel.append(label);
    button(
      t("שמירת הגדרות", "Save settings"),
      () =>
        save(
          wiring ? "ADMIN_SET_RELAY_WIRING" : "ADMIN_SET_SENSOR_CONFIG",
          wiring ? { swapWiring: input.checked } : { enabled: input.checked },
          t("לשמור את ההגדרה במערכת?", "Save this setting on the system?"),
        ),
      true,
    );
    if (wiring && data.legacyEventSwap) {
      panel.append(
        el(
          "p",
          t(
            "במערכת פעילה גם הגדרת החלפת מגעים ישנה לאירועים בלבד.",
            "A legacy events-only contact swap is also active on this system.",
          ),
        ),
      );
      button(
        t("ביטול ההגדרה הישנה לאירועים", "Remove legacy events-only swap"),
        async () => {
          const events = (await connection.command("ADMIN_LIST_EVENTS")).data;
          if (
            !alive() ||
            !(await confirm(
              t(
                "לבטל את החלפת המגעים הישנה של האירועים?",
                "Remove the legacy event contact swap?",
              ),
            )) ||
            !alive()
          )
            return;
          await connection.command("ADMIN_SET_EVENT_OPTIONS", {
            swapContacts: false,
            expectedRevision: events.revision,
          });
          if (alive()) await onRefresh();
        },
      );
    }
  } else if (kind === "rf") {
    state.textContent = t(
      "לחצו על התחלת לימוד, ואז לחצו על השלט ליד הבקר. קוד שנקלט יישמר רק לאחר אישורכם.",
      "Start learning, then press the remote near the controller. A detected code is saved only after your confirmation.",
    );
    const remote = managerRfDetails(data);
    const saved = el(
      "p",
      remote.present === false
        ? t("לא נשמר שלט במערכת.", "No remote saved on this system.")
        : t("שלט שמור במערכת: ", "Stored remote: ") +
            (remote.code || t("לא זמין", "Unavailable")),
    );
    panel.append(saved);
    const saveCode = button(
      t("שמירת השלט שנקלט", "Save detected remote"),
      async () => {
        if (
          !operation ||
          !(await confirm(
            t("לשמור את השלט שנקלט?", "Save the detected remote?"),
          )) ||
          !alive()
        )
          return;
        await connection.command("ADMIN_RF_LEARN_SAVE", {
          operationId: operation,
          expectedRevision: data.revision,
        });
        operation = undefined;
        if (alive()) await onRefresh();
      },
      true,
    );
    saveCode.hidden = true;
    const cancel = button(t("ביטול לימוד", "Cancel learning"), async () => {
      if (operation)
        await connection.command("ADMIN_RF_LEARN_CANCEL", {
          operationId: operation,
        });
      operation = undefined;
      clearTimeout(timer);
      if (alive()) await onRefresh();
    });
    cancel.hidden = true;
    const poll = async () => {
      if (!alive() || !operation) return;
      try {
        const status = (
          await connection.command("ADMIN_RF_LEARN_STATUS", {
            operationId: operation,
          })
        ).data;
        if (!alive()) return;
        saveCode.hidden = status.state !== "DETECTED";
        state.textContent =
          status.state === "DETECTED"
            ? t(
                "נקלט שלט. אפשר לשמור או לבטל.",
                "A remote was detected. Save or cancel.",
              )
            : status.state === "LEARNING"
              ? t("ממתינים ללחיצה על השלט…", "Waiting for the remote button…")
              : t("הלימוד הסתיים ללא שמירה.", "Learning ended without saving.");
        if (status.state === "IDLE") {
          operation = undefined;
          cancel.hidden = true;
        }
        if (status.state === "LEARNING") timer = setTimeout(poll, 1000);
      } catch (error) {
        message(error);
      }
    };
    button(t("התחלת לימוד שלט", "Start remote learning"), async () => {
      if (operation) return;
      const started = (await connection.command("ADMIN_RF_LEARN_START")).data;
      operation = started.operationId;
      cancel.hidden = false;
      await poll();
    });
    if (data.rfCode?.present)
      button(t("מחיקת השלט השמור", "Remove stored remote"), () =>
        save(
          "ADMIN_RF_RESET",
          { confirmation: "reset_rf" },
          t("למחוק את השלט השמור במערכת?", "Remove the stored remote?"),
        ),
      );
  } else if (kind === "qr") {
    panel.append(
      el(
        "p",
        t(
          "המדבקה מאפשרת רישום מנהל במערכת. הציגו אותה רק למי שמורשה לקבל גישת ניהול.",
          "The label allows administrator enrollment. Show it only to someone authorized for administration.",
        ),
      ),
    );
    const image = el("div", undefined, "manager-qr-label");
    labelImage = image;
    panel.append(image);
    document.addEventListener("visibilitychange", visibility);
    button(
      t("הצגת מדבקת QR Code", "Show QR Code label"),
      async () => {
        clearLabel();
        await ensureRecent({ maxAgeSeconds: 240 });
        if (!alive()) return;
        const result = (
          await connection.command("ADMIN_GET_QR_PAYLOAD", {
            purpose: "DISPLAY",
          })
        ).data;
        if (!alive()) return;
        if (
          result?.sensitive !== true ||
          !result.payload ||
          Array.isArray(result.payload) ||
          typeof result.payload !== "object" ||
          JSON.stringify(result.payload).length > 2048
        )
          throw new Error("INVALID_RESPONSE");
        const qr = qrcode(0, "M");
        qr.addData(JSON.stringify(result.payload));
        qr.make();
        image.replaceChildren(
          new DOMParser().parseFromString(
            qr.createSvgTag({ scalable: true, cellSize: 4, margin: 16 }),
            "image/svg+xml",
          ).documentElement,
        );
        image.append(
          el("strong", String(result.payload.n || result.payload.i || "")),
        );
        labelTimer = setTimeout(clearLabel, 120000);
      },
      true,
    );
    button(t("הסתרת המדבקה", "Hide label"), clearLabel);
  } else if (kind === "reset") {
    panel.append(
      el(
        "p",
        t(
          "האיפוס מוחק את רשתות ה־Wi-Fi השמורות בבקר, את כל המנהלים והמשתמשים, מפתחות הגישה, ההיסטוריה וההגדרות, ואת הרשאת החיבור ל־WIFIGATE Manager. החיבור הנוכחי יסתיים ולא ניתן יהיה להתחבר מחדש מרחוק. כדי לחבר שוב: יש לרשום מנהל, לייצא ל־Manager ולהגדיר Wi-Fi מחדש באפליקציה ליד הבקר. הפעולה אינה ניתנת לביטול ודורשת קוד מאפליקציית המאמת.",
          "Reset erases the controller's saved Wi-Fi networks, all administrators and users, access keys, history, settings and WIFIGATE Manager authorization. The current connection will end and remote reconnection will be unavailable. To reconnect, enroll an administrator, export to Manager and set up Wi-Fi again in the app near the controller. This cannot be undone and requires an authenticator-app code.",
        ),
      ),
    );
    const resetButton = button(t("איפוס להגדרות יצרן", "Factory reset"), async () => {
      await ensureRecent({ maxAgeSeconds: 240, force: true, requireTotp: true });
      if (!alive()) return;
      const prepared = (await connection.command("ADMIN_FACTORY_RESET_PREPARE"))
        .data;
      if (typeof prepared?.challenge !== "string" || !prepared.challenge)
        throw new Error("INVALID_RESPONSE");
      if (
        !alive() ||
        !(await confirm(
          t(
            "למחוק לצמיתות את רשתות ה־Wi-Fi, כל המנהלים והמשתמשים, מפתחות הגישה, ההיסטוריה וההגדרות, ואת גישת Manager? החיבור יסתיים, ולא ניתן יהיה להתחבר מרחוק עד לרישום מנהל והגדרת Wi-Fi מחדש ליד הבקר. הפעולה אינה ניתנת לביטול.",
            "Permanently erase Wi-Fi networks, all administrators and users, access keys, history, settings and Manager access? This connection will end; remote access requires local administrator enrollment and Wi-Fi setup again. This cannot be undone.",
          ),
          { danger: true, confirmLabel: t("איפוס ומחיקת נתוני המערכת", "Reset and erase system data") },
        )) ||
        !alive()
      )
        return;
      try {
        const committed = await connection.command("ADMIN_FACTORY_RESET_COMMIT", {
          challenge: prepared.challenge,
          confirmation: "factory_reset",
        });
        if (committed?.data?.accepted !== true) throw new Error("INVALID_RESET_RESPONSE");
      } catch (error) {
        // An explicit controller refusal is safe to display. A missing/invalid
        // response is uncertain: do not replay a destructive command.
        if (!error.firmwareRefusal) await onFactoryReset?.({ acknowledged: false });
        throw error;
      }
      state.textContent = t(
        "בקשת האיפוס אושרה על ידי המערכת. נדרש רישום מחדש ליד הבקר.",
        "The system accepted reset. Local enrollment is required again.",
      );
      await onFactoryReset?.({ acknowledged: true });
    });
    resetButton.classList.add("danger", "manager-reset-button");
  } else if (kind === "firmware") {
    state.textContent =
      t("גרסת קושחה נוכחית: ", "Current firmware: ") +
      String(data.firmwareVersion || "—");
    panel.append(
      el(
        "p",
        t(
          "בחרו את manifest.json ואת עשרת הקבצים המוצפנים מתוך חבילת העדכון של WIFIGATE. הבקר מאמת את החבילה לפני התקנתה.",
          "Select manifest.json and the ten encrypted files from a WIFIGATE update package. The controller authenticates the package before installation.",
        ),
      ),
    );
    const label = el(
        "label",
        t("חבילת עדכון קושחה", "Firmware update package"),
      ),
      input = el("input");
    input.type = "file";
    input.multiple = true;
    label.append(input);
    panel.append(label);
    const progress = el("progress");
    progress.max = 1;
    progress.value = 0;
    progress.hidden = true;
    progress.setAttribute(
      "aria-label",
      t("התקדמות עדכון קושחה", "Firmware update progress"),
    );
    panel.append(progress);
    if (onFirmwareUpdate)
      button(
        t("עדכון קושחה", "Update firmware"),
        async () => {
          const files = [...input.files];
          if (
            files.length !== 11 ||
            files.reduce((sum, file) => sum + file.size, 0) >
              3 * 1024 * 1024 + 32768
          )
            throw new Error("INVALID_FIRMWARE_PACKAGE");
          const manifestFile = files.find(
            (file) => file.name === "manifest.json",
          );
          if (!manifestFile || manifestFile.size > 32768)
            throw new Error("INVALID_FIRMWARE_PACKAGE");
          const manifest = JSON.parse(await manifestFile.text()),
            chunks = new Map();
          for (const file of files) {
            if (file === manifestFile) continue;
            if (chunks.has(file.name))
              throw new Error("INVALID_FIRMWARE_PACKAGE");
            chunks.set(file.name, new Uint8Array(await file.arrayBuffer()));
          }
          const prepared = await prepareManagerFirmware(manifest, chunks, data);
          try {
            if (manifest.releaseCounter <= (data.releaseCounter ?? 0))
              throw new Error("FIRMWARE_NOT_NEWER");
            if (!alive()) return;
            await ensureRecent({ maxAgeSeconds: 240 });
            if (
              !alive() ||
              !(await confirm(
                t(
                  `להתקין את ${manifest.version}? המערכת תאתחל לאחר אימות העדכון.`,
                  `Install ${manifest.version}? The system restarts after verifying the update.`,
                ),
              )) ||
              !alive()
            )
              return;
            progress.hidden = false;
            input.disabled = true;
            state.textContent = t(
              "מעבירים ומאמתים את העדכון…",
              "Transferring and verifying the update…",
            );
            await onFirmwareUpdate(prepared, (received, total) => {
              if (alive()) progress.value = received / total;
            });
          } finally {
            prepared.bytes.fill(0);
            if (alive()) input.disabled = false;
          }
        },
        true,
      );
  }
  return { dispose };
}
