# מחברת WiFiGate — מדריך מקצועי מקצה לקצה

> מסמך לימוד מלא של מערכת WiFiGate: איך הכול עובד, **למה** זה בנוי ככה, אילו
> ספריות בשימוש, כל ה-flows, והלוגים החשובים לכל שלב. נכתב מתוך קריאה של קוד
> המקור בפועל, לא מהזיכרון.
>
> אם אתם קוראים README כללי — קראו קודם את [README.md](../README.md). המסמך הזה
> הוא שכבה עמוקה יותר: מדריך למידה + reference.
>
> 🇬🇧 An English version of this handbook is available at
> [WIFIGATE_HANDBOOK_EN.md](./WIFIGATE_HANDBOOK_EN.md).

---

## תוכן עניינים

1. [תמונת-על: מה זו WiFiGate ולמה](#1-תמונת-על)
2. [ה-Stack הטכנולוגי — כל ספרייה ולמה בחרו בה](#2-הstack-הטכנולוגי)
3. [מפת הקוד — איפה כל דבר יושב](#3-מפת-הקוד)
4. [מודל הנתונים — Gate, Role, Group, Dual Control](#4-מודל-הנתונים)
5. [שכבת האחסון — למה local-first ואיך זה עובד](#5-שכבת-האחסון)
6. [ניהול state — ה-store המותאם אישית](#6-ניהול-state)
7. [ה-Flows המרכזיים מקצה לקצה](#7-הflows-המרכזיים)
8. [פרוטוקול ה-BLE המאובטח SECURE_V3 — לעומק](#8-פרוטוקול-הble-המאובטח)
9. [הצפנת קישורי הזמנה — לעומק](#9-הצפנת-קישורי-הזמנה)
10. [Deep Linking — איך קישור הופך למסך](#10-deep-linking)
11. [FOTA / OTA — עדכון קושחה](#11-fota--ota)
12. [Nearby Wi-Fi Setup — עמוד ההגדרה המקומי](#12-nearby-wi-fi-setup)
13. [לוגים חשובים — קטלוג מלא לפי תגית](#13-לוגים-חשובים)
14. [הרשאות ופלטפורמה](#14-הרשאות-ופלטפורמה)
15. [סודות ו-Build Inputs](#15-סודות-וbuild-inputs)
16. [פיתוח מקומי, בדיקות ו-Release](#16-פיתוח-מקומי-וריליז)
17. [גבולות אבטחה — מה מוגן ומה לא](#17-גבולות-אבטחה)
18. [Cheat Sheet — הפניות מהירות](#18-cheat-sheet)

---

## 1. תמונת-על

WiFiGate היא אפליקציית **React Native / Expo** לשליטה בשערים פיזיים שמונעים על
ידי קושחת WiFiGate (מבוססת ESP32-C6). האפליקציה היא בעצם שני דברים במקביל:

1. **ארנק שערים (gate wallet)** על הטלפון — רשימת שערים עם רמות גישה ותוקף שונים.
2. **לקוח שליטה מאובטח** מול המכשיר — פותח שער דרך Bluetooth Low Energy בפרוטוקול
   מוצפן.

### שלושת התפקידים של האפליקציה

האפליקציה שומרת מטא-דאטה של שערים **מקומית** (local-first) ומשתמשת ברשימה הזאת
כדי להניע שלוש משימות:

- **פתיחת שער דרך BLE** (הליבה).
- **שיתוף / קבלת גישה** דרך קישורי הזמנה מוצפנים.
- **כניסה ל-setup מקומי דרך Wi-Fi** (עמוד `http://192.168.4.1/`).

### עיקרון על: הפרדת שכבות אבטחה

זו נקודה קריטית להבנת כל הארכיטקטורה — יש **שתי בעיות אבטחה נפרדות** עם **שני פתרונות
נפרדים**:

| שכבה | מה מגנה | מנגנון |
| --- | --- | --- |
| BLE (SECURE_V3) | תקשורת טלפון↔שער | ECDH + HKDF + AES-256-GCM + HMAC |
| קישורי הזמנה | ה-payload בתוך ה-URL | AES-256-GCM עם מפתח נגזר מ-`HMAC_URL_SECRET` |

הן **לא** מחליפות זו את זו. קישור מוצפן לא מגן על ה-BLE, ו-SECURE_V3 לא מגן על
ה-URL. ראו [סעיף 17](#17-גבולות-אבטחה).

```
┌───────────────────────────────────────────────────────────────┐
│                        אפליקציית WiFiGate                       │
│                                                                │
│   UI (app/ - Expo Router)                                      │
│        │                                                       │
│   openGateFlow  ─┬─ gatesStore (state)  ─── storage (AsyncStorage)
│        │         │                                             │
│   ble/openGate ──┴─ ble/secureProtocol (crypto SECURE_V3)      │
│        │                                                       │
└────────┼───────────────────────────────────────────────────────┘
         │ BLE (Nordic UART Service)          │ Wi-Fi AP 192.168.4.1
         ▼                                     ▼
   ┌──────────────┐                     ┌──────────────┐
   │ שער ESP32-C6 │◄── OTA (Firebase) ──│  setup page  │
   └──────────────┘                     └──────────────┘
```

---

## 2. ה-Stack הטכנולוגי

מקור: [package.json](../package.json). להלן הספריות המשמעותיות ו**למה** הן שם.

### ליבה — Runtime ו-Navigation

| ספרייה | תפקיד | למה זה |
| --- | --- | --- |
| `expo` ~54 / `react-native` 0.81 / `react` 19 | הבסיס | Expo נותן dev-client, build (EAS), ו-config plugins בלי לגעת ב-native ידנית |
| `expo-router` ~6 | ניתוב file-based | כל קובץ ב-`app/` הוא route; deep-linking מובנה |
| `expo-dev-client` | dev build מותאם | חובה — האפליקציה תלויה במודולים native (BLE, Wi-Fi) שלא קיימים ב-Expo Go |
| `react-native-reanimated` / `gesture-handler` / `worklets` | אנימציות ו-gestures | UI חלק, drag-to-reorder |
| `zustand` | state (זמין) | **הערה:** ה-gate store הראשי (`gatesStore.ts`) בנוי ידנית ולא משתמש ב-zustand. ראו [סעיף 6](#6-ניהול-state) |

### קריפטוגרפיה — הלב של האבטחה

| ספרייה | תפקיד |
| --- | --- |
| `@noble/curves` | עקומת P-256 (ECDH ל-handshake) |
| `@noble/hashes` | SHA-256, HKDF, HMAC |
| `@noble/ciphers` | AES-256-GCM |
| `react-native-get-random-values` | polyfill ל-`crypto.getRandomValues` (חובה שיטען **ראשון** — ראו שורה 1 ב-`app/_layout.tsx`) |
| `buffer` / `base-64` | קידוד base64 ל-BLE וקישורים |

בחרו ב-`@noble/*` כי הן ספריות crypto טהורות ב-JS, ללא תלות ב-native, audited,
ומתאימות ל-React Native (שאין בו `crypto` מלא).

### BLE ו-Wi-Fi — התקשורת הפיזית

| ספרייה | תפקיד |
| --- | --- |
| `react-native-ble-plx` | ליבת ה-BLE: scan, connect, GATT, notify/write |
| `react-native-bluetooth-state-manager` | מצב ה-Bluetooth (on/off) ובקשת הפעלה |
| `react-native-wifi-reborn` | scan/connect ל-AP של השער (flow ה-Nearby setup) |
| `react-native-webview` | הצגת עמוד ה-setup המקומי `192.168.4.1` |

### זהות ו-Auth

| ספרייה | תפקיד |
| --- | --- |
| `@react-native-firebase/auth` + `firebase` | אימות טלפון ב-SMS OTP |
| `@react-native-google-signin/google-signin` | זהות Google (מילוי אימייל ל-BLE) |
| `expo-apple-authentication` | Sign in with Apple |
| `expo-auth-session` | OAuth flows |
| `libphonenumber-js` + `country-list` | נירמול/ולידציה של מספרי טלפון וקידומות מדינה |

### קלט/פלט ו-UI

`expo-camera` (סריקת QR), `react-native-qrcode-svg` (יצירת QR לשיתוף),
`expo-contacts` (בחירת מוזמן מאנשי קשר), `expo-file-system` + `expo-sharing`
(ייצוא CSV / קבצים), `react-native-draggable-flatlist` (סידור מחדש של שערים),
`lottie-react-native` (אנימציות), `@react-native-async-storage/async-storage`
(אחסון מקומי).

---

## 3. מפת הקוד

```
app/                         # Expo Router — כל מסך הוא route
  _layout.tsx                # root: deep-link routing, auth gating, splash
  index.tsx                  # מסך הבית: רשימת שערים, קבוצות, חיפוש, reorder
  scan.tsx                   # סריקת QR + import
  gate/[id].tsx              # import של קישור + מסך פרטי שער
  open-gate/[id].tsx         # פתיחה מהירה (מ-widget/deep link)
  group/[id].tsx             # מסך קבוצה
  dual-control/[id].tsx      # מסך dual-control
  nearby-wifigate-link.tsx   # כניסה ל-Nearby Wi-Fi setup
  wifigate-setup.tsx         # ה-WebView של עמוד ההגדרה המקומי
  firmware-update.tsx        # מסך OTA
  settings/[id].tsx          # הגדרות שער
  auth/login.tsx             # login (provider)
  auth/phone.tsx             # OTP טלפון

src/
  models.ts                  # כל ה-types: Gate, UserRole, GateGroup, DualControl...
  storage.ts                 # AsyncStorage — כל ה-keys, load/save, נירמול
  gatesStore.ts              # ה-state store המרכזי (observable ידני) + merge rules
  gateService.ts             # ולידציית guest access ולוגיקת שירות
  openGateFlow.ts            # ה-orchestration של פתיחת שער (permissions→BT→BLE)
  gateOpenBlockReason.ts     # מיפוי הודעות שגיאה ל-block reasons
  gateSecurity.ts            # פרסינג/נרמול של security bundle (SECURE_V3)

  ble/
    openGate.ts              # ליבת ה-BLE (scan/connect/handshake/frames) — הקובץ הגדול
    secureProtocol.ts        # הקריפטו של SECURE_V3 (handshake, keys, frames)
    bluetoothState.ts        # מצב Bluetooth + ensureBluetoothReady
    permissions.ts           # הרשאות BLE

  inviteLinkCrypto.ts        # הצפנה/פענוח של payload קישורים (AES-GCM)
  linkService.ts             # פרסינג/בנייה של קישורי הזמנה (single/group/dual)
  dualControlInviteImport.ts # import של הזמנת dual-control
  groupInviteImport.ts       # import של הזמנת קבוצה

  auth/                      # LocalAuthContext, providerIdentity, google/apple
  auto-open/                 # beacon key + capability (spec: docs/WIFIGATE_AUTO_OPEN.html)
  fota/                      # publicFota (Firebase), driveFota (legacy)
  widgets/                   # widget שער (Android) + headless open
  wifi/                      # useGateWifiConnectionGuard
  crypto/                    # hmacSecrets (שחזור HMAC_URL_SECRET)
  i18n/                      # שפות ותרגומים
  permissions/               # appLaunch, contacts, wifi
  utils/                     # datetime, gateCommand, guestAccess, subscription...
  components/                # כל ה-UI: modals, gate-settings, admin-access...
  features/my-gates/         # ה-collections של מסך הבית (tiles, helpers)

docs/
  ble-security-protocol-v3.md  # המפרט הפורמלי של SECURE_V3
  WIFIGATE_HANDBOOK_HE.md      # המסמך הזה

README.md                          # סקירה כללית
README_WIFIGATE_LINK_INVITATIONS.md# פרוטוקול קישורי ההזמנה במלואו
README_OTA_FIREBASE.md             # OTA מ-Firebase Storage
WIFIGATE_API_README.md             # קישורים שהונפקו ע"י WIFIGATE API
```

---

## 4. מודל הנתונים

מקור: [src/models.ts](../src/models.ts).

### 4.1 Gate

הישות המרכזית. שדות חשובים:

```ts
type Gate = {
  id: string;            // מזהה מקומי (= systemId כרגע)
  systemId: string;      // מזהה החומרה, משמש ב-BLE ובקישורים. למשל "9876543210123456"
  systemName: string;    // השם המקורי/מיובא
  displayName: string;   // השם שהמשתמש יכול לערוך
  role: UserRole;        // ★ התפקיד קובע הכול (ראו 4.2)
  subscription?: "OFFLINE" | "ONLINE" | "WIFI" | "ALL_IN_ONE";
  security?: GateSecurityConfig;   // ה-bundle של SECURE_V3
  gateCommand?: GateCommandType;   // סוג הפעולה שהקושחה דיווחה (PULSE/TOGGLE/PUSH_BUTTON...)
  autoOpen?: GateAutoOpenSettings;
  // שיתוף/אירוח:
  hostPhone/hostName/hostEmail?    // המזמין
  guestPhone?                      // המוזמן (בקישור guest פרטי)
  accessStart/accessEnd?           // חלון תוקף (ms)
  // רישום ל-PRE_USER/PRE_ADMIN:
  residentName/floorNumber/apartmentNumber/parkingNumber?
  openHistory?: GateOpenHistoryEntry[];  // לוג מקומי של פתיחות אחרונות (newest-first)
};
```

### 4.2 Role — התפקיד קובע הכול

```ts
type UserRole = "ADMIN" | "USER" | "GUEST" | "PRE_USER" | "PRE_ADMIN";
```

| תפקיד | משמעות | מקור | פקודת BLE אחרי import |
| --- | --- | --- | --- |
| `ADMIN` | מנהל מאושר | אחרי אישור קושחה | `OPEN` / `TOGGLE_*` |
| `USER` | משתמש קבוע מאושר | אחרי אישור קושחה | `OPEN` / `TOGGLE_*` |
| `GUEST` | גישה זמנית עם חלון זמן | קישור guest | `OPEN_GUEST` / `TOGGLE_*_GUEST` |
| `PRE_USER` | הוזמן כ-user, טרם אושר | קישור user (`r=PU`) | `ADD_USER` |
| `PRE_ADMIN` | הוזמן/נוסף כ-admin, טרם אושר | QR/manual או קישור admin (`r=PA`) | `ADD_ADMIN` |

**למה `PRE_*`?** כי האפליקציה local-first — היא לא יכולה לדעת שהקושחה אישרה אותך.
עד שהמכשיר מאשר, אתה במצב "ממתין". כשמריצים `ADD_USER`/`ADD_ADMIN` בהצלחה מול השער,
הקושחה מאשרת, וה-callback `onRoleUpgrade` משדרג `PRE_USER→USER` / `PRE_ADMIN→ADMIN`
(ראו `maybeUpgradeRole` ב-[openGate.ts](../src/ble/openGate.ts) ואת ה-persist ב-
[openGateFlow.ts](../src/openGateFlow.ts)).

### 4.3 חוקי מיזוג תפקידים (למה שער לא "נהרס")

מקור: `addGate` ב-[gatesStore.ts](../src/gatesStore.ts). המערכת מגנה על גישה קבועה
מפני downgrade בטעות:

- שער קבוע (ADMIN/USER) **לא** יורד ל-GUEST כשמייבאים קישור guest.
- תפקיד קבוע **לא** נדרס ע"י תפקיד `PRE_*` חלש יותר.
- שער guest **כן** יכול להשתדרג לתפקיד קבוע/pending.
- שם מותאם אישית (`displayName`) נשמר אם import מאוחר מביא רק שם ברירת-מחדל.

### 4.4 GateGroup ו-DualControl

- **GateGroup** — קונטיינר UI מקומי בלבד. לא משנה שום התנהגות קושחה/BLE. ניתן לקינון
  דרך `parentGroupId`. מכיל `gateIds[]` ו-`dualControlIds[]`.
- **DualControl** — זוג שערים (`firstGateId`/`secondGateId`) עם שתי תוויות פעולה
  (`firstLabel`/`secondLabel`, למשל "פתח"/"סגור"). כל הזמנת dual-control מכילה **בדיוק
  2 שערים**.

---

## 5. שכבת האחסון

מקור: [src/storage.ts](../src/storage.ts). המערכת **local-first** — מצב השערים חי
ב-AsyncStorage, לא בענן. אין "בעלות שער" מרכזית בשרת.

### מפתחות האחסון (`KEYS`)

```
wifigate:gates                 # מערך השערים
wifigate:localProfile          # פרופיל onboarding (name/email/phone/provider/terms)
wifigate:phone                 # מספר טלפון
wifigate:username              # שם תצוגה
wifigate:language / :languagePreview
wifigate:gates:order           # סדר תצוגה
wifigate:gates:groups          # קבוצות
wifigate:gates:dualControls    # dual controls
wifigate:gates:toggleRelayStates # מצב relay אחרון לשערי TOGGLE
wifigate:firmware:url          # URL קושחה אחרון
wifigate:defaultCountryIso2    # קידומת מדינה ברירת מחדל
wifigate:appleIdentityRecords  # מיפוי userId→זהות Apple (Apple לא שולח אימייל בכל פעם)
wifigate:guestTable:*          # העדפות תצוגת טבלת guests
```

### נקודות עדינות שכדאי להכיר

- **`loadGates()` מנרמל בכל טעינה**: ממזג `openHistory` עם `lastOpenedAt`, מנרמל
  `gateCommand`, `fotaChannel`, `hostEmail` (lowercase), guest access.
- **`getJSON`/`setJSON` בולעים שגיאות** ומחזירים fallback — כתיבה כושלת לא מפילה את
  האפליקציה (אבל גם לא מתריעה — שווה לזכור ב-debug).
- **מגבלת Android**: `DEFAULT_ANDROID_ASYNC_STORAGE_LIMIT_BYTES = 6MB`.
  `debugPrintAllLocalStorage()` מדפיס שימוש/נותר + dump מלא — כלי debug מצוין.
- **פרופיל מטמון**: `cachedLocalProfile` נטען פעם אחת; `loadPhone/loadUsername/loadEmail`
  מעדיפים אותו.

---

## 6. ניהול state

מקור: [src/gatesStore.ts](../src/gatesStore.ts).

זהו **observable store בנוי ידנית** — לא Redux ולא zustand (למרות ש-zustand ב-deps):

```ts
let _gates: Gate[] = [];
const listeners = new Set<() => void>();
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function notify() { listeners.forEach(f => f()); }
```

כל מוטציה (`addGate`, `updateGateRole`, `renameGate`, ...) עובדת **immutably** (בונה
מערך חדש), קוראת `saveGates`, `notify`, ובמידת הצורך `syncGateWidgets()` +
`syncAutoOpen()`.

### `initGates()` — מה קורה באתחול (חשוב מאוד)

1. `loadGates()` מ-AsyncStorage.
2. `normalizeGateRoleOnLoad` — מיגרציה של guests ישנים (`isGuest:true` → `role:"GUEST"`).
3. מיגרציית comments (ברירת מחדל).
4. **הסרת שערים ישנים ללא `role`** — המודל היום role-based בלבד.
5. `notify()`.
6. `cleanupExpired(true)` — **מסיר שערי guest שפג תוקפם** ומראה Alert.
7. `syncGateWidgets()` + `syncAutoOpen()`.

לוגים לחפש: `🔄 [Store] initGates()`, `📦 [Store] N gates loaded`,
`🧹 [Store] Removed N legacy gate(s)`, `🧹 [Store] N guest gate(s) removed (expired)`.

---

## 7. ה-Flows המרכזיים

### 7.1 Onboarding / Sign in

מסלולים: [app/auth/login.tsx](../app/auth/login.tsx),
[app/auth/phone.tsx](../app/auth/phone.tsx).

הזרימה:
1. המשתמש נכנס דרך provider (Google/Apple) → נשמר אימייל מנורמל בפרופיל.
2. שם פרופיל → קידומת מדינה → מספר טלפון → אישור תנאי שימוש.
3. SMS OTP (Firebase Auth) → אישור קוד.
4. `saveLocalOnboardingProfile` שומר את הכול, מסנכרן טלפון/שם למראה ה-native.

**למה טלפון+אימייל?** בפתיחת BLE מאובטחת, הקושחה מאמתת את זוג המזמין (host phone +
host email) עבור guests. לכן האימייל נשמר ומועבר ב-command.

ה-gating עצמו ב-`_layout.tsx` (`LayoutNavigator`): אם לא onboarded → מפנה ל-
`/auth/phone` (אם כבר יש provider identity) או `/auth/login`.

### 7.2 הוספת שער (QR / Manual)

- **Manual/QR** → `addGateFromQrOrManual` → role `PRE_ADMIN`.
- QR שמכיל security bundle קומפקטי (`dpk`/`psk`, בלי `protocol`/`keyId`) מנורמל ל-
  `SECURE_V3` עם `keyId="key-1"` (ראו [gateSecurity.ts](../src/gateSecurity.ts)).
- import/save **דוחה שער ללא security bundle** — שערים חדשים חייבים SECURE_V3.

### 7.3 Import של קישור הזמנה (single/group/dual)

מקורות: [linkService.ts](../src/linkService.ts),
[inviteLinkCrypto.ts](../src/inviteLinkCrypto.ts), [_layout.tsx](../app/_layout.tsx),
[app/gate/[id].tsx](../app/gate/[id].tsx). פרוטוקול מלא ב-
[README_WIFIGATE_LINK_INVITATIONS.md](../README_WIFIGATE_LINK_INVITATIONS.md).

הזרימה:
1. ה-OS פותח `wifigate.io/wifigate-link/` (או `-api/`) או `wifigate://`.
2. `_layout.tsx` → `extractInvitationRoute` מזהה את הסוג (single/group/dual/open-gate).
3. אם לא onboarded → הקישור **נכנס לתור** (`pendingInviteUrl`) עד סיום onboarding.
4. ניתוב ל-`app/gate/[id].tsx` (או group/dual).
5. `parseIncomingLink` מפענח `ep=` (AES-GCM) ל-JSON קומפקטי.
6. **ולידציה**: פענוח תקין? חלון זמן? הרשאת טלפון (private vs public)?
7. `addGateFromGuestInvite` / `addGateFromUserInvite` / `addGate` (PRE_ADMIN) —
   ממזג לתוך ה-state לפי חוקי המיזוג.

**Public vs Private** (מקור: פרוטוקול הקישורים):
- אם שדה `p` (טלפון יעד) קיים → הזמנה **פרטית**: רק הטלפון המטמון שתואם ל-`p` יכול לקבל.
- אם `p` חסר → **ציבורית**: מוגבלת רק בחלון הזמן (ל-guest).

**מיפוי role code**: `A→ADMIN`, `U→USER`, `G→GUEST`, `PU→PRE_USER`, `PA→PRE_ADMIN`.
בפועל: הזמנת admin נשלחת כ-`r="PA"`, user כ-`r="PU"`, guest כ-`g=1`.

### 7.4 פתיחת שער דרך BLE — ה-flow המלא

זהו ה-flow החשוב ביותר. Orchestration ב-[openGateFlow.ts](../src/openGateFlow.ts):

```
runGateOpenFlow(gate)
  ├─ ensureBlePermissionsInteractive()   → "permissions_blocked"
  ├─ ensureBluetoothReady()              → "bluetooth_off"
  ├─ loadPhone()                         → "phone_missing"
  ├─ getGuestAccessValidation(gate)      → "guest_expired"
  ├─ טוען email/username/toggleRelayState
  └─ openGateBLE({...}) ──────────────────► ble/openGate.ts
        ├─ (מטפל ב-onRoleUpgrade → updateGateRole)
        ├─ שומר toggleRelayState אם gateCommand=TOGGLE
        └─ אם OK ולא PRE_* → markGateOpened (openHistory)
```

מיפוי סטטוסים: `OK→ok`, `BUSY→busy`, `UNAUTHORIZED→unauthorized`, `TIMEOUT→timeout`,
`FAIL→fail` (ואם ההודעה מעידה על אירוע פעיל/חיישן → `event_active`/`sensor_inactive`).

בתוך `openGateBLE` (ב-[ble/openGate.ts](../src/ble/openGate.ts)):

1. **Scan / Connect** — `findConnectedGate`: סורק devices, מתאים לפי `systemId`
   (שם ה-advertise), מתחבר. יש profile מהיר (`default`) ואיטי (`slow-android`).
   אם יש `preferredDeviceId` — מנסה חיבור ישיר קודם.
2. **Discover GATT** — מבקש MTU 517 (Android), מגלה את שירות ה-**Nordic UART**:
   - Service `6e400001-...`
   - RX `6e400002-...` (כתיבה מהאפליקציה לשער)
   - TX `6e400003-...` (notify מהשער לאפליקציה)
3. **Inbox** — `createBleTextInbox`: מרכיב הודעות מ-chunks לפי `\n`, תומך גם
   ב-notify וגם ב-polling (fallback), ומסנן echo מקומי.
4. **Handshake SECURE_V3** — client_hello → device_hello → session keys (ראו סעיף 8).
5. **Encrypted command frame** — בונה את הפקודה, מוסיף `authTag`, מצפין ושולח (`seq=1`).
6. **Encrypted response frame** — קורא, מפענח, מחזיר `SecureDeviceResponse`.

### 7.5 בחירת הפקודה לפי תפקיד וסוג שער

| מצב | פקודת BLE |
| --- | --- |
| USER/ADMIN, שער רגיל | `OPEN` |
| USER/ADMIN, שער TOGGLE | `TOGGLE_ON` / `TOGGLE_OFF` (מצב יעד מפורש, לפי `toggleRelayState` השמור) |
| USER/ADMIN, שער PUSH_BUTTON | `PUSH_BUTTON_HOLD` (חוזר) + `PUSH_BUTTON_RELEASE` |
| GUEST, שער רגיל | `OPEN_GUEST` |
| GUEST, שער TOGGLE | `TOGGLE_GUEST_ON` / `TOGGLE_GUEST_OFF` (מצב יעד מפורש עם היסטוריית אורח) |
| PRE_USER | `ADD_USER` (מאשר → USER) |
| PRE_ADMIN | `ADD_ADMIN` (מאשר → ADMIN) |

**Guest open** מעביר בנוסף `guestName`, `inviterName`, `inviterPhone`,
`inviterEmail` — והקושחה מאמתת את זוג המזמין לפני פתיחה. אם חסר `inviterEmail`
בהזמנת guest — האפליקציה עוצרת עם הודעה לבקש הזמנה חדשה.

**Push button** הוא מקרה מיוחד (מקור: `docs/ble-security-protocol-v3.md`): כל frame
של HOLD מרענן את ה-session TTL; אותו חיבור BLE נשאר פתוח כל עוד לוחצים; ה-`seq` עולה
בכל frame; ב-finger-up נשלח `PUSH_BUTTON_RELEASE`. לקושחה יש watchdog של 1s כ-fallback.

### 7.6 שיתוף גישה (יצירת קישורים)

מקורות: `buildShareData` (single), `buildGroupShareData`, `buildDualControlShareData`
ב-[linkService.ts](../src/linkService.ts).

Admin יכול ליצור: קישור guest, קישור user, קישור admin, וקישור Nearby Wi-Fi setup.
ה-payload נבנה קומפקטי (`i`,`n`,`r`,`h`,`he`,`p`,`kid`,`dpk`,`psk`...), מוצפן ב-
`encryptInviteLinkPayload` ל-`ep=v1.<base64url>`, ומשולב ל-URL הציבורי.

---

## 8. פרוטוקול ה-BLE המאובטח

מקורות: [src/ble/secureProtocol.ts](../src/ble/secureProtocol.ts) +
המפרט [docs/ble-security-protocol-v3.md](./ble-security-protocol-v3.md).

`SECURE_V3` הוא **הפרוטוקול המאובטח היחיד**. גם האפליקציה וגם הקושחה חייבות v3.

### 8.1 Provisioning bundle

כל שער מאובטח מחזיק ב-`Gate.security`:

```ts
{ protocol: "SECURE_V3",
  keyId: string,            // חריץ מפתח, למשל "key-1"
  devicePublicKey: string,  // מפתח ציבורי P-256 דחוס, hex
  pairingSecret: string }   // סוד pairing 32 בייט לכל שער, hex
```

### 8.2 ה-Handshake — צעד אחר צעד

**קבועים** (secureProtocol.ts): גרסה `3`, freshness ברירת מחדל `15000ms`,
תוויות: `wifigate-ble-secure-v3` (transcript), `device-hello-proof-v3`,
`command-auth-v3`.

```
אפליקציה                                     שער (ESP32)
   │  1. client_hello (plaintext JSON)          │
   │  { v:3, type, keyId, sessionId,            │
   │    clientPub, clientNonce }                │
   │ ─────────────────────────────────────────►│
   │                                            │  מאמת v/keyId/nonce
   │  2. device_hello (מוצפן)                    │  גוזר helloKey/helloNonce
   │  { v:3, type, ct, devicePub, nonce,        │
   │    sessionId, sid }                        │
   │◄───────────────────────────────────────── │
   │  ct מפוענח ל:                               │
   │  { deviceNonce, expiresInMs:30000,         │
   │    keyId, pairingProof }                   │
   │                                            │
   │  3. שני הצדדים גוזרים session keys           │
   │  4. frame מוצפן (OPEN...) seq=1  ──────────►│
   │  5. ◄────── response frame מוצפן seq=1      │
```

### 8.3 גזירת המפתחות (key schedule)

```
ephemeral P-256 keypair (client)
sharedSecret = ECDH(clientSecret, devicePub).X    // 32 בייט (X של הנקודה הדחוסה)

helloKey   = HKDF-SHA256(sharedSecret, salt=clientNonce, info="hello-key|sid|session|keyId", 32)
helloNonce = HKDF-SHA256(sharedSecret, salt=clientNonce, info="hello-nonce|...", 12)

// device_hello מפוענח:
plaintext = AES-256-GCM(helloKey, helloNonce, AAD="device_hello|systemId|sessionId").decrypt(ct)

// אימות זהות המכשיר (proof-of-possession של pairingSecret):
pairingProof = HMAC-SHA256(pairingSecret, "device-hello-proof-v3|systemId|session|keyId|clientPub|clientNonce|devicePub|deviceNonce")

transcriptHash = SHA256("wifigate-ble-secure-v3|systemId|session|keyId|clientPub|clientNonce|devicePub|deviceNonce")

// מפתחות session (salt = clientNonce || deviceNonce):
clientWriteKey     = HKDF(sharedSecret, salt, "client-write-key|...", 32)
deviceWriteKey     = HKDF(sharedSecret, salt, "device-write-key|...", 32)
clientNoncePrefix  = HKDF(sharedSecret, salt, "client-nonce-prefix|...", 8)
deviceNoncePrefix  = HKDF(sharedSecret, salt, "device-nonce-prefix|...", 8)
authKey            = HKDF(pairingSecret, salt=transcriptHash, "command-auth-key|...", 32)
```

### 8.4 מסגרת פקודה מוצפנת (command frame)

```
command = { cmd, systemId, timestamp, freshnessMs:15000, phone, role, name, ... }
commandHash = SHA256(stableJson(command))                       // JSON יציב (מפתחות ממויינים)
authTag = HMAC-SHA256(authKey, "command-auth-v3" || transcriptHash || seq(4B BE) || commandHash)

innerPayload = { authTag, command }
nonce = clientNoncePrefix(8) || seq(4B BE)                       // 12 בייט
ct = AES-256-GCM(clientWriteKey, nonce, AAD="frame|c2d|systemId|session|seq").encrypt(innerPayload)
frame = { v:3, type:"frame", seq, ct }
```

התגובה (d2c) סימטרית: `deviceWriteKey`, `deviceNoncePrefix`, AAD עם `d2c`.
הקושחה מחזירה `{ type:"response", cmd, status:OK|BUSY|FAIL|UNAUTHORIZED, gateCommand?,
relayState?, ... }`.

> **stableJson חשוב**: הפקודה מסודרת עם מפתחות ממויינים אלפביתית ובלי `undefined`
> (`stableStringify`), כדי ש-SHA256 יהיה זהה בשני הצדדים. שינוי סדר שדות ישבור את ה-HMAC.
> בנוסף, `systemId` **מושמט** מה-command על ה-wire כשאפשר לגזור אותו מה-session.

### 8.5 עמידות ל-Replay ו-Freshness

Replay resistance נובעת מ**שכבות מרובות**: `sessionId` טרי, `clientNonce`/`deviceNonce`
טריים, `seq` פר-frame, `authTag` קשור ל-transcript, session TTL, ואכיפת freshness.

**Freshness** (הקושחה): דוחה פקודה אם `freshnessMs` חסר/0, אם הוא גדול מ-TTL של
ה-session, או אם גיל ה-session גדול מ-`freshnessMs`. הקושחה מתעדת את `freshnessMs`
המבוקש, את הגיל הנמדד, ואת סיבת הדחייה.

### 8.6 שחזור מפתח מכשיר (device key rotation)

אם השער מחזיר `devicePub` שונה מהשמור אבל ה-`pairingProof` תקין — האפליקציה מקבלת את
המפתח החדש (`usedStoredDevicePublicKey=false`) ומרעננת אותו לאחר הצלחת הפקודה. אם
הפענוח נכשל לגמרי → שגיאה ידידותית: *"This gate's secure identity changed. Scan the
latest WIFIGATE QR..."* (המכשיר כנראה עבר reprovision/flash-format).

### 8.7 פרמטרים של התעבורה (BLE transport)

מ-[openGate.ts](../src/ble/openGate.ts): MTU מבוקש `517` (attribute מוגבל ל-512B),
chunk = `mtu-3`, timeout להודעה `10000ms`, פריימינג לפי `\n`, כתיבה עם/בלי response
לפי המאפיין. הודעות מיוחדות (`device_hello`, `frame`) מסוננות לפי `systemId`/
`sessionId`/`seq` — הודעות לא צפויות מדולגות עם `[BLE][SECURE] Ignoring unexpected...`.

---

## 9. הצפנת קישורי הזמנה

מקור: [src/inviteLinkCrypto.ts](../src/inviteLinkCrypto.ts).

```
key = HKDF-SHA256(HMAC_URL_SECRET_bytes,
                  salt="wifigate-invite-link:key-salt",
                  info="wifigate-invite-link:aes-256-gcm", 32)
ciphertext = AES-256-GCM(key, managedNonce, AAD="wifigate-invite-link:v1").encrypt(JSON)
token = "v1." + base64url(nonce||ciphertext)
```

- `managedNonce(gcm)` — ה-nonce מוגרל ומוצמד לפני ה-ciphertext אוטומטית.
- הפלט מגורסה `v1.` — מאפשר version bump עתידי.
- **אתר האינטרנט לא מפענח** — הוא רק מעביר את ה-`ep=` לאפליקציה.

### מאפייני אבטחה ומגבלה חשובה

✅ ה-payload אטום ב-chat/דפדפן/preview. ✅ שיבוש גורם לכשל פענוח באפליקציה.
✅ האתר הסטטי לא צריך לדעת plaintext.

⚠️ **מגבלה**: זו הצפנה עם **shared secret שמוטמע ב-build** — לא end-to-end לפי נמען.
כל build אמין שמכיל את ה-URL secret יכול לפענח קישורים תקינים. זה חזק מ-query
params רגילים, אבל **לא** שקול ל-token חד-פעמי/מונפק-שרת/קשור-נמען.

---

## 10. Deep Linking

מקור: `extractInvitationRoute` ב-[app/_layout.tsx](../app/_layout.tsx).

**סכימות נתמכות**: `wifigate://` (native) ו-`https://wifigate.io` (paths:
`wifigate-link`, `wifigate-api`).

הפונקציה מפרקת URL ומחליטה על היעד לפי סדר עדיפויות:
`dual-control` → `group` → `open-gate` (widget) → `gate` (כולל `?ep=` שהופך ל-
`gateId="invite"`). תומכת גם ב-`?link=` מקונן.

**עדינות**: אם המשתמש לא onboarded, הקישור נכנס לתור (`pendingInviteUrl`) ומעובד רק
אחרי סיום ה-onboarding (`useEffect` על `isOnboarded`). כפילות מסוננת דרך
`lastHandledInviteUrlRef`.

לוגים לחפש: `[Linking] event/initial URL received`, `[Linking] Routing invitation
URL`, `[Linking] Queueing invitation URL until onboarding completes`,
`[Linking] Ignoring unsupported URL`.

---

## 11. FOTA / OTA

מקורות: [src/fota/publicFota.ts](../src/fota/publicFota.ts) (Firebase, החדש),
`driveFota.ts` (Google Drive, legacy), [app/firmware-update.tsx](../app/firmware-update.tsx).
מדריך: [README_OTA_FIREBASE.md](../README_OTA_FIREBASE.md).

הקושחה נקראת מ-**Firebase Storage** לפי שני מימדים:
- ערוץ QR: `fotaChannel` = `dev` / `prod`.
- variant חומרה: `8MB` / `16MB`.

⇒ 4 feeds: `{dev|prod}-fota/{8mb|16mb}/manifest.json`. האפליקציה מורידה chunks
מוצפנים `.wgfota` שרשומים ב-manifest, ומאמתת `flashVariantMb` לפני המשך.

הזרימה מול השער: `OTA_OPEN` דרך BLE → השער מחזיר SSID/password/token של ה-AP →
האפליקציה מתחברת ומזרימה את הקושחה. ה-config הציבורי ב-[app.json](../app.json)
(`expo.extra.fotaStorage*`).

לוגים: `[FOTA]`.

---

## 12. Nearby Wi-Fi Setup

מקורות: `src/components/gate-settings/admin-access/NearbyWIFIGATELink.tsx`,
[app/wifigate-setup.tsx](../app/wifigate-setup.tsx).

מאפשר ל-admin לפתוח את ה-AP המקומי של השער ולהיכנס לעמוד ההגדרה:

1. admin בוחר "Nearby WIFIGATE Link".
2. בקשת הרשאות BLE + ודא Bluetooth.
3. שליחת `WIFI_OPEN` דרך BLE.
4. אם השער מאשר → מחזיר SSID/password נוכחיים.
5. scan רשתות Wi-Fi סמוכות (`react-native-wifi-reborn`).
6. חיבור ל-AP של השער.
7. פתיחת `http://192.168.4.1/` ב-WebView.

**ה-WebView מוקשח**: מוגבל ל-host המקומי של השער, חוסם ניווט חיצוני שרירותי, חוסם
app-scheme, תומך בהורדת CSV, ומציע reload/recovery.

⚠️ פרוטוקול ה-BLE **לא** מאבטח את עמוד ה-HTTP הזה — זו workflow נפרדת על רשת מקומית.

לוגים: `[NearbyWIFIGATELink]`, `[WebView]`, `[WiFi]`.

---

## 13. לוגים חשובים

`logger.ts` מגדיר `log`/`warn` שרצים **רק ב-`__DEV__`**. אבל שים לב: הרבה מהלוגים
הקריטיים (BLE, Store, Linking) משתמשים ב-`console.log`/`console.warn` **ישירות**,
כלומר יופיעו גם ב-builds רגילים. לכן ה-BLE trace הוא כלי ה-debug המרכזי בשטח.

### 14.1 קטלוג תגיות (לפי תדירות)

| תגית | היכן | מה מספרת |
| --- | --- | --- |
| `[BLE]` | ble/openGate.ts | scan, connect, MTU, chunks TX/RX, timeouts |
| `[BLE][SECURE]` | ble/openGate.ts | handshake, client/device hello, frames מוצפנים |
| `[Store]` | gatesStore.ts | טעינה, merge, downgrade prevention, cleanup |
| `[GateOpenFlow]` | openGateFlow.ts | שלבי ה-orchestration של הפתיחה |
| `[MyGates]` | features/my-gates | מסך הבית (collections, tiles) |
| `[GateScreen]` | app/gate | מסך פרטי שער |
| `[AutoOpen]*` | auto-open/* | מפתח ה‑beacon וההרשאה |
| `[Linking]` | _layout.tsx | קליטת deep links וניתוב |
| `[ENCRYPTED_INVITE_PARAM]` | linkService | פרסינג `ep=` |
| `[InviteLinkCrypto]` | inviteLinkCrypto.ts | כשל פענוח payload |
| `[FOTA]` | fota/* | OTA |
| `[NearbyWIFIGATELink]` `[WebView]` `[WiFi]` | setup flow | Nearby Wi-Fi |
| `[GateWidget]` `[WidgetHeadlessOpen]` `[WidgetOpenGate]` | widgets/* | widget פתיחה |
| `[storage]` | storage.ts | usage, dump, כשלי כתיבה |
| `[Contacts]` `[Camera]` | permissions | הרשאות |

### 14.2 מה לחפש בכל flow (debug playbook)

**פתיחת שער נכשלת:**
```
[GateOpenFlow] Checking BLE permissions / Bluetooth state
[BLE] Scanning for gate for Nms...
[BLE] Gate not found. Move closer...        ← TIMEOUT (קרבה/שם advertise)
[BLE] Requested MTU 517, negotiated N
[BLE][SECURE] Sending client_hello. sessionId=...
[BLE][SECURE] Waiting for device_hello...
[BLE][SECURE][DEVICE_HELLO_PARSE] ...        ← bundle לא תואם (reprovision?)
[BLE][SECURE] Sending encrypted OPEN frame. seq=1
[GateOpenFlow] BLE result: { status: ... }
```

**זהות שער השתנתה:** חפש `Could not decrypt device_hello with the stored secure
bundle` / `pairing proof mismatch` → צריך לסרוק QR מחדש.

**Import של קישור נכשל:** `[Linking] Routing invitation URL` →
`[InviteLinkCrypto] Failed to decrypt invitation payload` (שיבוש/secret לא תקין) או
Alert "Invalid invitation / Access expired / Unauthorized".

**guest נעלם:** `🧹 [Store] N guest gate(s) removed (expired)` — פג תוקף בעת אתחול.

**downgrade נמנע:** `[Store] Preventing role downgrade for gate X: ADMIN stays`.

---

## 14. הרשאות ופלטפורמה

מוגדר ב-[app.json](../app.json) וקבצים native. האפליקציה צריכה:

- **מצלמה** — סריקת QR.
- **Bluetooth** — תקשורת שער.
- **Location (Android)** — נדרש היסטורית ל-BLE/Wi-Fi scanning.
- **Nearby Wi-Fi devices (Android)**.
- **Local network (iOS)** — גישה ל-`192.168.4.1`.

Deep linking מוגדר ל-`wifigate://` ו-`https://wifigate.io`.

- שער כניסה להרשאות: [src/permissions/appLaunch.ts](../src/permissions/appLaunch.ts)
  (`checkAppLaunchPermissions` = BLE + Bluetooth ready; `prepareStartupPermissionsForSignIn`
  = contacts + BLE).
- מצב Bluetooth: `ble/bluetoothState.ts` (`ensureBluetoothReady`).
- הרשאות BLE: `ble/permissions.ts` (`ensureBlePermissionsInteractive`, `hasBlePermissions`).

---

## 15. סודות ו-Build Inputs

קלטים נדרשים (חלקם **gitignored**):

- `src/crypto/HMAC_SECRETS.json` — **סוד**. משמש לשחזור `HMAC_URL_SECRET` (הצפנת
  קישורים) וכל הגנת URL/HMAC legacy. נגזר דרך [src/crypto/hmacSecrets.ts](../src/crypto/hmacSecrets.ts).
- `GoogleService-Info.plist` (iOS) + `google-services.json` (Android) — Firebase.

**EAS**: הסקריפט [scripts/eas-pre-install.js](../scripts/eas-pre-install.js) שם את
`HMAC_SECRETS.json` בסביבת ה-build (`eas-build-pre-install`). מחוץ ל-repo, מסופק
דרך משתנה סביבה/CI.

⚠️ אם `HMAC_URL_SECRET` לא מוגדר — `deriveInviteLinkKey` זורק שגיאה וכל הצפנת/פענוח
הקישורים תיכשל.

---

## 16. פיתוח מקומי וריליז

מ-[package.json](../package.json):

```bash
npm install
# ספק src/crypto/HMAC_SECRETS.json (או HMAC_SECRETS_JSON ב-EAS)
# ודא קבצי Firembase לסביבה

npm run start:dev-client   # expo start --dev-client
npm run start:usb          # Android דרך USB (PowerShell script)
npm run reset:app          # איפוס state של אפליקציית Android
npm run reset:usb          # reset + relaunch

npm run lint               # eslint
npm run typecheck          # tsc --noEmit
npm run verify             # lint + typecheck ★ הרץ לפני shipping
```

### Release checklist (smoke test על מכשיר)

- [ ] Sign-in ב-phone OTP
- [ ] QR / manual import
- [ ] import של קישור מוצפן
- [ ] guest invite flow
- [ ] user/admin invite flow
- [ ] פתיחת שער ב-BLE
- [ ] Nearby Wi-Fi setup
- [ ] ייצוא CSV מעמוד ה-setup (אם רלוונטי)

build ו-submit עם EAS אחרי smoke test.

---

## 17. גבולות אבטחה

חשוב להבין **מה לא מוגן**:

- `SECURE_V3` מגן על תעבורת ה-BLE **בלבד** — לא על עמוד ה-HTTP setup
  (`192.168.4.1`), לא על שיתוף הקישורים, ולא על אחסון ה-credentials בטלפון.
- קישורי הזמנה מוצפנים ועמידים לשיבוש, אבל משתמשים ב-**shared secret ב-build** —
  לא token מונפק-שרת/חד-פעמי/קשור-נמען.
- מצב השערים **local-first** ב-AsyncStorage — אין בעלות שער מסונכרנת בענן.
- תפקידים נאכפים גם ע"י לוגיקת האפליקציה וגם ע"י התנהגות המכשיר, אבל **ההרשאה
  הסופית של החומרה חייבת להיאכף בקושחה** — לא לסמוך על ה-UI.

---

## 18. Cheat Sheet

### קבצים לפי משימה

| רוצה להבין... | קרא |
| --- | --- |
| קריפטו BLE ו-message flow | [docs/ble-security-protocol-v3.md](./ble-security-protocol-v3.md), [secureProtocol.ts](../src/ble/secureProtocol.ts) |
| ליבת BLE (scan/connect/frames) | [ble/openGate.ts](../src/ble/openGate.ts) |
| orchestration של פתיחה | [openGateFlow.ts](../src/openGateFlow.ts) |
| חוקי role ו-merge | [models.ts](../src/models.ts), [gatesStore.ts](../src/gatesStore.ts) |
| יצירת/import קישורים | [linkService.ts](../src/linkService.ts), [inviteLinkCrypto.ts](../src/inviteLinkCrypto.ts) |
| פרוטוקול קישורים מלא | [README_WIFIGATE_LINK_INVITATIONS.md](../README_WIFIGATE_LINK_INVITATIONS.md) |
| deep linking | [app/_layout.tsx](../app/_layout.tsx) |
| Nearby setup | `NearbyWIFIGATELink.tsx`, [app/wifigate-setup.tsx](../app/wifigate-setup.tsx) |
| OTA | [README_OTA_FIREBASE.md](../README_OTA_FIREBASE.md), [fota/publicFota.ts](../src/fota/publicFota.ts) |
| אחסון | [storage.ts](../src/storage.ts) |

### פקודות BLE (SecureCommandName)

```
OPEN  TOGGLE_ON  TOGGLE_OFF
OPEN_GUEST  TOGGLE_GUEST_ON  TOGGLE_GUEST_OFF
PUSH_BUTTON_HOLD  PUSH_BUTTON_RELEASE
ADD_USER  ADD_ADMIN
WIFI_OPEN  OTA_OPEN  GET_FW_VERSION
GET_AUTO_OPEN_STATUS  CHECK_AUTO_OPEN_RSSI  GET_GATE_COMMAND
```

### ערכי gateCommand בתגובה

`1=PULSE  2=PULSE_AFTER_PULSE  3=PULSE_AFTER_PULSE_AFTER_PULSE  4=TOGGLE  5=PUSH_BUTTON`

### Nordic UART UUIDs

```
Service  6e400001-b5a3-f393-e0a9-e50e24dcca9a
RX (write) 6e400002-b5a3-f393-e0a9-e50e24dcca9a
TX (notify) 6e400003-b5a3-f393-e0a9-e50e24dcca9a
```

---

*מסמך זה נכתב מקריאת קוד המקור. כשמשהו בקוד משתנה (במיוחד `secureProtocol.ts`,
`linkService.ts`, `gatesStore.ts`) — עדכנו גם כאן.*
