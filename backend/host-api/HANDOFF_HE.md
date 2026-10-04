# WIFIGATE Host — מסירת API, מיפוי ופורטל

מסמך זה הוא חוזה עבודה למפתחי backend/frontend. המקורות המחייבים הם
[`docs/WIFIGATE_HOST.html`](../../docs/WIFIGATE_HOST.html) ו־
[`README_WIFIGATE_LINK_INVITATIONS.md`](../../README_WIFIGATE_LINK_INVITATIONS.md).
חוזה ה־HTTP המכני נמצא ב־[`openapi.yaml`](./openapi.yaml).

## גבולות המערכת

1. **Client API key** (`wfg_live_k_…`) מזהה את הלקוח וההרשאות לאינטגרציה. הוא נשלח רק משרת השותף ל־WIFIGATE Host API.
2. **WIFIGATE Host KEY** (`wgk_live_v1.…`) הוא `encryptedKeyValue`: snapshot מוצפן של Gate / Dual Control / Group, כולל פרטי pairing וזהות המזמין. שומרים אותו כסוד בשרת השותף לכל חדר/נכס. הוא אינו מזהה ציבורי ואינו נשמר ב־collection של הפורטל.
3. **inviteUrl** הוא credential פרטי וזמני לאורח ספציפי. שותף ה־PMS אחראי למסירה. `delivery.channel="none"` ב־v1.
4. פתיחת שער מתבצעת מקומית באפליקציה מול השער דרך BLE. ה־API מנפיק קישור; הוא אינו endpoint לפתיחת שער מרחוק.

## מיפוי key/value הקנוני

המעטפת המוצפנת המשותפת כוללת `k="guests-api-key"`, `sc`, `h` (טלפון מזמין E.164), `he` (אימייל מזמין lowercase) ו־`hn` אופציונלי. `sc` נלקח **רק** מהמפתח המפוענח. אין לקבל אותו, את מזהי השערים או את פרטי המזמין מה־PMS כשדות סמכות.

| סוג יעד | `sc` | זהות | מיקום שערים | מספר מערכות פיזיות | שדות נוספים |
| --- | --- | --- | --- | --- | --- |
| Gate | `gate` | `gate.i`, `gate.n` | `gate` יחיד | 1 | `gate.gc`, מיקום ו־Access Note בתוך השער |
| Dual Control | `dual-control` | `dcid`, `n` | `gs` עם שני שערים בדיוק | 2 שונים | `l1`, `l2`, `dcf?`, `dci?`, מיקום של הישות |
| Group | `group` | `gid`, `n` | `gs[]` ישירים ו־`dcs[]` שכל איבר בו הוא Dual מלא | 1–20 ייחודיים | אין pointers לקבוצות אחרות; snapshot שטוח ללא כפילות |

כל gate snapshot מכיל `i` (systemId), `n`, `kid`, `dpk`, `psk`. ב־Production שלושתם חובה ל־SECURE_V3. שדות metadata אפשריים: `sn`, `s`, `gc`, `fc`, `v`, `gi`, `ad`, `alat`, `alng`, `cm`, `rn`, `fl`, `ap`, `pk`. לכל `systemId` ביעד חייב להיות entitlement פעיל בעת **יצירה חדשה** של הזמנה. Gate/Group/Dual הם snapshot קבוע; שינוי בהרכב או בפרטי השער דורש מפתח חדש.

| פקודת Gate `gc` | משמעות הזמנה | פעולת אורח באפליקציה |
| --- | --- | --- |
| `PULSE` (alias קושחה `1`) | פעימה בודדת | `OPEN_GUEST` |
| `PULSE_AFTER_PULSE` (`2`) | רצף שתי פעימות | `OPEN_GUEST` לפי פרוטוקול השער |
| `PULSE_AFTER_PULSE_AFTER_PULSE` (`3`) | רצף שלוש פעימות | `OPEN_GUEST` לפי פרוטוקול השער |
| `TOGGLE` (`4`) | מתג בעל מצב יעד מפורש | `TOGGLE_GUEST_ON` או `TOGGLE_GUEST_OFF`; לא לנחש את המצב הנוכחי |
| `PUSH_BUTTON` (`5`) | לחיצה רגעית | `OPEN_GUEST` |

`dcf` של Dual הוא משפחת הפעולה המשותפת (`PULSE`, `PUSH_BUTTON`, `TOGGLE`), ו־`l1/l2` הם שמות שתי הפעולות בתצוגה. בתוך Group שומרים את `gc` של כל Gate ואת `dcf/l1/l2` של כל Dual. `dcf` לא מחליף את `gc` של שער פיזי. API ההזמנות אינו מקבל בקשת Toggle/ON/OFF; ה־Guest בוחר פעולה באפליקציה לפי הרשאות ופרוטוקול השער.

## מיפוי PMS → API → הזמנה

| PMS | API | payload לאפליקציה |
| --- | --- | --- |
| חדר/דירה/מתחם | `encryptedKeyValue` מתוך secret store של שרת השותף | `gate` / `gs` / `dcs` מהמפתח |
| reservation ID וגרסה | `externalReference` + `Idempotency-Key` ייחודי לגרסה | אינו שדה הרשאה |
| שם וטלפון אורח | `guest.name`, `guest.phone` | `gn`, `p`; `p` מחייב התאמת טלפון בייבוא |
| אימייל אורח | `guest.email` | למסירה אצל השותף בלבד, לא מועבר לאימות שער |
| check-in/out | `access.startsAt`, `access.endsAt` עם offset | `ss`, `se` ב־epoch milliseconds |
| קומה/חדר/חניה/הערה/רכב | `guest.floor/apartment/parking/comment/carNumber` | `fl/ap/pk/cm/car`, לפני ברירות המחדל של היעד |

