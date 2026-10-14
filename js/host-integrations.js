import { hostText } from "./host-locale.js";
import { portalRequest } from "./api/index.js";
import { field, node, infoTip, labelTip, hostDateTime } from "./host-ui.js";
import { can } from "./host-permissions.js";
import { noSystem } from "./host-booking-model.js";

// Connect → Your booking system: the bookings it sent lately, with a second
// try for one that failed, and (For your developer) its connections: which
// WIFIGATE system each ID the booking system sends opens ({providerRoomId,
// systemId}), found by the name the booking system sends. The words on
// screen are "ID" and "connection"; providerRoomId stays only in the API.
const messages = {
  PROVIDER_MAPPING_REQUIRED:
    "Connect this booking system ID to a system first.",
  SYSTEM_UNAVAILABLE: "That system isn't available any more. Choose another.",
  VERSION_CONFLICT:
    "This connection changed. Show the connections again and retry.",
  IDEMPOTENCY_CONFLICT:
    "This connection changed. Show the connections again and retry.",
  INVALID_REQUEST: "Check the booking system name and the ID.",
  TOTP_REQUIRED: "Verify your authenticator first, then try again.",
  HOST_API_UNAVAILABLE: "Can't reach WIFIGATE right now. Try again.",
};
// Saving a connection answers 404 when the chosen system was just removed: the
// same as a system that is no longer available.
const mappingMessages = {
  ...messages,
  RESOURCE_NOT_FOUND: messages.SYSTEM_UNAVAILABLE,
};
export const integrationMessage = (error, { mapping = false } = {}) =>
  hostText(
    (mapping ? mappingMessages : messages)[error?.code] ??
      "That didn't work. Try again.",
  );
const failure = (error) => integrationMessage(error);
const mappingFailure = (error) => integrationMessage(error, { mapping: true });
const eventTypes = {
  "reservation.created": "New booking",
  "reservation.updated": "Booking changed",
  "reservation.cancelled": "Booking cancelled",
};
// Every status the API gives a booking it received.
const eventStates = {
  received: "Received",
  queued: "Waiting",
  processing: "Working on it",
  processed: "Done",
  retry: "Trying again",
  dead_letter: "Failed",
  expired: "Expired",
  redacted: "Guest details removed",
};
export const eventStateLabel = (status) =>
  hostText(eventStates[status] ?? "Received");

