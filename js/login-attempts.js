const KEY = "wifigate-login-attempts-v1";
const empty = () => ({ failed: 0, limit: 5, resetAt: null, lockedUntil: null });

// This anonymous browser hint keeps the UI consistent across reloads/tabs.
// Enforcement is exclusively on the server, keyed by verified Firebase UID.
export function createLoginAttemptHint({ storage, clock = Date.now } = {}) {
  let state = empty();
  function validate(value) {
    if (!value || value.limit !== 5 || !Number.isInteger(value.failed) || value.failed < 0 || value.failed > 5) return empty();
    const until = Date.parse(value.lockedUntil || value.resetAt);
    if (!value.failed || !Number.isFinite(until) || until <= clock()) return empty();
    if (value.failed === 5 && !value.lockedUntil) return empty();
    return { failed: value.failed, limit: 5, resetAt: value.resetAt, lockedUntil: value.lockedUntil };
  }
  function read() {
    try { state = validate(JSON.parse(storage?.getItem(KEY) || "null")); } catch { state = empty(); }
    return state;
  }
  read();
  return {
    read,
    current() { state = validate(state); return state; },
    set(value) {
      state = validate(value);
      try { if (state.failed) storage?.setItem(KEY, JSON.stringify(state)); else storage?.removeItem(KEY); } catch { /* Server enforcement does not depend on storage. */ }
      return state;
    },
  };
}
