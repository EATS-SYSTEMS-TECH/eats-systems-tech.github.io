// HTML parses script contents as raw text, including application/json. Escape
// the opening delimiter before insertion; JSON consumers recover the same value.
export function serializeScriptData(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}
