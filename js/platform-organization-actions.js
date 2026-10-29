import { createPlatformOrganization, managerRequest } from "./api/index.js";

export function createPlatformOrganizationActions({
  user,
  language,
  ensureRecent,
  onChanged,
}) {
  const t = (he, en) => (language === "he" ? he : en);
  let dialog,
    closed = false;
  const node = (tag, text) => {
    const el = document.createElement(tag);
    if (text) el.textContent = text;
    return el;
  };
  return {
    open(product = "all") {
      if (closed || dialog) return;
      const opener = document.activeElement;
      const modal = node("dialog");
      dialog = modal;
      modal.className = "platform-access-dialog";
      const form = node("form"),
        title = node("h2", t("יצירת ארגון חדש", "Create organization"));
      title.id = "platform-create-organization-title";
      modal.setAttribute("aria-labelledby", title.id);
      form.append(
        title,
        node(
          "p",
          t(
            "בחרו מסלול והגדירו את הארגון. הפעולה אינה שולחת הזמנות ואינה מפעילה סליקה.",
            "Choose a product and set up the organization. This does not send invitations or collect payments.",
          ),
        ),
      );
      const field = (label, input) => {
        const wrapper = node("label", label);
        wrapper.append(input);
        form.append(wrapper);
        return wrapper;
      };
      const products = node("select");
      products.name = "product";
      for (const id of ["manager", "pay", "host"]) {
        const option = node(
          "option",
          "WIFIGATE " + id[0].toUpperCase() + id.slice(1),
        );
        option.value = id;
        products.append(option);
      }
      if (product !== "all") products.value = product;
      field(t("מסלול", "Product"), products);
      const name = node("input");
      name.name = "name";
      name.required = true;
      name.maxLength = 100;
      field(t("שם הארגון", "Organization name"), name);
      const email = node("input");
      email.name = "email";
      email.type = "email";
      email.maxLength = 254;
      email.dir = "ltr";
      const owner = field(
        t(
          "אימייל בעל חשבון Manager פעיל",
          "Active Manager account owner email",
        ),
        email,
      );
      const ownership = node("p");
      form.append(ownership);
      const update = () => {
        const manager = products.value === "manager";
        owner.hidden = !manager;
        email.required = manager;
        email.disabled = !manager;
        ownership.textContent = manager
          ? t(
              "הארגון ישויך לחשבון Manager הקיים של הבעלים שתבחרו. שלושת הארגונים הראשונים כלולים; כל ארגון נוסף מוסיף $1 לאומדן החודשי. מנהלי WIFIGATE פטורים.",
              "The organization belongs to the selected owner’s existing Manager account. The first three organizations are included; each additional organization adds $1 to the monthly estimate. WIFIGATE administrators are exempt.",
            )
          : t(
              "הארגון ייווצר בבעלות החשבון שלכם. אפשר להוסיף אנשים לאחר היצירה.",
              "The organization will be owned by your account. People can be added after creation.",
            );
      };
      products.addEventListener("change", update);
      update();
      const status = node("p");
      status.setAttribute("role", "status");
      status.setAttribute("aria-live", "polite");
      form.append(status);
      const controls = node("div");
      controls.className = "platform-access-dialog-actions";
      const cancel = node("button", t("ביטול", "Cancel"));
      cancel.type = "button";
      const submit = node("button", t("יצירת ארגון", "Create organization"));
      submit.type = "submit";
      controls.append(cancel, submit);
      form.append(controls);
      modal.append(form);
      let busy = false,
        key = crypto.randomUUID(),
        fingerprint = "";
      const close = () => {
        if (busy) return;
        modal.close();
        modal.remove();
        dialog = null;
        if (opener?.isConnected) opener.focus();
      };
      cancel.addEventListener("click", close);
      modal.addEventListener("cancel", (e) => {
        e.preventDefault();
        close();
      });
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (busy || !form.reportValidity()) return;
        const input = {
          product: products.value,
          name: name.value.trim(),
          email: email.value.trim().toLowerCase(),
        };
        if (!input.name) {
          name.focus();
          return;
        }
        const next = JSON.stringify(input);
        if (fingerprint && fingerprint !== next) key = crypto.randomUUID();
        fingerprint = next;
        busy = true;
        submit.disabled = true;
        cancel.disabled = true;
        products.disabled = true;
        name.disabled = true;
        email.disabled = true;
        modal.setAttribute("aria-busy", "true");
        status.textContent = t("יוצרים את הארגון…", "Creating organization…");
        try {
          await ensureRecent();
          if (closed) return;
          const result =
            input.product === "manager"
              ? await managerRequest(
                  user,
                  "/api/v1/manager/admin/organizations",
                  "POST",
                  { name: input.name, email: input.email, requestId: key },
                )
              : await createPlatformOrganization(
                  user,
                  {
                    product: input.product,
                    name: input.name,
                    timezone:
                      Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
                  },
                  key,
                );
          if (closed) return;
          busy = false;
          close();
          await onChanged({
            product: input.product,
            id: result.organization?.id ?? result.id,
          });
        } catch (error) {
          status.textContent =
            error.status === 404 && input.product === "pay"
              ? t(
                  "יצירת ארגון Pay ממתינה לפריסת עדכון השרת. לא נוצר ארגון.",
                  "Pay organization creation awaits the server deployment. No organization was created.",
                )
              : t(
                  "הארגון לא נוצר או שלא התקבל אישור. בדקו שם ובעל חשבון פעיל ונסו שוב; ניסיון חוזר שומר על אותה בקשה.",
                  "Creation was not confirmed. Check the name and active owner account, then retry; the same request is retained.",
                );
        } finally {
          busy = false;
          submit.disabled = false;
          cancel.disabled = false;
          products.disabled = false;
          name.disabled = false;
          email.disabled = products.value !== "manager";
          modal.removeAttribute("aria-busy");
        }
      });
      document.body.append(modal);
      modal.showModal();
      name.focus();
    },
    destroy() {
      closed = true;
      dialog?.close();
      dialog?.remove();
      dialog = null;
    },
  };
}
