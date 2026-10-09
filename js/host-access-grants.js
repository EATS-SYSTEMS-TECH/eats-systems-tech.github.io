import { hostText, hostLocale } from "./host-locale.js";
import { portalRequest } from "./api/index.js";
import { node } from "./host-ui.js";

const messages = {
  GATE_DELEGATION_REQUIRED: hostText(
    "Connect each gate to Host from a live administrator session in the app before issuing guest access.",
  ),
  SYSTEM_UNAVAILABLE: hostText(
    "An access system changed. Reload the reservation and check its systems.",
  ),
  VERSION_CONFLICT: hostText(
    "This reservation changed. Reload it before issuing or revealing access.",
  ),
  RESERVATION_NOT_CONFIRMED: hostText(
    "Access is available for confirmed reservations only.",
  ),
  ACCESS_EXPIRED: hostText("This access window has expired."),
  TENANT_ACCESS_DENIED: hostText(
    "Your organization permissions changed. Refresh your account.",
  ),
};
export async function renderHostAccessGrants({
  container,
  user,
  organization,
  reservation,
  isCurrent,
}) {
  const section = node("section", undefined, { "aria-label": "Guest access" });
  const status = node("p", hostText("Loading guest access…"), {
    role: "status",
    "aria-live": "polite",
  });
  const list = node("div");
  const canWrite = ["owner", "admin", "staff"].includes(
    organization.membership.role,
  );
  const root = `/api/v1/organizations/${encodeURIComponent(organization.id)}`;
  const path = `${root}/reservations/${encodeURIComponent(reservation.id)}/access-grants`;
  section.append(
    node("h3", hostText("Guest access")),
    node(
      "p",
      hostText(
        "Cancelling or changing a reservation stops future delivery and link disclosure. A credential already imported into a guest phone can remain usable offline until its effective expiry.",
      ),
    ),
    status,
    list,
  );
  container.append(section);
  const current = () => isCurrent() && section.isConnected;
  const issueKey = crypto.randomUUID();
  const revealKeys = new Map();
  const issue = node("button", hostText("Issue guest access"), {
    type: "button",
  });
  if (canWrite && ["confirmed", "changed"].includes(reservation.status)) {
    section.append(
      node(
        "p",
        hostText(
          "New guest access is limited to 31 days including grace. Existing access history remains available.",
        ),
      ),
      issue,
    );
  }
  async function load(cursor, append = false) {
    const response = await portalRequest(
      user,
      `${path}?${new URLSearchParams({ limit: "50", ...(cursor ? { cursor } : {}) })}`,
    );
    if (!current()) return;
    if (!append) list.replaceChildren();
    for (const grant of response.items) {
      const item = node("article");
      item.append(
        node(
          "p",
          hostText("Access {p0} · Reservation version {p1}", {
            p0: hostText(grant.status),
            p1: grant.reservationVersion,
          }),
        ),
        node(
          "p",
          hostText("Effective access: {p0} → {p1}", {
            p0: new Date(grant.effectiveStartsAt).toLocaleString(),
            p1: new Date(grant.effectiveEndsAt).toLocaleString(),
          }),
        ),
      );
      if (grant.revealedAt)
        item.append(
          node(
            "p",
            hostText(
              "This link has been disclosed. An imported credential expires at the effective end shown above.",
            ),
          ),
        );
      if (canWrite && grant.status === "issued") {
        const reveal = node("button", hostText("Reveal private guest links"), {
          type: "button",
        });
        const output = node("div");
        item.append(reveal, output);
        reveal.addEventListener("click", async () => {
          if (reveal.disabled || !current()) return;
          reveal.disabled = true;
          status.textContent = hostText("Checking current access permissions…");
          try {
            if (!revealKeys.has(grant.id))
              revealKeys.set(grant.id, crypto.randomUUID());
            const result = await portalRequest(
              user,
              `${root}/access-grants/${encodeURIComponent(grant.id)}/reveal`,
              "POST",
              {},
              revealKeys.get(grant.id),
            );
            if (!current()) return;
            output.replaceChildren();
            for (const link of result.links) {
              const label = node("label", hostText("Private guest link"));
              const box = node("textarea", link.url, {
                readonly: "",
                "aria-label": "Private guest link",
                rows: "3",
              });
              label.append(box);
              output.append(label);
              const copy = node("button", hostText("Copy guest link"), {
                type: "button",
              });
              copy.addEventListener("click", async () => {
                try {
                  await navigator.clipboard.writeText(link.url);
                  if (current())
                    status.textContent = hostText("Guest link copied.");
                } catch {
                  if (current())
                    status.textContent = hostText(
                      "Select the private link and copy it.",
                    );
                }
              });
              output.append(copy);
            }
            const hide = node("button", hostText("Hide private links"), {
              type: "button",
            });
            hide.addEventListener("click", () => output.replaceChildren());
            output.append(hide);
            status.textContent = hostText(
              "Share privately with this guest. Offline access ends at the effective expiry.",
            );
          } catch (error) {
            if (current())
              status.textContent =
                messages[error.code] ||
                hostText("Guest links could not be revealed. Retry safely.");
          } finally {
            if (current()) reveal.disabled = false;
          }
        });
      }
      list.append(item);
    }
    status.textContent = response.items.length
      ? hostText("Access history loaded.")
      : hostText("No guest access issued for this reservation.");
    if (response.nextCursor) {
      const more = node("button", hostText("Load more access history"), {
        type: "button",
      });
      more.addEventListener("click", async () => {
        more.disabled = true;
        try {
          await load(response.nextCursor, true);
          more.remove();
        } catch {
          if (current()) {
            more.disabled = false;
            status.textContent = hostText(
              "Access history could not be loaded.",
            );
          }
        }
      });
      list.append(more);
    }
  }
  issue.addEventListener("click", async () => {
    if (issue.disabled || !current()) return;
    issue.disabled = true;
    status.textContent = hostText("Issuing signed guest access…");
    try {
      await portalRequest(
        user,
        path,
        "POST",
        { reservationVersion: reservation.version },
        issueKey,
      );
      if (current()) await load();
    } catch (error) {
      if (current())
        status.textContent =
          messages[error.code] ||
          hostText("Guest access could not be issued. Retry safely.");
    } finally {
      if (current()) issue.disabled = false;
    }
  });
  try {
    await load();
  } catch (error) {
    if (current())
      status.textContent =
        messages[error.code] ||
        hostText("Guest access history could not be loaded.");
  }
}
