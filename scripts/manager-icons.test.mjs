import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { systemIconSrc, systemIconCatalog } from "../js/wifigate-system-icons.js";

test("every WIFIGATE system icon resolves to the original Host SVG asset", async () => {
  const directory = new URL("../assets/host-icons/", import.meta.url);
  const resolved = [];
  for (const [type, ids] of Object.entries(systemIconCatalog)) {
    for (const iconId of ids) {
      const src = systemIconSrc({ type, iconId });
      const filename = src.split("/").at(-1);
      assert.equal(filename, `${type}-${iconId}.svg`);
      assert.match(await readFile(new URL(filename, directory), "utf8"), /<svg\s/);
      resolved.push(filename);
    }
  }
  assert.deepEqual(resolved.sort(), (await readdir(directory)).filter(name => name.endsWith(".svg")).sort());
});

test("missing, foreign-type and unsafe icon metadata uses a local WIFIGATE default", () => {
  for (const iconId of [undefined, "missing", "folder", "../../secret", "https://other.test/icon.svg", "__proto__"])
    assert.equal(systemIconSrc({ type: "gate", iconId }), "/assets/host-icons/gate-door-small.svg");
  assert.equal(systemIconSrc({ type: "dual-control" }), "/assets/host-icons/dual-control-barrier-gate-small.svg");
  assert.equal(systemIconSrc({ type: "group" }), "/assets/host-icons/group-folder.svg");
  for (const type of [undefined, "unknown", "__proto__", "constructor", "../../"])
    assert.equal(systemIconSrc({ type }), "/assets/host-icons/gate-door-small.svg");
});
