// The three example systems. Everyone who reaches the Host dashboard sees the
// same three, in every role. They exist only in this module: no API call ever
// carries them, they are never counted or billed, and they never appear in a
// calendar or a booking. Their names are the same in every language.
const example = (value) =>
  Object.freeze({ ...value, example: true, status: "active" });
export const exampleSystems = Object.freeze([
  example({
    id: "example-room-212",
    kind: "room",
    type: "gate",
    iconId: "bed-outline",
    name: "Example WIFIGATE Room 212 🥂🍾",
    gates: 1,
  }),
  example({
    id: "example-dual-212",
    kind: "dual",
    type: "dual-control",
    iconId: "barrier-gate-small",
    name: "Example WIFIGATE Dual Control 212 🥂🍾",
    gates: 2,
  }),
  example({
    id: "example-group-212",
    kind: "group",
    type: "group",
    iconId: "hosting",
    name: "Example WIFIGATE Group 212 🥂🍾",
    gates: 4,
  }),
]);

export const exampleById = (id) =>
  exampleSystems.find((system) => system.id === id);

// "Link to organization" on an example changes only that example's own badge,
// for this person in this browser: localStorage under a key made from a hash
// of the signed-in uid (the uid itself is never stored). Without storage
// (private window, blocked site data) the choice lasts until the page closes.
const prefix = "wg.host.examples.v1.";
const memory = new Map();

async function storageKey(uid) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(String(uid)),
  );
  return (
    prefix +
    [...new Uint8Array(digest)]
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("")
  );
}

const clean = (value) => {
  const links = {};
  if (!value || typeof value !== "object") return links;
  for (const system of exampleSystems) {
    const link = value[system.id];
    if (
      link &&
      typeof link.id === "string" &&
      typeof link.name === "string" &&
      link.id.length <= 128 &&
      link.name.length <= 200
    )
      links[system.id] = { id: link.id, name: link.name };
  }
  return links;
};

// Without a hash (no WebCrypto) nothing is written to storage, so one
// browser never mixes two people's choices.
async function place(uid) {
  try {
    return { key: await storageKey(uid), persist: true };
  } catch {
    return { key: `${prefix}session`, persist: false };
  }
}

export async function readExampleLinks(uid) {
  const { key, persist } = await place(uid);
  if (memory.has(key)) return { ...memory.get(key) };
  let links = {};
  if (persist)
    try {
      links = clean(JSON.parse(localStorage.getItem(key) ?? "{}"));
    } catch {
      links = {};
    }
  memory.set(key, links);
  return { ...links };
}

// Links an example to an organization ({id, name}) or unlinks it (null).
// Returns every example's link after the change.
export async function setExampleLink(uid, exampleId, organization) {
  if (!exampleById(exampleId)) throw new TypeError("Unknown example");
  const { key, persist } = await place(uid);
  const links = await readExampleLinks(uid);
  if (organization)
    links[exampleId] = { id: organization.id, name: organization.name };
  else delete links[exampleId];
  const value = clean(links);
  memory.set(key, value);
  if (persist)
    try {
      if (Object.keys(value).length)
        localStorage.setItem(key, JSON.stringify(value));
      else localStorage.removeItem(key);
    } catch {
      // Storage is unavailable: the change lasts for this page only.
    }
  return { ...value };
}
