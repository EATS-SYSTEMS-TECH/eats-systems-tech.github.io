import { portalRequest } from "./api/index.js";
import { field, node } from "./host-ui.js";
export async function renderHostIntegrations({
  container,
  user,
  organization,
  properties,
  rooms,
  isCurrent,
  includeMappings = true,
  includeEvents = true,
}) {
  const manager = ["owner", "admin"].includes(organization.membership.role);
  if (!manager && organization.membership.role !== "staff") return;
  const root = `/api/v1/organizations/${encodeURIComponent(organization.id)}/integrations`;
  const section = node("section", undefined, {
      "aria-label": "Reservation integrations",
    }),
    status = node("p", "Loading integration events…", {
      role: "status",
      "aria-live": "polite",
    }),
    events = node("div");
  section.append(
    node("h2", "Reservation integrations"),
    node(
      "p",
      "Signed provider events are validated and processed through canonical reservations. Accepted events can still need attention before access is issued or delivered.",
    ),
    status,
  );
  container.append(section);
  const current = () => isCurrent() && section.isConnected;
  const attempts = new Map();
  let busy = false;
  async function run(button, operation) {
    if (busy || !current()) return;
    busy = true;
    button.disabled = true;
    try {
      await operation();
    } catch {
      if (current())
        status.textContent =
          "Integration operation failed. Check permissions and retry safely.";
    } finally {
      busy = false;
      if (current()) button.disabled = false;
    }
  }
  async function mutate(path, body) {
    const signature = `${path}:${JSON.stringify(body)}`;
    if (!attempts.has(signature)) attempts.set(signature, crypto.randomUUID());
    return portalRequest(user, path, "POST", body, attempts.get(signature));
  }
  if (includeMappings && manager) {
    const form = node("form"),
      mappings = node("div");
    const provider = field(form, "Provider ID", "provider", "sandbox-pms");
    provider.pattern = "[A-Za-z0-9_-]+";
    provider.maxLength = 100;
    const providerRoom = field(form, "Provider room ID", "providerRoomId");
    providerRoom.maxLength = 128;
    providerRoom.pattern = "[A-Za-z0-9_.:-]+";
    const property = field(
      form,
      "Integration property",
      "propertyId",
      "",
      "text",
      properties.map((entry) => [entry.id, entry.name]),
    );
    const room = field(form, "Integration room", "roomId", "", "text", []);
    const targets = node("fieldset"),
      legend = node("legend", "Access targets");
    targets.append(legend);
    form.append(targets);
    let systems = [],
      mappingVersion;
    const updateTargets = () => {
      targets.replaceChildren(legend);
      for (const system of systems.filter(
        (entry) =>
          entry.status === "active" &&
          entry.propertyId === property.value &&
          (!entry.roomId || entry.roomId === room.value),
      )) {
        const label = node("label", `${system.name} (${system.type})`),
          check = node("input", undefined, {
            type: "checkbox",
            name: "targetId",
            value: system.id,
          });
        label.prepend(check);
        targets.append(label);
      }
    };
    const updateRooms = () => {
      room.replaceChildren(
        ...rooms
          .filter((entry) => entry.propertyId === property.value)
          .map((entry) => node("option", entry.name, { value: entry.id })),
      );
      updateTargets();
    };
    property.addEventListener("change", updateRooms);
    room.addEventListener("change", updateTargets);
    updateRooms();
    const save = node("button", "Save provider room mapping", {
        type: "submit",
      }),
      load = node("button", "Load provider mappings", { type: "button" });
    form.append(save, load);
    section.append(node("h3", "Provider room mapping"), form, mappings);
    async function loadMappings(cursor, append = false) {
      if (!provider.reportValidity()) return;
      const response = await portalRequest(
        user,
        `${root}/providers/${encodeURIComponent(provider.value)}/mappings?${new URLSearchParams({ limit: "50", ...(cursor ? { cursor } : {}) })}`,
      );
      if (!current()) return;
      if (!append) mappings.replaceChildren();
      for (const mapping of response.items) {
        const row = node("article");
        row.append(
          node("p", `${mapping.providerRoomId} · version ${mapping.version}`),
        );
        const edit = node("button", "Edit provider mapping", {
          type: "button",
        });
        edit.addEventListener("click", () => {
          mappingVersion = {
            provider: provider.value,
            room: mapping.providerRoomId,
            version: mapping.version,
          };
          providerRoom.value = mapping.providerRoomId;
          property.value = mapping.propertyId;
          updateRooms();
          room.value = mapping.roomId;
          updateTargets();
          for (const check of targets.querySelectorAll("input"))
            check.checked = mapping.targetIds.includes(check.value);
        });
        row.append(edit);
        mappings.append(row);
      }
      if (response.nextCursor) {
        const more = node("button", "Load more provider mappings", {
          type: "button",
        });
        more.addEventListener("click", () =>
          run(more, async () => {
            await loadMappings(response.nextCursor, true);
            if (current()) more.remove();
          }),
        );
        mappings.append(more);
      }
      status.textContent = response.items.length
        ? "Provider mappings loaded."
        : "No mappings for this provider.";
    }
    load.addEventListener("click", () => run(load, () => loadMappings()));
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void run(save, async () => {
        const body = {
          providerRoomId: providerRoom.value,
          propertyId: property.value,
          roomId: room.value,
          targetIds: [...targets.querySelectorAll("input:checked")].map(
            (entry) => entry.value,
          ),
          ...(mappingVersion?.provider === provider.value &&
          mappingVersion?.room === providerRoom.value
            ? { version: mappingVersion.version }
            : {}),
        };
        if (!body.targetIds.length) {
          status.textContent = "Select at least one mapped access target.";
          return;
        }
        const result = await mutate(
          `${root}/providers/${encodeURIComponent(provider.value)}/mappings`,
          body,
        );
        if (!current()) return;
        mappingVersion = {
          provider: provider.value,
          room: result.mapping.providerRoomId,
          version: result.mapping.version,
        };
        await loadMappings();
        status.textContent = "Provider room mapping saved.";
      });
    });
    try {
      systems = (
        await portalRequest(
          user,
          `/api/v1/organizations/${encodeURIComponent(organization.id)}/systems?limit=100`,
        )
      ).items;
      if (current()) updateTargets();
    } catch {
      if (current()) status.textContent = "Access targets could not be loaded.";
    }
  }
  if (!includeEvents) {
    status.textContent =
      "Integration mappings loaded. Review provider events in Operations.";
    return;
  }
  const refresh = node("button", "Refresh integration events", {
    type: "button",
  });
  section.append(refresh, events);
  async function loadEvents(cursor, append = false) {
    const result = await portalRequest(
      user,
      `${root}/events?${new URLSearchParams({ limit: "50", ...(cursor ? { cursor } : {}) })}`,
    );
    if (!current()) return;
    if (!append) events.replaceChildren();
    for (const event of result.items) {
      const row = node("article");
      row.append(
        node("h3", `${event.provider}: ${event.type}`),
        node(
          "p",
          `${event.status} · attempts ${event.attempts} · provider revision ${event.revision}`,
        ),
        node("p", `Correlation: ${event.requestId}`),
      );
      if (event.lastErrorCode)
        row.append(node("p", `Action required: ${event.lastErrorCode}`));
      if (event.status === "dead_letter") {
        const form = node("form"),
          reason = field(
            form,
            "Replay reason",
            "reason",
            "Provider mapping corrected",
          );
        reason.minLength = 5;
        reason.maxLength = 200;
        const replay = node("button", "Replay reviewed event", {
          type: "submit",
        });
        form.append(replay);
        form.addEventListener("submit", (submit) => {
          submit.preventDefault();
          void run(replay, async () => {
            await mutate(
              `${root}/events/${encodeURIComponent(event.id)}/replay`,
              { reason: reason.value },
            );
            if (!current()) return;
            await loadEvents();
            status.textContent =
              "Reviewed event queued again. Processing permissions are rechecked.";
          });
        });
        row.append(form);
      }
      events.append(row);
    }
    status.textContent = result.items.length
      ? "Integration event status loaded."
      : "No provider events received.";
    if (result.nextCursor) {
      const more = node("button", "Load more integration events", {
        type: "button",
      });
      more.addEventListener("click", () =>
        run(more, async () => {
          await loadEvents(result.nextCursor, true);
          if (current()) more.remove();
        }),
      );
      events.append(more);
    }
  }
  refresh.addEventListener("click", () => run(refresh, () => loadEvents()));
  try {
    await loadEvents();
  } catch {
    if (current())
      status.textContent =
        "Integration events could not be loaded. Refresh to retry.";
  }
}
