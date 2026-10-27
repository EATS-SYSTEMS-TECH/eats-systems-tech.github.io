import {
  managerCsvHeader,
  managerCsvExampleRows,
  managerCsvTemplate,
  validateManagerCsvImport,
} from "./manager-csv.js";

let nextDialogId = 0;
const maximumBytes = 4 * 1024 * 1024;

// This modal only stages rows. onImport must use the existing authenticated
// importCollection transaction and await confirmCommit before its COMMIT.
export function createManagerCsvDialog({
  language = "en",
  host = document.body,
  errorText,
} = {}) {
  const he = language === "he";
  const t = (h, e) => (he ? h : e);
  let active;
  const element = (tag, text, className) => {
    const item = document.createElement(tag);
    if (text !== undefined) item.textContent = text;
    if (className) item.className = className;
    return item;
  };
  function installStyles() {
    if (document.getElementById("manager-csv-dialog-styles")) return;
    const style = element("style");
    style.id = "manager-csv-dialog-styles";
    style.textContent = `
.manager-csv-dialog { width:min(740px,calc(100vw - 24px)); max-height:calc(100dvh - 32px); padding:0; overflow:auto; color:#182d48; background:#fff; border:1px solid #dfe7f1; border-radius:22px; box-shadow:0 28px 90px #142b4940; font:inherit; box-sizing:border-box; }
.manager-csv-dialog::backdrop { background:#10243d99; backdrop-filter:blur(5px); }
.manager-csv-dialog *, .manager-csv-dialog *::before, .manager-csv-dialog *::after { box-sizing:border-box; }
.manager-csv-dialog [hidden] { display:none !important; }
.manager-csv-dialog .manager-csv-body { display:grid; gap:18px; padding:28px; min-width:0; }
.manager-csv-dialog h2 { margin:0; font-size:1.45rem; color:#182d48; }
.manager-csv-dialog h3 { margin:0 0 10px; font-size:1rem; }
.manager-csv-dialog p { margin:0; line-height:1.65; color:#52647b; overflow-wrap:anywhere; }
.manager-csv-dialog .manager-csv-eyebrow { display:inline-block; width:fit-content; padding:5px 10px; border-radius:8px; background:#fff0e5; color:#923b16; font-size:.78rem; font-weight:800; }
.manager-csv-dialog .manager-csv-card { padding:16px; border:1px solid #dfe7f1; border-radius:14px; min-width:0; background:#f8fafc; }
.manager-csv-dialog pre { margin:10px 0; padding:14px; max-width:100%; overflow:auto; direction:ltr; text-align:left; border:1px solid #dce5ef; border-radius:10px; background:#fff; color:#182d48; font:12px/1.75 ui-monospace,monospace; }
.manager-csv-dialog .manager-csv-guide { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px 18px; margin:12px 0 0; }
.manager-csv-dialog .manager-csv-guide > div { min-width:0; }
.manager-csv-dialog dt { font-size:.8rem; font-weight:800; }
.manager-csv-dialog dd { margin:2px 0 0; font-size:.78rem; line-height:1.5; color:#52647b; }
.manager-csv-dialog .manager-csv-controls { display:grid; grid-template-columns:minmax(0,1.25fr) minmax(0,1fr); gap:14px; }
.manager-csv-dialog label { display:grid; gap:7px; min-width:0; font-size:.88rem; font-weight:700; }
.manager-csv-dialog :is(input,select) { max-width:100%; min-width:0; min-height:44px; padding:10px; border:1px solid #cdd8e6; border-radius:10px; color:#182d48; background:#fff; font:inherit; }
.manager-csv-dialog input[type=file] { width:100%; font-size:.78rem; }
.manager-csv-dialog .manager-csv-actions { display:flex; flex-wrap:wrap; justify-content:flex-end; gap:10px; padding-top:4px; }
.manager-csv-dialog .manager-button { min-height:44px; padding:10px 16px; border:1px solid #d7e1ed; border-radius:10px; font:inherit; font-weight:700; color:#182d48; background:#fff; cursor:pointer; }
.manager-csv-dialog .manager-button.primary { background:#a53d11; border-color:#a53d11; color:#fff; }
.manager-csv-dialog .manager-button:hover:not(:disabled) { background:#080808; border-color:#080808; color:#fff; }
.manager-csv-dialog .manager-button:disabled { opacity:.55; cursor:default; }
.manager-csv-dialog :is(button,input,select):focus-visible { outline:3px solid #dd7d27; outline-offset:3px; }
.manager-csv-dialog .manager-csv-warning { padding:12px 14px; border:1px solid #f3cfb0; border-radius:10px; background:#fff7ec; color:#8c3e16; font-size:.85rem; }
.manager-csv-dialog .manager-csv-error { padding:12px 14px; border:1px solid #f2c2c2; border-radius:10px; background:#fff2f2; color:#a12222; font-size:.88rem; }
.manager-csv-dialog .manager-csv-table-wrap { max-width:100%; overflow:auto; border:1px solid #dfe7f1; border-radius:10px; margin-top:10px; }
.manager-csv-dialog table { border-collapse:collapse; width:100%; font-size:.8rem; text-align:start; background:#fff; }
.manager-csv-dialog :is(th,td) { padding:10px; border-bottom:1px solid #e8edf4; overflow-wrap:anywhere; vertical-align:top; text-align:start; }
.manager-csv-dialog th { background:#f1f5fa; font-size:.75rem; }
.manager-csv-dialog .manager-csv-progress { display:grid; gap:10px; }
.manager-csv-dialog progress { display:block; width:100%; height:12px; accent-color:#a53d11; }
.manager-csv-dialog .manager-csv-success { padding:16px; background:#eff9f2; border:1px solid #bbdec7; border-radius:14px; color:#176238; }
@media (max-width:520px) { .manager-csv-dialog .manager-csv-body { padding:20px; gap:16px; } .manager-csv-dialog .manager-csv-controls { grid-template-columns:1fr; } .manager-csv-dialog .manager-csv-actions > button { flex:1; } .manager-csv-dialog .manager-csv-guide { column-gap:10px; } }
`;
    document.head.append(style);
  }
  function describeError(error) {
    const code = error?.code ?? error?.message;
    const messages = {
      INVALID_CSV: t(
        "הקובץ אינו תקין. בדקו את סדר הכותרות, שם עד 20 תווים, כתובת אימייל, מספר טלפון ושדות מספריים ללא ערכים שליליים.",
        "The CSV is invalid. Check the header order, names up to 20 characters, email addresses, phone numbers and nonnegative numeric fields.",
      ),
      DUPLICATE_PHONE: t("אותו מספר טלפון מופיע בקובץ יותר מפעם אחת. השאירו רשומה אחת לכל מספר.", "A phone number appears more than once. Keep one row per phone number."),
      CSV_CAPACITY_EXCEEDED: t("מספר הרשומות בקובץ גדול מקיבולת המערכת לקבוצה הזו.", "The file contains more records than this collection allows."),
      CSV_FILE_TOO_LARGE: t("הקובץ גדול מדי. הגודל המרבי הוא 4 MB.", "The file is too large. The maximum size is 4 MB."),
      IMPORT_REJECTED: t("המערכת לא אישרה את הייבוא. בדקו קיבולת, נתוני משתמשים והרשאות. הרשומות לא נשמרו.", "The system rejected the import. Check capacity, user details and permissions. The records were not saved."),
      EXAMPLE_DELEGATION_ADMIN: t("יש להשאיר את מנהל ההרשאות ברשימת המנהלים. ניתן לבחור במיזוג כדי לשמור את הרשומות הקיימות.", "The delegated administrator must remain in the administrator list. Choose Merge to preserve existing records."),
      CONFLICT: t("הנתונים במערכת השתנו או שהייבוא מסיר את המנהל הפעיל. רעננו את הרשימה ונסו שוב.", "The system data changed, or the import removes the active administrator. Refresh the list and try again."),
      CANCELLED: t("הייבוא בוטל לפני שמירה.", "Import cancelled before saving."),
    };
    const message = messages[code] ?? errorText?.(error) ?? t(
      "לא ניתן להשלים את הייבוא. בדקו שהמערכת מחוברת ונסו שוב.",
      "The import could not be completed. Check the system connection and try again.",
    );
    return Number.isInteger(error?.row)
      ? t(`שורה ${error.row}: ${message}`, `Row ${error.row}: ${message}`)
      : message;
  }
  function cancel() {
    active?.cancel();
  }
  function open({ collection, capacity, systemName = "", onImport }) {
    if (!["USERS", "ADMINS"].includes(collection) || typeof onImport !== "function")
      throw new Error("INVALID_IMPORT");
    if (capacity !== undefined && (!Number.isInteger(capacity) || capacity < 1 || capacity > (collection === "ADMINS" ? 20 : 5000)))
      throw new Error("INVALID_CAPABILITIES");
    cancel();
    installStyles();
    return new Promise((resolve) => {
      const previous = document.activeElement;
      const id = `manager-csv-${++nextDialogId}`;
      const dialog = element("dialog", undefined, "manager-csv-dialog");
      dialog.dir = he ? "rtl" : "ltr";
      dialog.setAttribute("aria-labelledby", `${id}-title`);
      dialog.setAttribute("aria-describedby", `${id}-description`);
      const body = element("div", undefined, "manager-csv-body");
      const title = element("h2", collection === "USERS" ? t("ייבוא משתמשים מקובץ CSV", "Import users from CSV") : t("ייבוא מנהלים מקובץ CSV", "Import administrators from CSV"));
      title.id = `${id}-title`;
      const description = element("p", t("בחרו קובץ, בדקו את התצוגה המקדימה ואשרו שמירה רק לאחר אימות במערכת.", "Choose a file, review the preview and confirm saving after the system validates it."));
      description.id = `${id}-description`;
      body.append(element("span", systemName || "WIFIGATE Manager", "manager-csv-eyebrow"), title, description);

      const format = element("section", undefined, "manager-csv-card");
      format.setAttribute("aria-label", t("דוגמה לפורמט CSV", "CSV format example"));
      format.append(element("h3", t("כך הקובץ צריך להיראות", "Your CSV should look like this")));
      const example = [managerCsvHeader.join(","), ...managerCsvExampleRows.map((row) => [2, 3, 0, 1, 4, 5, 6].map((index) => row[index]).join(","))].join("\n");
      const code = element("pre");
      code.append(element("code", example));
      format.append(code, element("p", t("קובץ UTF-8, מופרד בפסיקים, עם שורת הכותרת בדיוק בסדר המוצג. זו דוגמה בלבד; החליפו את הפרטים לפני הייבוא.", "Use a comma-separated UTF-8 file with the header in the order shown. These are sample details; replace them before importing.")));
      const guide = element("dl", undefined, "manager-csv-guide");
      const help = [
        ["Name", t("שם, עד 20 תווים", "Name, up to 20 characters")],
        ["Email", t("כתובת אימייל תקינה", "A valid email address")],
        ["Country", t("קידומת מדינה, למשל 972, ללא +", "Country code, e.g. 972, without +")],
        ["Local", t("מספר מקומי ללא קידומת מדינה. אפס מוביל אחד יוסר.", "Local phone without country code. One leading zero is removed.")],
        ["Floor / Apt", t("מספר שלם בין 0 ל־65535; 0 אם אין", "Whole number from 0 to 65535; use 0 when unused")],
        ["Parking", t("מספר שלם בין 0 ל־4294967295; 0 אם אין", "Whole number from 0 to 4294967295; use 0 when unused")],
      ];
      for (const [name, value] of help) {
        const group = element("div");
        group.append(element("dt", name), element("dd", value));
        guide.append(group);
      }
      const template = element("button", t("הורדת קובץ לדוגמה", "Download example CSV"), "manager-button");
      template.type = "button";
      template.addEventListener("click", () => {
        const url = URL.createObjectURL(new Blob([managerCsvTemplate()], { type: "text/csv;charset=utf-8" }));
        const link = element("a");
        link.href = url;
        link.download = `WIFIGATE-${collection.toLowerCase()}-example.csv`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      });
      format.append(guide, template);
      const controls = element("div", undefined, "manager-csv-controls");
      const fileLabel = element("label", t("בחירת קובץ CSV", "Choose CSV file"));
      const upload = element("input");
      upload.type = "file";
      upload.accept = ".csv,text/csv";
      fileLabel.append(upload);
      const modeLabel = element("label", t("אופן ייבוא", "Import mode"));
      const mode = element("select");
      mode.append(new Option(t("מיזוג עם הרשומות הקיימות", "Merge with existing records"), "MERGE"), new Option(t("החלפת כל הרשומות", "Replace all records"), "REPLACE"));
      modeLabel.append(mode);
      controls.append(fileLabel, modeLabel);
      const warning = element("p", "", "manager-csv-warning");
      const error = element("p", "", "manager-csv-error");
      error.setAttribute("role", "alert");
      error.hidden = true;
      const preview = element("section", undefined, "manager-csv-card");
      preview.hidden = true;
      preview.setAttribute("aria-label", t("תצוגה מקדימה", "Import preview"));
      const status = element("div", undefined, "manager-csv-progress");
      status.hidden = true;
      const statusText = element("p");
      statusText.setAttribute("role", "status");
      statusText.setAttribute("aria-live", "polite");
      const progress = element("progress");
      progress.max = 100;
      progress.setAttribute("aria-label", t("התקדמות ייבוא", "Import progress"));
      status.append(statusText, progress);
      const consent = element("section", undefined, "manager-csv-card");
      consent.hidden = true;
      const consentText = element("p");
      const save = element("button", t("שמירה במערכת", "Save to system"), "manager-button primary");
      save.type = "button";
      consent.append(consentText, save);
      const actions = element("div", undefined, "manager-csv-actions");
      const dismiss = element("button", t("ביטול", "Cancel"), "manager-button");
      dismiss.type = "button";
      const start = element("button", t("בדיקה והכנה לייבוא", "Validate and prepare import"), "manager-button primary");
      start.type = "button";
      start.disabled = true;
      actions.append(dismiss, start);
      body.append(format, controls, warning, error, preview, status, consent, actions);
      dialog.append(body);

      let rows = null, reading = 0, busy = false, committing = false,
        cancelled = false, settled = false, confirmation, result;
      const handle = { cancel: () => finish({ cancelled: true }) };
      active = handle;
      function finish(value) {
        if (settled) return;
        settled = true;
        cancelled = true;
        confirmation?.(false);
        confirmation = null;
        if (active === handle) active = undefined;
        if (dialog.open) dialog.close();
        dialog.remove();
        if (previous?.isConnected) previous.focus();
        resolve(value);
      }
      function refreshWarning() {
        warning.textContent = mode.value === "REPLACE"
          ? t("החלפה מסירה את כל הרשומות הקיימות בקבוצה זו ומחליפה אותן בקובץ. לא ניתן להסיר את המנהל הפעיל באמצעות הייבוא.", "Replace removes every existing record in this collection and replaces them with the file. The active administrator cannot be removed by import.")
          : t("מיזוג מוסיף מספרים חדשים ומעדכן פרטים למספרים קיימים. רשומות שאינן בקובץ נשמרות. המערכת תבדוק גם את הקיבולת והרשאות המנהלים לפני השמירה.", "Merge adds new phone numbers and updates existing ones. Records missing from the file are preserved. The system also checks total capacity and administrator permissions before saving.");
      }
      function showPreview() {
        preview.replaceChildren();
        preview.hidden = !rows;
        if (!rows) return;
        preview.append(element("h3", capacity === undefined
          ? t(`${rows.length} רשומות מוכנות לבדיקה`, `${rows.length} records ready for validation`)
          : t(`${rows.length} רשומות מוכנות לבדיקה · קיבולת ${capacity}`, `${rows.length} records ready for validation · capacity ${capacity}`)));
        if (capacity === undefined) preview.append(element("p", t("הקיבולת תיבדק במערכת לפני אישור השמירה.", "The system will check capacity before saving can be confirmed.")));
        const wrap = element("div", undefined, "manager-csv-table-wrap"), table = element("table"), head = element("thead"), tr = element("tr");
        for (const label of [t("שם", "Name"), t("טלפון", "Phone"), t("אימייל", "Email")]) {
          const th = element("th", label); th.scope = "col"; tr.append(th);
        }
        head.append(tr);
        const tbody = element("tbody");
        for (const row of rows.slice(0, 5)) {
          const line = element("tr");
          for (const [value, direction] of [[row[2], "auto"], [`+${row[0]} ${row[1]}`, "ltr"], [row[3], "ltr"]]) {
            const cell = element("td", value); cell.dir = direction; line.append(cell);
          }
          tbody.append(line);
        }
        table.append(head, tbody); wrap.append(table); preview.append(wrap);
        if (rows.length > 5) preview.append(element("p", t("מוצגות 5 הרשומות הראשונות בלבד.", "Showing the first 5 records only.")));
      }
      upload.addEventListener("change", async () => {
        const version = ++reading;
        rows = null; error.hidden = true; preview.hidden = true; start.disabled = true;
        const file = upload.files?.[0];
        if (!file) return;
        status.hidden = false; progress.removeAttribute("value");
        statusText.textContent = t("קורא ובודק את הקובץ…", "Reading and checking the file…");
        try {
          if (file.size > maximumBytes) throw new Error("CSV_FILE_TOO_LARGE");
          const content = await file.text();
          if (version !== reading || settled) return;
          rows = validateManagerCsvImport(content, capacity);
          showPreview();
          start.disabled = false;
        } catch (failure) {
          if (version !== reading || settled) return;
          error.textContent = describeError(failure); error.hidden = false;
        } finally {
          if (version === reading && !settled) status.hidden = true;
        }
      });
      mode.addEventListener("change", refreshWarning);
      function requestCancel() {
        if (committing) return;
        if (!busy) { finish(result ?? { cancelled: true }); return; }
        cancelled = true;
        confirmation?.(false);
        confirmation = null;
        consent.hidden = true;
        dismiss.disabled = true;
        progress.removeAttribute("value");
        statusText.textContent = t("מבטל את ההכנה לייבוא. ממתין לאישור המערכת; הרשומות לא יישמרו.", "Cancelling the staged import. Waiting for the system; records will not be saved.");
      }
      dismiss.addEventListener("click", requestCancel);
      save.addEventListener("click", () => {
        if (!confirmation || cancelled || settled) return;
        committing = true;
        save.disabled = true; dismiss.disabled = true;
        consent.hidden = true;
        statusText.textContent = t("שומר במערכת וממתין לאישור…", "Saving to the system and waiting for confirmation…");
        progress.removeAttribute("value");
        const accept = confirmation; confirmation = null; accept(true);
      });
      start.addEventListener("click", async () => {
        if (!rows || busy || settled) return;
        const snapshot = rows.map((row) => [...row]);
        busy = true; cancelled = false; error.hidden = true;
        start.disabled = true; upload.disabled = true; mode.disabled = true; template.disabled = true;
        status.hidden = false; progress.value = 0;
        dialog.setAttribute("aria-busy", "true");
        statusText.textContent = t("מעביר את הקובץ לבדיקה מאובטחת במערכת. הרשומות עדיין לא נשמרות.", "Sending the file for secure system validation. Records are not saved yet.");
        try {
          const imported = await onImport({
            collection, mode: mode.value, rows: snapshot,
            onProgress(done, total) {
              if (settled || cancelled) return;
              if (Number.isFinite(done) && Number.isFinite(total) && total > 0) {
                const percent = Math.max(0, Math.min(100, Math.round(done / total * 100)));
                progress.value = percent;
                statusText.textContent = percent < 100
                  ? t(`מעביר לבדיקה במערכת: ${percent}%`, `Sending for system validation: ${percent}%`)
                  : t("הקובץ הועבר. המערכת בודקת את הרשומות וההרשאות…", "File transferred. The system is checking records and permissions…");
              }
            },
            confirmCommit(validation) {
              if (settled || cancelled) return Promise.resolve(false);
              if (!validation?.valid || validation.rejected || validation.accepted !== snapshot.length)
                throw new Error("IMPORT_REJECTED");
              statusText.textContent = t("האימות הושלם. ממתין לאישור שלכם לפני שמירה.", "Validation complete. Waiting for your approval before saving.");
              progress.value = 100;
              consentText.textContent = mode.value === "REPLACE"
                ? t(`המערכת אימתה ${validation.accepted} רשומות. השמירה תחליף את כל הרשומות בקבוצה זו. לשמור כעת?`, `The system validated ${validation.accepted} records. Saving will replace every record in this collection. Save now?`)
                : t(`המערכת אימתה ${validation.accepted} רשומות. לשמור את המיזוג כעת?`, `The system validated ${validation.accepted} records. Save the merge now?`);
              consent.hidden = false;
              dialog.removeAttribute("aria-busy");
              dismiss.focus();
              return new Promise((answer) => { confirmation = answer; });
            },
          });
          if (settled) return;
          if (cancelled || imported?.cancelled) { finish({ cancelled: true }); return; }
          // The transaction resolves only after the device acknowledges COMMIT.
          result = imported ?? {};
          status.hidden = true; consent.hidden = true; start.hidden = true;
          controls.hidden = true; preview.hidden = true; warning.hidden = true; format.hidden = true;
          const success = element("div", undefined, "manager-csv-success");
          success.setAttribute("role", "status");
          success.append(element("h3", t("הייבוא הושלם בהצלחה", "Import completed")), element("p", t(`${snapshot.length} רשומות יובאו ונשמרו במערכת.`, `${snapshot.length} records were imported and saved to the system.`)));
          body.insertBefore(success, actions);
          dismiss.textContent = t("סגירה", "Close");
        } catch (failure) {
          if (settled) return;
          if (cancelled) { finish({ cancelled: true }); return; }
          status.hidden = true; consent.hidden = true;
          error.textContent = describeError(failure); error.hidden = false;
          start.disabled = false; upload.disabled = false; mode.disabled = false; template.disabled = false;
        } finally {
          busy = false; committing = false;
          confirmation?.(false); confirmation = null;
          dialog.removeAttribute("aria-busy");
          dismiss.disabled = false;
        }
      });
      dialog.addEventListener("cancel", (event) => { event.preventDefault(); requestCancel(); });
      dialog.addEventListener("keydown", (event) => {
        if (event.key !== "Tab") return;
        const controls = [...dialog.querySelectorAll("button,input,select,a[href]")].filter((item) => !item.disabled && !item.closest("[hidden]"));
        const first = controls[0], last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      });
      refreshWarning();
      host.append(dialog); dialog.showModal(); upload.focus();
    });
  }
  return { open, cancel };
}
