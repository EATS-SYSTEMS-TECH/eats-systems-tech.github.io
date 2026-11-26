const translations = {
  en: {
    programming: "Programming", printer: "Printer", logger: "Logger",
    printerShortcut: "Printer disconnected", operator: "Operator",
    distribution: "Firmware distribution", cli: "Managed through CLI",
    checking: "Checking workstation…", unavailable: "The Factory service is unavailable.",
    heading: "Your production workspace.", deviceProgramming: "Device programming",
    subtitle: "Firmware, device and label — together.", refresh: "Refresh stations",
    approvedFirmware: "Approved firmware", selectBatch: "Select a production batch",
    signed: "Signed factory release · PROD", mode: "Programming mode",
    profile: "HW Type / Flash memory", station: "Station", batch: "Production batch",
    selectStation: "Select a station", noStations: "No stations assigned",
    command: "Gate command", configured: "Configured by the approved release",
    autoPrint: "Print label automatically", choosePrinter: "Select your printer in the Printer view.",
    security: "PROD permanently enables the board’s security eFuses.",
    waiting: "Waiting for a verified fixture", program: "Program PROD", queue: "Queue PROD job",
    noRelease: "No approved release selected", authorized: "Factory access verified",
    firmware: "Firmware", sync: "Cloud sync", label: "QR label",
    latest: "Latest job", noJobs: "No recorded jobs for this station.", queued: "Awaiting a verified fixture",
    cancelled: "Cancelled", quarantined: "Quarantined", cancel: "Cancel job",
    quarantine: "Quarantine job", loadEarlier: "Load earlier jobs",
    labelPending: "The next verified label will appear here.",
    noLabels: "No labels available", printPending: "Labels are issued after the server verifies the unit.",
    printerSettings: "Printer settings", release: "Release details", releaseId: "Approved release ID",
    labelWorkspace: "Label workspace", printerHeading: "Ready for the next label.",
    printerSub: "Connect your printer and view label availability.", connect: "Connect printer",
    disconnect: "Disconnect", notSupported: "Open in Chrome on a device with Bluetooth.",
    connecting: "Connecting to printer…", connected: "Printer connected", printerError: "Could not connect to the NIIMBOT printer.",
    activity: "Factory activity", logSub: "Server-recorded programming jobs and outcomes.",
    copyLog: "Copy log", follow: "Follow output", copied: "Log copied", copyError: "Could not copy the log.",
    back: "Back to dashboard", signOut: "Sign out", online: "Web workstation · PROD",
    busy: "Saving job…", denied: "This action is not available for this account or station.",
    conflict: "The station or job changed. Refresh and check its current state.",
    transient: "The action could not be confirmed. Retry to recover the same request.",
  },
  he: {
    programming: "צריבה", printer: "מדפסת", logger: "יומן",
    printerShortcut: "המדפסת מנותקת", operator: "מפעיל",
    distribution: "הפצת קושחה", cli: "מנוהלת דרך CLI",
    checking: "בודק את העמדה…", unavailable: "שירות Factory אינו זמין כרגע.",
    heading: "סביבת הייצור שלך.", deviceProgramming: "צריבת בקרים",
    subtitle: "קושחה, בקר ותווית במקום אחד.", refresh: "רענון תחנות",
    approvedFirmware: "קושחה מאושרת", selectBatch: "בחירת אצוות ייצור",
    signed: "גרסת ייצור חתומה · PROD", mode: "מצב צריבה",
    profile: "סוג חומרה / זיכרון Flash", station: "תחנה", batch: "אצוות ייצור",
    selectStation: "בחירת תחנה", noStations: "אין תחנות משויכות",
    command: "פקודת שער", configured: "לפי הגרסה המאושרת",
    autoPrint: "הדפסת תווית אוטומטית", choosePrinter: "בחרו מדפסת בתצוגת המדפסת.",
    security: "צריבת PROD מפעילה לצמיתות את הגנות ה־eFuse של הבקר.",
    waiting: "ממתין למתקן צריבה מאומת", program: "צריבת PROD", queue: "הוספת עבודת PROD לתור",
    noRelease: "לא נבחרה גרסה מאושרת", authorized: "גישת Factory אומתה",
    firmware: "קושחה", sync: "סנכרון לענן", label: "תווית QR",
    latest: "עבודה אחרונה", noJobs: "אין עבודות מתועדות בתחנה הזו.", queued: "ממתינה למתקן מאומת",
    cancelled: "בוטלה", quarantined: "בהסגר", cancel: "ביטול עבודה",
    quarantine: "העברה להסגר", loadEarlier: "טעינת עבודות קודמות",
    labelPending: "התווית הבאה תופיע כאן לאחר אימות היחידה.",
    noLabels: "אין תוויות זמינות", printPending: "תוויות מופקות לאחר שהשרת מאמת את היחידה.",
    printerSettings: "הגדרות מדפסת", release: "פרטי גרסה", releaseId: "מזהה גרסה מאושרת",
    labelWorkspace: "עמדת תוויות", printerHeading: "לקראת התווית הבאה.",
    printerSub: "חברו מדפסת ובדקו אם תווית זמינה.", connect: "חיבור מדפסת",
    disconnect: "ניתוק", notSupported: "פתחו ב־Chrome במכשיר עם Bluetooth.",
    connecting: "מתחבר למדפסת…", connected: "המדפסת מחוברת", printerError: "לא ניתן להתחבר למדפסת NIIMBOT.",
    activity: "פעילות הייצור", logSub: "עבודות צריבה ותוצאות שנשמרו בשרת.",
    copyLog: "העתקת יומן", follow: "גלילה לסוף היומן", copied: "היומן הועתק", copyError: "העתקת היומן נכשלה.",
    back: "חזרה לדשבורד", signOut: "יציאה", online: "עמדת צריבה מקוונת · PROD",
    busy: "שומר עבודה…", denied: "הפעולה אינה זמינה לחשבון או לתחנה הזו.",
    conflict: "מצב התחנה או העבודה השתנה. רעננו את הרשימה.",
    transient: "לא התקבל אישור לפעולה. אפשר לנסות שוב כדי להשלים את אותה בקשה.",
  },
};

