// Only public, allowlisted error codes reach diagnostics. Server messages,
// credentials, request payloads and cryptographic material are never displayed.
export function managerConnectionError(error, language = "en", fallback = false) {
  const t = (he, en) => language === "he" ? he : en;
  const original = typeof error === "string" ? error : error?.code ?? error?.message;
  const aliases = {
    "storage is busy - try again in a moment": "STORAGE_BUSY",
    "Device hello mismatch": "GATE_AUTHENTICATION_FAILED",
    "Device nonce mismatch": "GATE_AUTHENTICATION_FAILED",
    "Invalid device principal": "GATE_AUTHENTICATION_FAILED",
    "Device proof mismatch": "GATE_AUTHENTICATION_FAILED",
    "Grant scope mismatch": "GATE_AUTHENTICATION_FAILED",
    "Grant key mismatch": "GATE_AUTHENTICATION_FAILED",
    "Invalid device public key": "GATE_AUTHENTICATION_FAILED",
    "Invalid curve point": "GATE_AUTHENTICATION_FAILED",
    "Response metadata mismatch": "RESPONSE_MISMATCH",
    "Response nonce mismatch": "RESPONSE_MISMATCH",
    "auth/user-token-expired": "UNAUTHENTICATED",
    "auth/id-token-expired": "UNAUTHENTICATED",
    "auth/requires-recent-login": "RECENT_REAUTH_REQUIRED",
    ERR_NETWORK: "HOST_API_UNAVAILABLE",
    NETWORK_ERROR: "HOST_API_UNAVAILABLE",
  };
  const code = Object.hasOwn(aliases, original) ? aliases[original] : original;
  const localSync = [
    t("פתחו את האפליקציה ליד המערכת, עם חשבון WIFIGATE Manager פעיל.", "Open the app near the system using an active WIFIGATE Manager account."),
    t("התחברו למערכת באפליקציה כמנהל מקומי שהרשאתו עדיין תקפה.", "Connect to the system in the app as a local administrator whose access is still valid."),
    t("פתחו את תפריט החשבון דרך תמונת הפרופיל, בחרו WIFIGATE Manager ולחצו ״סנכרון״ בכרטיס המערכת. המתינו לאישור שהסנכרון הושלם, ואז נסו להתחבר כאן שוב.", "Open the account menu from your profile picture, choose WIFIGATE Manager, then Sync on the system card. Wait for confirmation that sync completed, then try connecting here again."),
    t("אם אין לכם הרשאת מנהל מקומי תקפה, בקשו ממנהל מורשה לחדש את הגישה. האתר אינו יכול לחדש אותה מרחוק.", "If you no longer have valid local administrator access, ask an authorized administrator to restore it. The website cannot restore it remotely."),
  ];
  const network = [
    t("בדקו שהמערכת מופעלת ומחוברת לאינטרנט, ושגם למחשב יש חיבור פעיל.", "Check that the system is powered on and online, and that this computer has an internet connection."),
    t("כשהחיבור תקין, לחצו על ״ניסיון חיבור נוסף״. אם המערכת נשארת לא זמינה, בדקו אותה באפליקציה כשאתם לידה.", "When the connection is available, choose Try connecting again. If the system stays unavailable, check it in the app while nearby."),
  ];
  const messages = {
    CONNECTION_PAUSED: [t("החיבור הופסק כשיצאתם מהעמוד", "Connection paused when you left the page"), t("החיבור נסגר כדי שלא תיפתח סביבת ניהול ברקע. אפשר להתחבר שוב כשאתם מוכנים.", "The connection was closed so a workspace cannot open in the background. You can connect again when you are ready."), [t("לחצו על ניסיון חיבור נוסף כדי להתחיל בקשה חדשה.", "Choose Try connecting again to start a new request."), t("אם שלחתם שינוי לפני היציאה, בדקו את מצב המערכת לפני שליחה חוזרת.", "If you sent a change before leaving, check the system state before repeating it.")]],
    INVALID_CONNECTION_TIMING: [t("לא ניתן לאמת את חלון החיבור", "The connection window could not be verified"), t("פרטי חלון החיבור אינם תואמים לגרסה הנתמכת. הבקשה נעצרה.", "The connection window does not match a supported version. The request was stopped."), [t("רעננו את האתר ונסו שוב. אם הבעיה נמשכת, פנו לתמיכה עם קוד השגיאה.", "Refresh the website and try again. If this continues, contact support with the error code.")]],
    CREDENTIAL_REVOKED: [
      t("צריך לחדש את קישור Manager", "Renew the Manager link"),
      t("השער דחה את הרשאת Manager שהוצגה בחיבור הזה. ייתכן שאישור זמני פג, שהקישור זקוק לחידוש או שהרשאת המנהל המקומי השתנתה.", "The gate rejected the Manager authorization presented for this connection. A temporary approval may have expired, the link may need renewal, or local administrator access may have changed."),
      [t("נסו תחילה חיבור נוסף כדי לקבל אישור חיבור חדש. אם השגיאה חוזרת, המשיכו לחידוש מאומת באפליקציה לפי הצעדים הבאים.", "First try connecting again to obtain fresh connection approval. If the error repeats, continue with authenticated renewal in the app using the steps below."), ...localSync],
    ],
    CREDENTIAL_UNKNOWN: [
      t("קישור Manager אינו מזוהה", "Manager link not recognized"),
      t("המערכת לא זיהתה הרשאת Manager תקפה עבור החיבור הזה. יש לאמת ולחדש את הקישור מתוך האפליקציה.", "The system did not recognize valid Manager authorization for this connection. Verify and renew the link in the app."), localSync,
    ],
    KEY_MISMATCH: [
      t("צריך לאמת מחדש את המערכת", "Verify the system again"),
      t("פרטי הזיהוי של המערכת אינם תואמים לפרטים ששמורים ב־Manager. זה יכול לקרות לאחר החלפת חומרה או איפוס.", "The system identity does not match the identity saved in Manager. This can happen after hardware replacement or a reset."),
      [t("ודאו שבחרתם את המערכת הנכונה לפי המזהה שלה.", "Check that you selected the correct system ID."), ...localSync],
    ],
    SYSTEM_MISMATCH: [
      t("זו אינה המערכת שנבחרה", "A different system answered"),
      t("המערכת שענתה אינה תואמת למערכת שנבחרה באתר. החיבור נעצר כדי למנוע ניהול של מערכת אחרת.", "The responding system does not match the system selected on the website. The connection stopped to avoid managing the wrong system."),
      [t("חזרו לרשימת המערכות ובדקו את מזהה המערכת המבוקשת.", "Return to your systems and check the intended system ID."), t("אם המזהה אינו נכון, התחברו למערכת הנכונה באפליקציה וסנכרנו את הקישור שלה ל־Manager.", "If the ID is wrong, connect to the correct system in the app and sync its Manager link.")],
    ],
    VERSION_UNSUPPORTED: [
      t("נדרש עדכון גרסה", "An update is needed"),
      t("גרסת המערכת אינה תואמת לגרסת החיבור שבה משתמש Manager.", "The system version is not compatible with this Manager connection."),
      [t("עדכנו את אפליקציית WIFIGATE.", "Update the WIFIGATE app."), t("בקשו ממנהל מקומי מורשה לבדוק ולעדכן את קושחת המערכת באפליקציה, ואז נסו שוב.", "Ask an authorized local administrator to check and update the system firmware in the app, then try again.")],
    ],
    GATE_AUTHENTICATION_FAILED: [
      t("לא ניתן לאמת את החיבור", "The connection could not be verified"),
      t("לא ניתן לאמת את זהות המערכת או את הרשאת החיבור. החיבור נעצר ולא נפתחה סביבת ניהול.", "The system identity or connection authorization could not be verified. The connection stopped before opening the workspace."),
      [t("ודאו שבחרתם את המערכת הנכונה ושהאפליקציה מעודכנת.", "Check that you selected the correct system and that the app is up to date."), t("בדקו את הרשאת המנהל המקומי באפליקציה ליד המערכת. אם הבעיה נמשכת, פנו למנהל הפלטפורמה עם קוד השגיאה שבפרטים הטכניים.", "Check local administrator access in the app near the system. If this continues, contact your platform administrator with the code in Technical details.")],
    ],
    BUSY: [
      t("המערכת כבר בשימוש", "The system is already in use"),
      t("חיבור ניהול אחר או בקשת חיבור קודמת עדיין משתמשים במערכת.", "Another management session or an earlier connection request is still using the system."),
      [t("סיימו את הניהול הפעיל באפליקציה או בחלון אחר, או המתינו לסיום הבקשה הקודמת.", "End the active session in the app or another window, or wait for the earlier request to finish."), t("לאחר מכן לחצו על ״ניסיון חיבור נוסף״.", "Then choose Try connecting again.")],
    ],
    STORAGE_BUSY: [
      t("נתוני המערכת אינם זמינים כרגע", "System data is temporarily unavailable"),
      t("המערכת לא הצליחה לקרוא את נתוני ההרשאות כרגע. זו אינה הוכחה שההרשאה שלכם בוטלה.", "The system could not read its access records right now. This does not prove your access was revoked."),
      [t("המתינו מעט ולחצו על ״ניסיון חיבור נוסף״.", "Wait a moment, then choose Try connecting again."), t("אם הבעיה חוזרת, בקשו ממנהל המערכת לבדוק את האחסון שלה.", "If this repeats, ask the system administrator to check its storage.")],
    ],
    NO_COMMUNICATION: [t("המערכת לא ענתה", "The system did not respond"), t("לא התקבל מענה מהמערכת בזמן ההמתנה. ייתכן שהיא כבויה או שאינה מחוברת לרשת.", "The system did not respond during the connection attempt. It may be powered off or offline."), network],
    CONNECTION_FAILED: [t("לא הצלחנו ליצור חיבור", "Could not establish a connection"), t("החיבור בין הדפדפן למערכת לא הושלם. ייתכן שיש הפרעה ברשת או בשירות החיבור.", "The browser could not complete its connection to the system. The network or connection service may be unavailable."), network],
    CONNECTION_TIMEOUT: [t("החיבור מתעכב", "The connection timed out"), t("המערכת לא השלימה את הקמת החיבור בזמן. לא נפתחה סביבת ניהול.", "The system did not establish the connection in time. The workspace has not opened."), network],
    DISCONNECTED: [t("החיבור למערכת נותק", "The system disconnected"), t("החיבור הפעיל הופסק. אם נשלח שינוי או ניסיון פתיחה, תוצאתו עשויה להיות לא ידועה.", "The active connection ended. If you sent a change or an opening command, its result may be unknown."), [t("התחברו מחדש וקראו את מצב המערכת וההיסטוריה.", "Reconnect and read the system state and history."), t("לפני שליחת אותה פעולה שוב, בדקו אם היא כבר בוצעה.", "Check whether the action already happened before sending it again.")]],
    RESPONSE_TIMEOUT: [t("לא התקבל אישור מהמערכת", "No confirmation from the system"), t("המערכת לא החזירה תשובה בזמן. אין בכך אישור שהפעולה הצליחה או נכשלה.", "The system did not return a response in time. This does not confirm whether the action succeeded or failed."), [t("התחברו מחדש ובדקו את המצב העדכני ואת ההיסטוריה.", "Reconnect and check the current state and history."), t("אל תשלחו שוב פעולת פתיחה או שינוי לפני שבדקתם את התוצאה.", "Check the result before repeating an opening or a change.")]],
    SECURE_SESSION_EXPIRED: [t("צריך לחדש את החיבור", "The connection needs renewing"), t("תוקף חיבור הניהול הסתיים. פקודות שינוי אינן נשלחות שוב אוטומטית.", "The management connection expired. Changes are never replayed automatically."), [t("התחברו מחדש. אם שלחתם פעולה לפני הניתוק, בדקו תחילה אם בוצעה.", "Reconnect. If you sent an action before the disconnect, first check whether it completed.")]],
    MANAGER_ACCESS_DENIED: [t("אין לחשבון גישה למערכת", "This account cannot access the system"), t("לחשבון המחובר אין כרגע הרשאת WIFIGATE Manager פעילה למערכת הזו.", "The signed-in account does not currently have active WIFIGATE Manager access to this system."), [t("בדקו שהתחברתם לחשבון הנכון ושמסלול Manager פעיל עבורו.", "Check that you signed in to the correct account and that its Manager access is active."), t("אם המערכת שייכת לארגון, בקשו ממנהל הארגון לבדוק את השיוך וההרשאה שלכם.", "For an organization system, ask the organization administrator to check your membership and access.")]],
    RESOURCE_NOT_FOUND: [t("פרטי החיבור כבר אינם זמינים", "Connection details are no longer available"), t("בקשת החיבור הסתיימה או שהמערכת כבר אינה זמינה לחשבון המחובר.", "The connection request expired, or the system is no longer available to this account."), [t("רעננו את רשימת המערכות, בחרו את המערכת ונסו שוב.", "Refresh your systems, select the system and try again."), t("אם המערכת אינה מופיעה, בדקו את השיוך שלה עם מנהל הארגון.", "If the system is missing, check its assignment with your organization administrator.")]],
    UNAUTHENTICATED: [t("צריך להתחבר לאתר מחדש", "Sign in again"), t("לא ניתן לאמת עוד את ההתחברות לחשבון.", "Your account sign-in could not be verified."), [t("התחברו מחדש לאתר, השלימו את האימות ובחרו שוב את המערכת.", "Sign in to the website again, complete verification and select the system again.")]],
    TOTP_REQUIRED: [t("נדרש אימות לחשבון", "Account verification is required"), t("יש להשלים את האימות באפליקציית האימות לפני חיבור למערכת.", "Complete authenticator verification before connecting to the system."), [t("השלימו את האימות בחשבון באתר, ואז חזרו ונסו להתחבר.", "Complete account verification on the website, then try connecting again.")]],
    RECENT_REAUTH_REQUIRED: [t("צריך לאמת מחדש את הזהות", "Verify your identity again"), t("האימות האחרון לחשבון אינו עדכני מספיק לפעולה הזו.", "Your most recent identity verification is too old for this action."), [t("התחברו מחדש לאתר והשלימו את אימות החשבון, ואז נסו שוב.", "Sign in again and complete account verification, then try again.")]],
    HOST_API_UNAVAILABLE: [t("שירות Manager אינו זמין כרגע", "Manager is currently unavailable"), t("הדפדפן לא הצליח להגיע לשירות Manager. זו אינה הודעה על ביטול ההרשאה שלכם במערכת.", "The browser could not reach the Manager service. This does not mean your system access was revoked."), [t("בדקו את חיבור האינטרנט ורעננו את הדף.", "Check your internet connection and refresh the page."), t("אם הבעיה נמשכת, נסו מאוחר יותר או פנו למנהל הפלטפורמה.", "If this continues, try later or contact your platform administrator.")]],
    AUTH_UNAVAILABLE: [t("לא ניתן לבדוק הרשאות כרגע", "Access cannot be checked right now"), t("שירות בדיקת ההרשאות אינו זמין זמנית. לא ניתן לאשר את החיבור.", "The access-checking service is temporarily unavailable. The connection cannot be approved."), [t("נסו שוב מאוחר יותר. אם הבעיה נמשכת, פנו למנהל הפלטפורמה.", "Try again later. If this continues, contact your platform administrator.")]],
    MANAGER_SIGNING_UNAVAILABLE: [t("שירות החיבור אינו זמין כרגע", "The connection service is unavailable"), t("השירות לא הצליח להכין אישור חיבור מאובטח למערכת.", "The service could not prepare secure connection authorization for the system."), [t("נסו שוב מאוחר יותר. אם הבעיה נמשכת, פנו למנהל הפלטפורמה.", "Try again later. If this continues, contact your platform administrator.")]],
    APP_CHECK_REQUIRED: [t("בדיקת האתר לא הושלמה", "Site verification did not complete"), t("בדיקת האבטחה של הדפדפן לא אפשרה לאשר את הבקשה.", "The browser's site security check could not approve the request."), [t("רעננו את הדף והשלימו את בדיקת האבטחה אם היא מוצגת.", "Refresh the page and complete the security check if prompted."), t("אם הבעיה נמשכת, פנו למנהל הפלטפורמה.", "If this continues, contact your platform administrator.")]],
    APP_CHECK_UNCONFIGURED: [t("נדרשת הגדרת אתר", "Site setup is required"), t("בדיקת האבטחה של האתר עדיין אינה מוגדרת להפעלת Manager.", "The site's security check has not been configured for Manager."), [t("פנו למנהל הפלטפורמה להשלמת ההגדרה. סנכרון המערכת באפליקציה לא ישנה את הגדרת האתר.", "Ask your platform administrator to complete the site setup. Syncing the system in the app will not change the site configuration.")]],
    INVALID_RELAY: [t("שירות החיבור לא עבר אימות", "The connection service could not be verified"), t("פרטי שירות החיבור אינם תקינים. הדפדפן עצר את החיבור.", "The connection service details are invalid. The browser stopped the connection."), [t("רעננו את הדף. אם זה חוזר, פנו למנהל הפלטפורמה עם קוד השגיאה שבפרטים הטכניים.", "Refresh the page. If this happens again, contact your platform administrator with the code in Technical details.")]],
    INVALID_FRAME: [t("התקבלה תשובה לא תקינה", "An invalid response was received"), t("נתוני החיבור שהתקבלו אינם בפורמט הצפוי ולכן החיבור נעצר.", "The connection data was not in the expected format, so the connection stopped."), [t("נסו להתחבר מחדש. אם זה חוזר, פנו למנהל הפלטפורמה.", "Try connecting again. If this happens again, contact your platform administrator.")]],
    INVALID_NONCE: [t("לא ניתן לאשר חיבור מאובטח", "Secure connection approval failed"), t("בדיקת האבטחה של בקשת החיבור לא הושלמה.", "The connection request did not pass its security check."), [t("נסו להתחבר מחדש. אם זה חוזר, פנו למנהל הפלטפורמה.", "Try connecting again. If this happens again, contact your platform administrator.")]],
    RESPONSE_MISMATCH: [t("לא ניתן לאמת את תשובת המערכת", "The system response could not be verified"), t("תשובת המערכת אינה תואמת לבקשה שנשלחה. לא ניתן להסתמך עליה כאישור פעולה.", "The system response does not match the request. It cannot be treated as confirmation of the action."), [t("התחברו מחדש ובדקו את המצב לפני שליחת פעולה נוספת.", "Reconnect and check the current state before sending another action."), t("אם זה חוזר, פנו למנהל הפלטפורמה.", "If this happens again, contact your platform administrator.")]],
    INVALID_CAPABILITIES: [t("נתוני המערכת אינם תואמים", "System details are incompatible"), t("לא התקבלו מהמערכת נתוני יכולות תקינים לניהול דרך האתר.", "The system did not provide valid capability information for web management."), [t("בדקו באפליקציה שהקושחה מעודכנת, ואז נסו להתחבר מחדש.", "Check in the app that the firmware is up to date, then try connecting again."), t("אם זה חוזר, פנו למנהל הפלטפורמה.", "If this happens again, contact your platform administrator.")]],
  };
  // This is the backend's sign-in error code; retain it in support diagnostics.
  messages.UNAUTHORIZED = messages.UNAUTHENTICATED;
  const entry = Object.hasOwn(messages, code) ? messages[code] : null;
  if (!entry && !fallback) return null;
  return entry ? { title: entry[0], message: entry[1], steps: [...entry[2]], code }
    : {
      title: t("החיבור לא הושלם", "Connection did not complete"),
      message: t("לא ניתן להשלים את החיבור למערכת כרגע.", "The system connection could not be completed right now."),
      steps: [t("בדקו את החיבור לאינטרנט ונסו להתחבר שוב.", "Check your internet connection and try connecting again."), t("אם הבעיה נמשכת, פנו למנהל הפלטפורמה וציינו את מזהה המערכת והזמן שבו ניסיתם להתחבר.", "If this continues, contact your platform administrator with the system ID and the time of the attempt.")],
      code: null,
    };
}
