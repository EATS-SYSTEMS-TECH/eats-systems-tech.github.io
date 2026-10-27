import { previewPlatformAccountDeletion, deletePlatformAccount } from "./api/index.js";

const node = (tag, text, className) => {
  const value = document.createElement(tag);
  if (text) value.textContent = text;
  if (className) value.className = className;
  return value;
};

export function createPlatformAccountDeletion({user, language, ensureRecent, onChanged}) {
  const t = (he, en) => language === "he" ? he : en;
  let dialog, closed = false;
  const errorMessage = error => ({
    SELF_ACCESS_PROTECTED: t("אי אפשר למחוק את החשבון שממנו אתם מנהלים את הפלטפורמה.", "You cannot delete the account you are using to manage the platform."),
    IDENTITY_CONFLICT: t("פרטי החשבון השתנו. סגרו את החלון ורעננו את הרשימה.", "The account changed. Close this dialog and refresh the list."),
    ACCOUNT_DELETION_REVIEW_REQUIRED: t("לחשבון זה נדרשת בדיקת תמיכה לפני מחיקה. לא בוצעה מחיקה חלקית.", "This account needs a support review before deletion. No partial cleanup was performed."),
    ACCOUNT_DELETION_INCOMPLETE: t("הגישה והנתונים בענן הוסרו. נסו שוב כדי להשלים את הסרת ההתחברות.", "Cloud access and data were removed. Retry to finish removing the sign-in."),
  }[error?.code] || (error?.status === 403
    ? t("נדרשת הרשאת WIFIGATE Admin והתחברות עדכנית עם אימות דו־שלבי.", "A WIFIGATE Admin with a recent two-factor sign-in is required.")
    : t("המחיקה לא הושלמה. אפשר לנסות שוב.", "Deletion did not complete. You can try again.")));

  return {
    open(person) {
      if (closed || dialog) return;
      const opener = document.activeElement;
      const modal = node("dialog", null, "platform-access-dialog platform-account-delete-dialog");
      dialog = modal;
      const form = node("form");
      const heading = node("h2", t("מחיקת חשבון לצמיתות", "Permanently delete account"));
      heading.id = "platform-account-delete-title";
      modal.setAttribute("aria-labelledby", heading.id);
      const address = node("bdi", person.email); address.dir = "ltr";
      const target = node("p", null, "platform-delete-target"); target.append(address);
      const warning = node("p", t("החשבון יוסר מכל שירותי WIFIGATE, והמסלולים והמנויים השייכים לו יבוטלו אוטומטית. ההתחברות והמערכות האישיות בענן יימחקו. אי אפשר לבטל פעולה זו.", "The account will be removed from all WIFIGATE services, and its plans and subscriptions will be cancelled automatically. Its sign-in and personal cloud systems will be deleted. This cannot be undone."), "platform-delete-warning");
      const retention = node("p", t("מידע של ארגונים משותפים והיסטוריית חיוב נשמרים. הפעולה אינה מוחקת נתונים מקומיים במכשירים ואינה מבטלת מפתחות שכבר הועברו לחומרה.", "Shared organization data and billing history are retained. This does not erase local device data or revoke keys already delivered to hardware."));
      const feedback = node("p", t("בודק את החשבון והמנויים…", "Checking the account and subscriptions…"), "platform-access-feedback");
      feedback.setAttribute("role", "status");
      const impact = node("p", null, "platform-delete-impact");
      const input = node("input");
      input.type = "email"; input.name = "confirmEmail"; input.required = true;
      input.autocomplete = "off"; input.dir = "ltr"; input.maxLength = 254;
      const label = node("label", t("להמשך, הקלידו את כתובת הדוא״ל של החשבון", "To continue, type this account's email address")); label.append(input);
      const cancel = node("button", t("ביטול", "Cancel")); cancel.type = "button";
      const submit = node("button", t("מחיקת החשבון וכל המנויים שלו", "Delete account and all its subscriptions"), "platform-access-remove");
      submit.type = "submit"; submit.disabled = true;
      const buttons = node("div", null, "platform-access-buttons"); buttons.append(cancel, submit);
      form.append(heading,target,warning,retention,impact,label,feedback,buttons); modal.append(form); document.body.append(modal);
      let busy = false, preview, finished = false;
      const key = crypto.randomUUID();
      const live = () => !closed && dialog === modal && modal.open;
      const update = () => submit.disabled = busy || finished || !preview || input.value.trim().toLowerCase() !== person.email.toLowerCase();
      input.addEventListener("input",update);
      cancel.addEventListener("click", () => { if (!busy) modal.close(); });
      modal.addEventListener("cancel", event => { if (busy) event.preventDefault(); });
      modal.addEventListener("close", () => { modal.remove(); if (dialog === modal) dialog = null; if (opener?.isConnected) opener.focus(); });
      form.addEventListener("submit", async event => {
        event.preventDefault(); update();
        if (submit.disabled || !form.reportValidity()) return;
        busy = true; modal.setAttribute("aria-busy","true"); input.disabled = true; cancel.disabled = true; update();
        feedback.textContent = t("מאמת הרשאה ומוחק את החשבון…", "Verifying permission and deleting the account…");
        try {
          await ensureRecent(); if (!live()) return;
          await deletePlatformAccount(user,{email:person.email.toLowerCase(),confirmEmail:input.value.trim().toLowerCase(),targetUid:preview.targetUid},key);
          if (!live()) return;
          finished = true; busy = false; modal.close();
          onChanged(t("החשבון הוסר מכל שירותי WIFIGATE והמסלולים שלו בוטלו.", "The account was removed from WIFIGATE services and its plans were cancelled."));
        } catch(error) { if (live()) feedback.textContent = errorMessage(error); }
        finally { busy = false; if (live()) { modal.setAttribute("aria-busy","false"); input.disabled = false; cancel.disabled = false; update(); } }
      });
      modal.showModal(); modal.setAttribute("aria-busy","true"); input.focus();
      void previewPlatformAccountDeletion(user,person.email.toLowerCase()).then(value => {
        if (!live()) return;
        preview = value;
        impact.textContent = t(`ארגונים שייסגרו: ${value.closingOrganizations.length}. חברויות שיוסרו: ${value.memberships}. מערכות אישיות שיוסרו: ${value.mySystems ?? 0}.`, `Organizations closing: ${value.closingOrganizations.length}. Memberships removed: ${value.memberships}. Personal systems removed: ${value.mySystems ?? 0}.`);
        feedback.textContent = "";
      }).catch(error => { if (live()) feedback.textContent = errorMessage(error); }).finally(() => { if (live()) {modal.setAttribute("aria-busy","false");update();} });
    },
    close() { closed = true; if (dialog) {dialog.close();dialog.remove();dialog = null;} },
  };
}