// context: {container, user, organization, systems (active), isCurrent}.
export async function renderHostIntegrations({
  container,
  user,
  organization,
  systems,
  isCurrent,
}) {
  if (!can(organization, "integrations:write")) return;
  const root = `/api/v1/organizations/${encodeURIComponent(organization.id)}/integrations`;
  const systemsById = new Map(systems.map((item) => [item.id, item]));
  const section = node("section", undefined, {
    "aria-label": "Your booking system",
    class: "connect-card",
  });
  const heading = node("div", undefined, { class: "view-heading" });
  heading.append(
    node("h2", hostText("Your booking system")),
    infoTip(
      hostText(
        "Your booking system sends its bookings to WIFIGATE. Each booking in it opens one of your systems.",
      ),
    ),
  );
  const status = node("p", "", { role: "status", "aria-live": "polite" });
  section.append(heading, status);
  container.append(section);
  const current = () => isCurrent() && section.isConnected;
  const attempts = new Map();
  let busy = false;
  async function run(button, operation, explain = failure) {
    if (busy || !current()) return;
    busy = true;
    button.disabled = true;
    status.textContent = "";
    try {
      await operation();
    } catch (error) {
      if (current()) status.textContent = explain(error);
    } finally {
      busy = false;
      if (current()) button.disabled = false;
    }
  }
  const mutate = (path, body) => {
    const signature = `${path}:${JSON.stringify(body)}`;
    if (!attempts.has(signature)) attempts.set(signature, crypto.randomUUID());
    return portalRequest(
      user,
      path,
      "POST",
      body,
      attempts.get(signature),
    ).then((result) => {
      attempts.delete(signature);
      return result;
    });
  };

  // Which booking system: its name as it sends it to WIFIGATE.
  const providerForm = node("form", undefined, { class: "connect-inline" });
  const provider = field(providerForm, "Booking system", "provider");
  provider.pattern = "[A-Za-z0-9_-]+";
  provider.maxLength = 100;
  provider.dir = "ltr";
  labelTip(
    provider,
    hostText(
      "The name your booking system uses when it sends bookings to WIFIGATE. Your developer knows it.",
    ),
  );
  const showRooms = node("button", hostText("Show connections"), {
    type: "submit",
    class: "button-secondary",
  });
  providerForm.append(showRooms);
  const rooms = node("div", undefined, { class: "connect-rooms" });
  // The booking system's own name and its connections are set up by a
  // developer.
  const setup = node("details", undefined, {
    class: "connect-developer connect-setup",
  });
  setup.append(
    node("summary", hostText("For your developer")),
    providerForm,
    rooms,
  );

  const systemSelect = (form, value) => {
    const input = field(form, "Opens", "systemId", "", "text", [
      ["", hostText("Choose a system")],
      ...systems.map((item) => [item.id, item.name]),
    ]);
    input.required = true;
    if (value && systemsById.has(value)) input.value = value;
    return input;
  };
  function roomForm(mapping) {
    const form = node("form", undefined, { class: "connect-room-form" });
    const room = field(
      form,
      "ID in your booking system",
      "providerRoomId",
      mapping?.providerRoomId ?? "",
    );
    room.maxLength = 128;
    room.pattern = "[A-Za-z0-9_.:\\-]+";
    room.dir = "ltr";
    if (mapping) room.readOnly = true;
    const target = systemSelect(form, mapping?.systemId);
    const save = node("button", hostText(mapping ? "Save" : "Add connection"), {
      type: "submit",
    });
    form.append(save);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const name = provider.value.trim();
      void run(
        save,
        async () => {
          await mutate(
            `${root}/providers/${encodeURIComponent(name)}/mappings`,
            {
              providerRoomId: room.value.trim(),
              systemId: target.value,
              ...(mapping ? { version: mapping.version } : {}),
            },
          );
          if (current()) await loadRooms(name);
        },
        mappingFailure,
      );
    });
    return form;
  }
  async function loadRooms(name) {
    const items = [];
    let cursor;
    for (let page = 0; page < 10; page++) {
      const result = await portalRequest(
        user,
        `${root}/providers/${encodeURIComponent(name)}/mappings?${new URLSearchParams({ limit: "50", ...(cursor ? { cursor } : {}) })}`,
      );
      if (!current() || provider.value.trim() !== name) return;
      items.push(...(Array.isArray(result?.items) ? result.items : []));
      cursor = result?.nextCursor;
      if (!cursor) break;
    }
    const list = node("ul", undefined, { class: "connect-room-list" });
    for (const mapping of items) {
      if (typeof mapping?.providerRoomId !== "string") continue;
      const item = node("li", undefined, {
        "data-provider-room": mapping.providerRoomId,
      });
      const line = node("p", undefined, { class: "connect-room-list__line" });
      line.append(
        node("bdi", mapping.providerRoomId, { dir: "ltr" }),
        " → ",
        node(
          "bdi",
          systemsById.get(mapping.systemId)?.name ??
            (mapping.systemId ? hostText("A removed system") : noSystem),
        ),
      );
      const change = node("details", undefined, {
        class: "connect-room-change",
      });
      change.append(node("summary", hostText("Change")), roomForm(mapping));
      item.append(line, change);
      list.append(item);
    }
    rooms.replaceChildren();
    if (list.childElementCount) rooms.append(list);
    else
      rooms.append(
        node("p", hostText("No connections yet."), {
          class: "connect-empty",
        }),
      );
    rooms.append(node("h3", hostText("New connection")), roomForm());
  }
  providerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!providerForm.reportValidity()) return;
    void run(showRooms, () => loadRooms(provider.value.trim()));
  });

  // What the booking system sent lately.
  const eventsSection = node("div", undefined, { class: "connect-events" });
  const eventsHeading = node("h3", hostText("Bookings it sent lately"));
  const eventList = node("ul", undefined, { class: "connect-event-list" });
  // One "Show more" at most: it lives here and every read replaces it.
  const eventMore = node("div", undefined, { class: "connect-events__more" });
  const eventEmpty = node("p", hostText("No bookings from it yet."), {
    class: "connect-empty",
    hidden: "",
  });
  eventsSection.append(eventsHeading, eventList, eventEmpty, eventMore);
  section.append(eventsSection, setup);
  async function loadEvents(cursor, append = false) {
    const result = await portalRequest(
      user,
      `${root}/events?${new URLSearchParams({ limit: "50", ...(cursor ? { cursor } : {}) })}`,
    );
    if (!current()) return;
    eventMore.replaceChildren();
    if (!append) eventList.replaceChildren();
    for (const event of Array.isArray(result?.items) ? result.items : []) {
      const item = node("li", undefined, { "data-event-status": event.status });
      const line = node("p");
      line.append(
        node("strong", hostText(eventTypes[event.type] ?? "Booking update")),
        ` · ${eventStateLabel(event.status)}`,
        typeof event.createdAt === "string" &&
          Number.isFinite(Date.parse(event.createdAt))
          ? ` · ${hostDateTime(event.createdAt)}`
          : "",
      );
      item.append(line);
      // Codes stay with the developer.
      const developer = node("details", undefined, {
        class: "connect-developer",
      });
      developer.append(node("summary", hostText("For your developer")));
      const facts = node("p", undefined, { dir: "ltr", class: "connect-code" });
      facts.textContent = [
        event.provider,
        event.requestId,
        event.lastErrorCode,
        event.attempts !== undefined ? `attempts ${event.attempts}` : "",
      ]
        .filter(Boolean)
        .join(" · ");
      developer.append(facts);
      item.append(developer);
      if (event.status === "dead_letter") {
        const again = node("button", hostText("Try again"), {
          type: "button",
          class: "button-secondary",
        });
        again.addEventListener("click", () =>
          run(again, async () => {
            await mutate(
              `${root}/events/${encodeURIComponent(event.id)}/replay`,
              {
                reason: "Retried from the WIFIGATE dashboard",
              },
            );
            if (current()) await loadEvents();
          }),
        );
        item.append(again);
      }
      eventList.append(item);
    }
    eventEmpty.hidden = eventList.childElementCount > 0;
    if (result?.nextCursor) {
      const more = node("button", hostText("Show more"), {
        type: "button",
        class: "button-secondary",
      });
      more.addEventListener("click", () =>
        run(more, () => loadEvents(result.nextCursor, true)),
      );
      eventMore.append(more);
    }
  }
  try {
    await loadEvents();
  } catch (error) {
    if (current()) status.textContent = failure(error);
  }
}