export function workstationCopy(language) {
  return language === "he" ? translations.he : translations.en;
}

export function workstationMarkup(text, language) {
  const dashboard = language === "he" ? "/dashboard/?lang=he" : "/dashboard/";
  return `
    <div id="factory-workstation" dir="${language === "he" ? "rtl" : "ltr"}">
      <header class="topbar">
        <div class="brand" dir="ltr">
          <img src="/assets/img/wifigate-horizontal-logo.webp" width="155" height="36" alt="WIFIGATE">
          <span>FACTORY FLASHER</span>
        </div>
        <div class="top-status">
          <button class="quiet" type="button" data-factory="printer-shortcut">
            <span class="dot" aria-hidden="true" data-factory="printer-dot"></span><span data-factory="printer-status">${text.printerShortcut}</span>
          </button>
          <span id="factory-operator" dir="auto"></span>
        </div>
      </header>
      <div class="workspace">
        <nav class="sidebar" aria-label="WIFIGATE Factory">
          <div class="tabs" role="tablist" aria-label="WIFIGATE Factory">
            <button type="button" role="tab" id="factory-programming-tab" aria-controls="factory-programming" aria-selected="true" data-view="programming"><span aria-hidden="true">▣</span>${text.programming}</button>
            <button type="button" role="tab" id="factory-printer-tab" aria-controls="factory-printer" aria-selected="false" tabindex="-1" data-view="printer"><span aria-hidden="true">▤</span>${text.printer}</button>
            <button type="button" role="tab" id="factory-logger-tab" aria-controls="factory-logger" aria-selected="false" tabindex="-1" data-view="logger"><span aria-hidden="true">›_</span>${text.logger}</button>
          </div>
          <div class="sidebar-bottom"><span class="sidebar-caption">${text.operator}</span><strong dir="auto" data-factory="sidebar-operator"></strong><span class="sidebar-caption">${text.distribution}</span><span>${text.cli}</span></div>
        </nav>
        <div class="workstation-main">
          <section class="operation" aria-label="${text.deviceProgramming}">
            <div class="operation-heading"><strong data-factory="phase">${text.checking}</strong><span data-factory="phase-code" dir="ltr"></span></div>
            <progress data-factory="progress" max="100" value="0" aria-label="${text.deviceProgramming}"></progress>
            <p class="status-sentence" role="status" data-factory="status"></p>
            <div class="workflow-steps"><span>${text.firmware}</span><span>${text.sync}</span><span>${text.label}</span></div>
            <p data-factory="error" class="error" role="alert" hidden></p>
          </section>
          <section id="factory-programming" role="tabpanel" aria-labelledby="factory-programming-tab">
            <div class="heading">
              <div><p class="eyebrow">${text.deviceProgramming}</p><h1 aria-label="WIFIGATE Factory">${text.heading}</h1><p class="subheading">${text.subtitle}</p></div>
              <button type="button" data-factory="refresh">${text.refresh}</button>
            </div>
            <div class="production-grid">
              <div class="program-controls">
                <div class="release">
                  <div><span class="caption">${text.approvedFirmware}</span><strong data-factory="firmware" dir="auto">${text.noRelease}</strong><span class="caption">${text.signed}</span></div>
                </div>
                <form data-factory="program-form">
                  <div class="fields">
                    <label>${text.mode}<select disabled><option>PROD</option></select></label>
                    <label>${text.profile}<select class="workstation-select" data-factory="profile" disabled><option>—</option></select></label>
                    <label>${text.station}<select class="workstation-select" data-factory="station" disabled><option value="">${text.selectStation}</option></select></label>
                    <label>${text.batch}<select class="workstation-select" data-factory="batch" disabled><option value="">${text.selectBatch}</option></select></label>
                    <label class="manufacturer-field">${text.command}<input type="text" value="${text.configured}" readonly></label>
                  </div>
                  <div class="checks"><label><input type="checkbox" disabled>${text.autoPrint}</label></div>
                  <p class="security-note">${text.security}</p>
                  <div class="program-action"><span class="connection" data-factory="device">${text.waiting}</span><button type="submit" class="primary" data-factory="submit" disabled>${text.program}</button></div>
                </form>
                <section class="latest" data-factory="latest" hidden>
                  <h2>${text.latest}</h2><div class="latest-row"><strong data-factory="latest-id" dir="ltr"></strong><span data-factory="latest-time" dir="auto"></span><span data-factory="latest-state"></span></div>
                  <div class="job-actions"><button type="button" data-factory="cancel-job" hidden>${text.cancel}</button><button type="button" data-factory="quarantine-job" hidden>${text.quarantine}</button></div>
                </section>
              </div>
              <aside class="printer-summary">
                <h2>${text.printer}</h2><div class="label-preview"><span>${text.labelPending}</span></div>
                <strong data-factory="summary-printer" dir="auto">NIIMBOT</strong>
                <p class="caption" data-factory="summary-status">${text.choosePrinter}</p>
                <div class="queue-summary"><strong>${text.noLabels}</strong><p class="caption">${text.printPending}</p></div>
                <button type="button" data-factory="printer-settings">${text.printerSettings}</button>
              </aside>
            </div>
            <details class="technical"><summary>${text.release}</summary><div class="release-details"><span class="caption">${text.releaseId}</span><code dir="ltr" data-factory="release-id">—</code></div></details>
          </section>
          <section id="factory-printer" role="tabpanel" aria-labelledby="factory-printer-tab" hidden>
            <div class="heading"><div><p class="eyebrow">${text.labelWorkspace}</p><h1>${text.printerHeading}</h1><p class="subheading">${text.printerSub}</p></div></div>
            <div class="printer-setup"><section class="printer-summary"><h2>NIIMBOT</h2><div class="label-preview"><span>${text.labelPending}</span></div><p data-factory="printer-detail" role="status"></p><div class="printer-actions"><button type="button" data-factory="connect">${text.connect}</button><button type="button" data-factory="disconnect" disabled>${text.disconnect}</button></div></section></div>
          </section>
          <section id="factory-logger" role="tabpanel" aria-labelledby="factory-logger-tab" hidden>
            <div class="heading"><div><p class="eyebrow">${text.activity}</p><h1>${text.logger}</h1><p class="subheading">${text.logSub}</p></div><button type="button" data-factory="copy-log" disabled>${text.copyLog}</button></div>
            <div class="terminal-toolbar"><span data-factory="logger-status"></span><label><input type="checkbox" data-factory="follow-log" checked>${text.follow}</label></div>
            <pre data-factory="log" class="terminal" tabindex="0" aria-label="${text.logger}" dir="ltr"></pre>
            <div class="job-actions"><button type="button" data-factory="earlier-jobs" hidden>${text.loadEarlier}</button><p class="caption" role="status" data-factory="copy-status"></p></div>
          </section>
        </div>
      </div>
      <footer class="workstation-footer"><span dir="ltr">WIFIGATE Factory Flasher</span><div><span>${text.online}</span><a class="text-link" href="${dashboard}">${text.back}</a><button type="button" class="quiet" data-factory="sign-out">${text.signOut}</button></div></footer>
    </div>`;
}
