import {
  changePlatformProductAccess,
  getPayAccessOrganizations,
} from "./api/index.js";

const node = (tag, text, className) => {
  const value = document.createElement(tag);
  if (text) value.textContent = text;
  if (className) value.className = className;
  return value;
};
const products = ["host", "pay", "manager"];
const nameFor = (id) => `WIFIGATE ${id[0].toUpperCase() + id.slice(1)}`;

export function createPlatformAccountActions({
  user,
  language,
  ensureRecent,
  onChanged,
}) {
  const t = (he, en) => (language === "he" ? he : en);
  let dialog,
    closed = false;
  const message = (error) =>
    ({
      REGISTERED_USER_REQUIRED: t(
        "יש לבקש מהמשתמש להיכנס פעם אחת עם Google או Apple, ואז לנסות שוב.",
        "Ask this person to sign in once with Google or Apple, then try again.",
      ),
      IDENTITY_UNAVAILABLE: t(
        "נדרש חשבון מאומת ופעיל.",
        "An enabled, verified account is required.",
      ),
      IDENTITY_CONFLICT: t(
        "פרטי החשבון השתנו. רעננו את הרשימה לפני ניסיון נוסף.",
        "The account has changed. Refresh the list before trying again.",
      ),
      ADMIN_ACCESS_PROTECTED: t(
        "הרשאות מנהלים מוגנות. אי אפשר לשנות אותן באמצעות פעולה למסלול יחיד.",
        "Administrator roles are protected from single-product access changes.",
      ),
      SELF_ACCESS_PROTECTED: t(
        "אי אפשר לשנות את הגישה של עצמך כאן.",
        "You cannot change your own access here.",
      ),
      LAST_OWNER_PROTECTED: t(
        "יש להשאיר בעלים פעיל נוסף לארגון לפני ההסרה.",
        "Another active organization owner is required before removal.",
      ),
      PAY_ORGANIZATION_REQUIRED: t(
        "יש לבחור ארגון עם מסלול Pay פעיל.",
        "Choose an organization with active Pay access.",
      ),
      RESOURCE_NOT_FOUND: t(
        "החשבון לא נמצא. רעננו את הרשימה.",
        "The account was not found. Refresh the list.",
      ),
    })[error?.code] ||
    (error?.status === 403
      ? t(
          "נדרשת התחברות מחדש והרשאת מנהל פלטפורמה עם אימות דו־שלבי.",
          "Sign in again as a platform administrator with two-factor verification.",
        )
      : t(
          "הפעולה לא הושלמה. אפשר לנסות שוב.",
          "The action did not complete. You can try again.",
        ));

  function open(action, selectedProduct, person) {
    if (closed || dialog) return;
    const opener = document.activeElement;
    const modal = node("dialog", null, "platform-access-dialog");
    dialog = modal;
    const form = node("form");
    const heading = node(
      "h2",
      action === "remove"
        ? t("הסרת גישה ממסלול", "Remove product access")
        : t("הזמנת משתמש", "Invite a person"),
    );
    heading.id = "platform-access-dialog-title";
    modal.setAttribute("aria-labelledby", heading.id);
    const intro = node(
      "p",
      action === "remove"
        ? t(
            "הגישה למסלול שנבחר תיחסם. החשבון והנתונים יישמרו, והגישה למסלולים האחרים תישאר כפי שהיא.",
            "Access to the selected product will be blocked. The account and data will be kept, and other products will keep their current access.",
          )
        : t(
            "הגדירו גישת משתמש למסלול ושתפו איתו קישור כניסה. הפעולה אינה שולחת הודעת דוא״ל. ל־Manager ול־Pay נדרש חשבון שכבר נכנס פעם אחת.",
            "Set up user access and share a sign-in link. This action does not send email. Manager and Pay require an account that has signed in once.",
          ),
    );
    const email = node("input");
    email.type = "email";
    email.name = "email";
    email.required = true;
    email.maxLength = 254;
    email.dir = "ltr";
    email.autocomplete = "off";
    if (person) {
      email.value = person.email;
      email.readOnly = true;
    }
    const emailLabel = node("label", t("כתובת דוא״ל", "Email address"));
    emailLabel.append(email);
    const product = node("select");
    product.name = "product";
    product.required = true;
    const blank = node("option", t("בחירת מסלול", "Choose a product"));
    blank.value = "";
    product.append(blank);
    for (const id of products) {
      const option = node("option", nameFor(id));
      option.value = id;
      product.append(option);
    }
    product.value = products.includes(selectedProduct) ? selectedProduct : "";
    const productLabel = node("label", t("מסלול", "Product"));
    productLabel.append(product);
    const organization = node("select");
    organization.name = "organizationId";
    const organizationLabel = node("label", t("ארגון Pay", "Pay organization"));
    organizationLabel.append(organization);
    const feedback = node("p", null, "platform-access-feedback");
    feedback.setAttribute("role", "status");
    const scope = node("p", null, "platform-access-scope");
    const cancel = node(
      "button",
      t("ביטול", "Cancel"),
      "platform-access-cancel",
    );
    cancel.type = "button";
    const submit = node(
      "button",
      action === "remove"
        ? t("אישור הסרה", "Confirm removal")
        : t("הגדרת גישה", "Set up access"),
      action === "remove" ? "platform-access-remove" : "platform-access-submit",
    );
    submit.type = "submit";
    const buttons = node("div", null, "platform-access-buttons");
    buttons.append(cancel, submit);
    form.append(
      heading,
      intro,
      emailLabel,
      productLabel,
      organizationLabel,
      scope,
      feedback,
      buttons,
    );
    modal.append(form);
    document.body.append(modal);
    let busy = false,
      finished = false,
      organizations,
      orgGeneration = 0,
      fingerprint,
      key;
    const live = () => !closed && dialog === modal && modal.open;
    function close() {
      if (busy) return;
      modal.close();
    }
    modal.addEventListener("close", () => {
      orgGeneration++;
      modal.remove();
      if (dialog === modal) dialog = null;
      if (opener?.isConnected) opener.focus();
    });
    modal.addEventListener("cancel", (event) => {
      if (busy) event.preventDefault();
    });
    cancel.addEventListener("click", close);
    async function updateProduct() {
      const epoch = ++orgGeneration;
      const pay = action === "invite" && product.value === "pay";
      organizationLabel.hidden = !pay;
      organization.required = pay;
      scope.textContent = product.value
        ? action === "remove"
          ? t(
              `הסרת ${email.value} מ־${nameFor(product.value)} בלבד.`,
              `Remove ${email.value} from ${nameFor(product.value)} only.`,
            )
          : product.value === "pay"
            ? t(
                "משתמש חדש יקבל גישת צפייה בארגון. למשתמש קיים תישמר ההרשאה שלו.",
                "A new member receives viewer access. An existing member keeps their role.",
              )
            : t(
                `גישה כמשתמש ב־${nameFor(product.value)}.`,
                `User access to ${nameFor(product.value)}.`,
              )
        : "";
      if (action === "remove" && product.value) {
        const address = node("bdi", email.value),
          plan = node("bdi", nameFor(product.value));
        address.dir = "ltr";
        plan.dir = "ltr";
        scope.replaceChildren(
          document.createTextNode(t("הסרת ", "Remove ")),
          address,
          document.createTextNode(t(" מ־", " from ")),
          plan,
          document.createTextNode(t(" בלבד.", " only.")),
        );
      }
      if (!pay) {
        submit.disabled = false;
        feedback.textContent = "";
        return;
      }
      organization.replaceChildren();
      submit.disabled = true;
      feedback.textContent = t(
        "טוען ארגוני Pay…",
        "Loading Pay organizations…",
      );
      try {
        organizations ??= await getPayAccessOrganizations(user);
        if (!live() || epoch !== orgGeneration) return;
        for (const item of organizations.items) {
          const option = node("option", item.name);
          option.value = item.id;
          organization.append(option);
        }
        submit.disabled = !organizations.items.length;
        feedback.textContent = organizations.items.length
          ? ""
          : t(
              "אין כרגע ארגונים עם מסלול Pay פעיל.",
              "There are currently no organizations with active Pay access.",
            );
      } catch {
        if (live() && epoch === orgGeneration)
          feedback.textContent = t(
            "טעינת הארגונים נכשלה. בחרו מסלול אחר וחזרו ל־Pay כדי לנסות שוב.",
            "Organizations could not load. Choose another product and return to Pay to retry.",
          );
      }
    }
    product.addEventListener("change", () => void updateProduct());
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (busy || finished || !form.reportValidity()) return;
      const input = {
        action,
        email: email.value.trim().toLowerCase(),
        product: product.value,
        ...(action === "invite" && product.value === "pay"
          ? { organizationId: organization.value }
          : {}),
      };
      const signature = JSON.stringify(input);
      if (signature !== fingerprint) {
        fingerprint = signature;
        key = crypto.randomUUID();
      }
      busy = true;
      modal.setAttribute("aria-busy", "true");
      for (const control of form.querySelectorAll("input,select,button"))
        control.disabled = true;
      feedback.textContent = t(
        "מאמת הרשאה ומעדכן גישה…",
        "Verifying permission and updating access…",
      );
      try {
        await ensureRecent();
        if (!live()) return;
        await changePlatformProductAccess(user, input, key);
        if (!live()) return;
        finished = true;
        busy = false;
        onChanged(
          t(
            "הגישה עודכנה במסלול שנבחר.",
            "Access was updated for the selected product.",
          ),
        );
        if (action === "remove") {
          modal.close();
          return;
        }
        const url = new URL(`/dashboard/${input.product}/`, location.origin);
        if (language === "he") url.searchParams.set("lang", "he");
        const link = node("input");
        link.value = url.href;
        link.readOnly = true;
        link.dir = "ltr";
        link.setAttribute(
          "aria-label",
          t("קישור כניסה לשיתוף", "Sign-in link to share"),
        );
        const copy = node("button", t("העתקת קישור", "Copy link"));
        copy.type = "button";
        copy.addEventListener("click", async () => {
          try {
            await navigator.clipboard.writeText(link.value);
            copy.textContent = t("הקישור הועתק", "Link copied");
          } catch {
            link.select();
          }
        });
        feedback.textContent = t(
          "הגישה הוגדרה. שתפו את קישור הכניסה עם המשתמש; לא נשלחה הודעת דוא״ל.",
          "Access is ready. Share the sign-in link with this person; no email was sent.",
        );
        scope.replaceChildren(link, copy);
        submit.hidden = true;
        cancel.textContent = t("סגירה", "Close");
        cancel.focus();
      } catch (error) {
        if (live()) feedback.textContent = message(error);
      } finally {
        busy = false;
        if (live()) {
          modal.setAttribute("aria-busy", "false");
          for (const control of form.querySelectorAll("input,select,button"))
            control.disabled =
              finished && control !== cancel && !scope.contains(control);
        }
      }
    });
    modal.showModal();
    void updateProduct();
    (person ? product : email).focus();
  }
  return {
    invite(product) {
      open("invite", product);
    },
    remove(person, product) {
      open("remove", product, person);
    },
    close() {
      closed = true;
      if (dialog) {
        dialog.close();
        dialog.remove();
        dialog = null;
      }
    },
  };
}
