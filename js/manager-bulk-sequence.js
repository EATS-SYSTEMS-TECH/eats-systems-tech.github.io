// Local-only ownership of one key epoch; no identity or secret bytes are retained here.
const epochHandle = Symbol("bulk sender epoch");
const epochs = new WeakMap();

function stateOf(owner) {
  const handle = owner?.[epochHandle];
  const state = handle && epochs.get(handle);
  if (!state) throw new Error("Bulk sender session is unavailable.");
  return state;
}
function attach(owner, handle) {
  if (Object.prototype.hasOwnProperty.call(owner, epochHandle)) {
    if (owner[epochHandle] !== handle) throw new Error("Bulk sender session is unavailable.");
    return owner;
  }
  // A shallow session/state copy shares the opaque handle. JSON/structured
  // clones cannot manufacture a registered epoch and fail closed instead.
  Object.defineProperty(owner, epochHandle, {value: handle, enumerable: true});
  return owner;
}
export function beginBulkSendEpoch(owner) {
  if (Object.prototype.hasOwnProperty.call(owner, epochHandle)) {
    assertBulkSendEpochOpen(owner);
    return owner;
  }
  const handle = {};
  epochs.set(handle, {next: 1, closed: false});
  return attach(owner, handle);
}
export function carryBulkSendEpoch(from, to) {
  assertBulkSendEpochOpen(from);
  return attach(to, from[epochHandle]);
}
export function assertBulkSendEpochOpen(owner) {
  if (stateOf(owner).closed) throw new Error("Bulk sender session is closed.");
}
export function reserveClientBulkSequence(owner) {
  assertBulkSendEpochOpen(owner);
  const state = stateOf(owner);
  const next = state.next;
  if (!Number.isInteger(next) || next < 1 || next > 0xffffffff)
    throw new Error("Bulk sender sequence is exhausted; reconnect.");
  // Reserve synchronously, before any asynchronous derivation/encryption.
  // A failed operation burns its reservation; no flow may reset this epoch.
  state.next = next === 0xffffffff ? 0 : next + 1;
  return next;
}
export function retireBulkSendEpoch(owner) {
  const handle = owner?.[epochHandle];
  const state = handle && epochs.get(handle);
  if (state) {state.closed = true; state.next = 0;}
}
