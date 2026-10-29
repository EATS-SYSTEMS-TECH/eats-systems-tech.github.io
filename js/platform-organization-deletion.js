import { deletePlatformOrganization } from "./api/index.js";
export function createPlatformOrganizationDeletion({
  user,
  language,
  ensureRecent,
  onChanged,
}) {
  const t = (he, en) => (language === "he" ? he : en);
  const node = (tag, text) => {
    const el = document.createElement(tag);
    if (text) el.textContent = text;
    return el;
  };
  let dialog,
    closed = false;
  return {
    open(organization) {
      if (closed || dialog) return;
      const opener = document.activeElement,
        modal = node("dialog"),
        form = node("form");
      dialog = modal;
      modal.className = "platform-access-dialog platform-account-delete-dialog";
      const title = node("h2", t("מחיקת ארגון", "Delete organization"));
      title.id = "platform-delete-organization-title";
      modal.setAttribute("aria-labelledby", title.id);
      const target = node("p", organization.name);
      target.className = "platform-delete-target";
      const warning = node(
        "p",
        t(
          "הארגון יוסר מכל מסלולי WIFIGATE המשויכים אליו, הגישה אליו תיסגר והמנויים שלו יבוטלו. הפעולה חלה על הארגון כולו, גם כאשר נבחר מסלול מסוים.",
          "This organization will be removed from every linked WIFIGATE product. Its access will close and its subscriptions will be cancelled. This affects the whole organization, even when a single product is selected.",
        ),
      );
      warning.className = "platform-delete-warning";
      const retention = node(
        "p",
        t(
          "חשבונות המשתמשים, המערכות האישיות והיסטוריית החיוב נשמרים. אם משויכות לארגון מערכות, יש לנתק אותן קודם דרך המסלול המתאים. אין אפשרות לשחזור הארגון מתוך הממשק.",
          "User accounts, personal systems and billing history are retained. Linked systems must be unassigned first through their product workspace. The organization cannot be restored from this interface.",
        ),
      );
      const label = node(
          "label",
          t(
            "לאישור, הקלידו את שם הארגון",
            "To confirm, type the organization name",
          ),
        ),
        input = node("input");
      input.name = "confirmName";
      input.required = true;
      input.maxLength = 120;
      input.autocomplete = "off";
      label.append(input);
      const feedback = node("p");
      feedback.className = "platform-access-feedback";
      feedback.setAttribute("role", "status");
      const cancel = node("button", t("ביטול", "Cancel")),
        submit = node("button", t("מחיקת הארגון", "Delete organization"));
      cancel.type = "button";
      submit.type = "submit";
      submit.className = "platform-access-remove";
      const buttons = node("div");
      buttons.className = "platform-access-buttons";
      buttons.append(cancel, submit);
      form.append(title, target, warning, retention, label, feedback, buttons);
      modal.append(form);
      document.body.append(modal);
      let busy = false;
      const key = crypto.randomUUID(),
        live = () => !closed && dialog === modal && modal.open;
      const update = () =>
        (submit.disabled = busy || input.value !== organization.name);
      input.addEventListener("input", update);
      cancel.addEventListener("click", () => {
        if (!busy) modal.close();
      });
      modal.addEventListener("cancel", (event) => {
        if (busy) event.preventDefault();
      });
      modal.addEventListener("close", () => {
        modal.remove();
        if (dialog === modal) dialog = null;
        if (opener?.isConnected) opener.focus();
      });
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        update();
        if (submit.disabled || !form.reportValidity()) return;
        busy = true;
        modal.setAttribute("aria-busy", "true");
        input.disabled = true;
        cancel.disabled = true;
        update();
        feedback.textContent = t(
          "מאמתים הרשאה ומסירים את הארגון…",
          "Verifying permission and removing the organization…",
        );
        try {
          await ensureRecent();
          if (!live()) return;
          await deletePlatformOrganization(
            user,
            organization.id,
            {
              confirmName: input.value,
              expectedVersion: organization.version ?? 0,
            },
            key,
          );
          if (!live()) return;
          busy = false;
          modal.close();
          onChanged(
            t(
              "הארגון הוסר והמנויים שלו בוטלו.",
              "The organization was removed and its subscriptions were cancelled.",
            ),
          );
        } catch (error) {
          if (live())
            feedback.textContent =
              error?.code === "ORGANIZATION_HAS_SYSTEMS"
                ? t(
                    "לא בוצעה מחיקה. יש לנתק תחילה את המערכות המשויכות לארגון דרך סביבת העבודה המתאימה, ואז לנסות שוב.",
                    "Nothing was deleted. First unassign the linked systems through their product workspace, then try again.",
                  )
                : error?.code === "ORGANIZATION_CHANGED"
                  ? t(
                      "פרטי הארגון השתנו. סגרו את החלון ורעננו את הרשימה לפני מחיקה.",
                      "The organization changed. Close this dialog and refresh before deleting.",
                    )
                  : error?.status === 403
                    ? t(
                        "נדרשת הרשאת WIFIGATE Admin והתחברות עדכנית עם אימות דו־שלבי.",
                        "A WIFIGATE Admin with a recent two-factor sign-in is required.",
                      )
                    : t(
                        "לא ניתן להשלים את המחיקה. אפשר לנסות שוב.",
                        "Deletion could not be completed. You can retry.",
                      );
        } finally {
          busy = false;
          if (live()) {
            modal.setAttribute("aria-busy", "false");
            input.disabled = false;
            cancel.disabled = false;
            update();
          }
        }
      });
      update();
      modal.showModal();
      input.focus();
    },
    destroy() {
      closed = true;
      if (dialog) {
        dialog.close();
        dialog.remove();
        dialog = null;
      }
    },
  };
}
