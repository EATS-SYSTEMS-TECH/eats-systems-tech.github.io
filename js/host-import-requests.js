import { hostText, hostLocale } from "./host-locale.js";
import { portalRequest } from "./api/index.js";
import { field, node } from "./host-ui.js";
export async function renderHostImportRequests({
  container,
  user,
  organization,
  isCurrent,
  onConnected,
}) {
  if (!["owner", "admin"].includes(organization.membership.role)) return;
  const root = `/api/v1/organizations/${encodeURIComponent(organization.id)}/systems/import-requests`,
    section = node("section", undefined, {
      "aria-label": "System import approvals",
    }),
    status = node("p", hostText("Loading system import requests…"), {
      role: "status",
      "aria-live": "polite",
    }),
    rows = node("div");
  section.append(
    node("h2", hostText("System import approvals")),
    node(
      "p",
      hostText(
        "Review the requester's property mapping and gate ownership before approving. Every gate requires a verified local administrator proof; approval rechecks live membership and ownership.",
      ),
    ),
    status,
    rows,
  );
  container.append(section);
  const current = () => isCurrent() && section.isConnected;
  const attempts = new Map();
  let busy = true,
    loadGeneration = 0;
  const setBusy = (value) => {
    busy = value;
    for (const control of section.querySelectorAll("input, button"))
      control.disabled = value;
  };
  async function load(cursor, append = false) {
    const request = ++loadGeneration;
    const result = await portalRequest(
      user,
      `${root}?${new URLSearchParams({ limit: "50", ...(cursor ? { cursor } : {}) })}`,
    );
    if (!current() || request !== loadGeneration) return;
    if (!append) rows.replaceChildren();
    for (const item of result.items) {
      const row = node("article");
      row.append(
        node(
          "p",
          hostText(
            "{p0} · requester {p1} · {p2} physical gates · {p3} · expires {p4}",
            {
              p0: item.id,
              p1: item.requesterUid,
              p2: item.gateCount,
              p3: hostText(item.status),
              p4: item.expiresAt,
            },
          ),
        ),
        node(
          "p",
          hostText("Target {p0} / {p1} · property {p2} · room {p3}", {
            p0: item.targetType,
            p1: item.targetId,
            p2: item.propertyId,
            p3: item.roomId ?? "Whole property",
          }),
        ),
      );
      if (
        item.status === "pending" &&
        Date.parse(item.expiresAt) > Date.now()
      ) {
        const form = node("form"),
          reason = field(form, "Import review reason", "reason");
        reason.minLength = 5;
        reason.maxLength = 200;
        reason.disabled = busy;
        for (const action of ["approve", "reject"]) {
          const button = node(
            "button",
            action === "approve"
              ? hostText("Approve system import")
              : hostText("Reject system import"),
            { type: "button" },
          );
          button.disabled = busy;
          form.append(button);
          button.addEventListener("click", async () => {
            if (busy) {
              status.textContent = hostText(
                "Another import review is in progress. Try again when it finishes.",
              );
              return;
            }
            if (!current()) return;
            if (!form.reportValidity()) {
              status.textContent = hostText(
                "Enter a review reason of 5 to 200 characters.",
              );
              return;
            }
            setBusy(true);
            const body = { version: item.version, reason: reason.value },
              signature = `${item.id}:${action}:${JSON.stringify(body)}`;
            if (!attempts.has(signature))
              attempts.set(signature, crypto.randomUUID());
            try {
              await portalRequest(
                user,
                `${root}/${encodeURIComponent(item.id)}/${action}`,
                "POST",
                body,
                attempts.get(signature),
              );
              if (current()) {
                await load();
                status.textContent =
                  action === "approve"
                    ? hostText(
                        "System import approved and connected atomically.",
                      )
                    : hostText(
                        "System import rejected. No gate ownership was changed.",
                      );
                if (action === "approve" && current()) await onConnected?.();
              }
            } catch {
              if (current())
                status.textContent = hostText(
                  "Import review failed. Refresh and verify membership, ownership, expiry and TOTP before retrying.",
                );
            } finally {
              if (current()) setBusy(false);
            }
          });
        }
        form.addEventListener("submit", (event) => event.preventDefault());
        row.append(form);
      }
      rows.append(row);
    }
    if (result.nextCursor) {
      const more = node(
        "button",
        hostText("Load more system import requests"),
        { type: "button" },
      );
      more.disabled = busy;
      more.addEventListener("click", async () => {
        if (busy) return;
        setBusy(true);
        try {
          await load(result.nextCursor, true);
          if (current()) more.remove();
        } catch {
          if (current())
            status.textContent = hostText("Unable to load more requests.");
        } finally {
          if (current()) setBusy(false);
        }
      });
      rows.append(more);
    }
    status.textContent = result.items.length
      ? hostText("System import requests loaded.")
      : hostText("No system import requests.");
  }
  const refresh = node("button", hostText("Refresh system import requests"), {
    type: "button",
    disabled: "",
  });
  refresh.addEventListener("click", async () => {
    if (busy) return;
    setBusy(true);
    try {
      await load();
    } catch {
      if (current())
        status.textContent = hostText("Unable to refresh requests.");
    } finally {
      if (current()) setBusy(false);
    }
  });
  section.append(refresh);
  try {
    await load();
  } finally {
    if (current()) setBusy(false);
  }
}