השרת מוסיף `g=1`, `it="TB"`, `ti` (זמן הנפקה), `h/he/hn` מהמפתח בלבד. אין downgrade של תפקיד קיים ל־Guest בייבוא מרובה שערים. Gate לא תקין אחד מבטל את כל ייבוא ה־Dual/Group.

## Public API וסמנטיקת אוטומציה

`POST /v1/guest-invitations` הוא endpoint יחיד לשלושת היעדים. נדרשים `Authorization: Bearer`, `Content-Type: application/json`, `Idempotency-Key` באורך 16–128 תווים, `guest` ו־`access`. גוף עד 32KB; Host KEY עד 12KB; invite URL עד 16KB. חלון ההתחלה מותר עד 15 דקות בעבר או 730 ימים בעתיד; משך ההרשאה הוא דקה עד 365 ימים. תשובה מוצלחת היא `201` עם `invitationId`, `targetType`, `targetId`, חלון UTC ו־`inviteUrl`.

Retry זהה עם אותו API key ו־Idempotency-Key מחזיר את אותה תשובת `201`, כולל אותו קישור, ואינו צורך quota או חיוב נוסף. גוף שונה עם אותו key מחזיר `409 IDEMPOTENCY_CONFLICT`. אחסון idempotency חייב להיות **אטומי, עמיד ומוצפן** למשך 90 יום; שתי בקשות מקבילות חייבות להפיק קישור אחד. ה־PMS שולח event מה־backend שלו דרך adapter, מקשר חדר ל־Host KEY ב־secret store ומשתמש ב־reservation version כמפתח אידמפוטנטי.

עדכון תאריכים הוא הזמנה חדשה עם version ו־Idempotency-Key חדשים. הקישור הישן ממשיך לפעול בחלון המקורי. ביטול לפני מסירה עוצר את המסירה. אחרי מסירה אין ב־v1 ביטול ענני פרטני, כי השער עשוי להיות offline. ביטול Client API key מונע הנפקות חדשות בלבד.

## פורטל: Admin, Client Owner, Client Member

הכניסה דרך `wifigate.io/login/`; `GET /v1/me` מחזיר role ו־memberships. ה־UI מציג פעולות בהתאם, אך כל endpoint בודק הרשאה מחדש בשרת.

| Role | צפייה | פעולות | Reveal |
| --- | --- | --- | --- |
| `platform_admin` | כל הלקוחות, משתמשים, metadata, usage, entitlement ו־audit | יצירה/השעיה, שיוך, הנפקת key, rotate/revoke, quota | לעולם לא |
| `client_owner` | metadata ופעילות של הלקוח שלו | סינון וייצוא; lifecycle נשאר בידי Admin ב־v1 | רק key ש־`ownerUid` שלו תואם, אחרי MFA + reauth |
| `client_member` | keys ופעילות המשויכים אליו | צפייה בלבד | רק key פעיל שלו, אחרי MFA + reauth |

מסכי הפורטל צריכים את `GET /v1/me`, `GET /v1/portal/keys`, `POST /v1/portal/keys/{id}/reveal`, `GET /v1/portal/usage`, `GET /v1/portal/usage/export`. Admin צריך `/v1/admin/clients`, `/v1/admin/clients/{id}/members`, `/v1/admin/clients/{id}/keys`, `/v1/admin/keys/{id}/rotate|revoke`, `/v1/admin/entitlements`, `/v1/admin/usage`, `/v1/admin/audit`. יש להקפיא OpenAPI נפרד ל־management endpoints לפני בניית הפורטל; הם **עדיין לא ממומשים** בחבילה זו.

## מה כבר קיים בקוד ומה נדרש לפרודקשן

- `core.mjs` מממש פענוח ואימות Host KEY, בדיקת Gate/Dual/Group, מיפוי payload והצפנת invite URL. `http.mjs` מממש את public endpoint עם ממשקים חיצוניים חובה. `crypto.mjs` תואם ל־`src/inviteLinkCrypto.ts`. בדיקות ב־`core.test.mjs` כוללות תאימות הצפנה בין Node לספריית mobile.
- אפליקציית mobile כבר כוללת `buildGateWifigateHostKey`, `buildDualControlWifigateHostKey`, `buildGroupWifigateHostKey` ב־`src/linkService.ts`. יש לנעול golden vectors משותפים בין mobile ל־backend ולבדוק Android/iOS מול שער אמיתי לפני השקה.
- המפתח יוסיף adapters לפרודקשן: אימות Client API key בעזרת HMAC בזמן קבוע ו־pepper מנוהל, Firebase Auth ו־membership חי לפורטל, Firestore פרטי, Cloud KMS ל־Reveal, entitlement לכל systemId, rate limit ו־quota מבוזרים, idempotency אטומי, metering, audit append-only, retention ו־backup/restore. `createHostApiServer` נכשל בעת עלייה אם החיבורים החיוניים לא הוזרקו; אין credentials לדוגמה ואין fallback זיכרון לפרודקשן.
- לא לרשום ללוג Authorization, `encryptedKeyValue`, `inviteUrl`, `psk`, פרטי אורח או request body. להחזיר `Cache-Control: no-store`; להפריד production/staging במפתחות, בפרויקט ובמסד. ה־frontend אינו מקבל Client API key או Host KEY.

בדיקה מקומית: `node --test backend/host-api/core.test.mjs`. שרת ה־HTTP הוא מודול להזרקת adapters; אין להריץ אותו עם mock stores מול משתמשים אמיתיים.
