// scripts/line-hero-frames.mjs
// Static frames of the WIFIGATE Host and WIFIGATE Manager hero line
// animations, rendered by the shipped scene modules themselves (js/line-hero-
// host.js, js/line-hero-manager.js) into a minimal SVG document. Each page
// shows one of them as its eager <img> until the animation takes over and
// whenever JavaScript is unavailable:
//   start  - t = 0, the frame the loop begins with (seamless hand-over)
//   still  - the approved reduced-motion frame (Host 27.0 s, Manager 27.65 s)
// Regenerate after changing a scene module:
//   node scripts/line-hero-frames.mjs
// scripts/line-hero.test.mjs fails while a committed frame differs from what
// the modules render now.
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const LINE_HERO_FRAME_DIR = "assets/img/line-hero";
export const LINE_HERO_SCENES = Object.freeze({
  host: { module: "js/line-hero-host.js", factory: "createHostScene" },
  manager: { module: "js/line-hero-manager.js", factory: "createManagerScene" },
  nosim: { module: "js/line-hero-nosim.js", factory: "createNoSimScene" },
});
export const LINE_HERO_FRAMES = Object.freeze(["start", "still"]);

const SVG_NS = "http://www.w3.org/2000/svg";
const escapeAttribute = value => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

// Just the DOM surface the scene modules use: createElementNS, setAttribute,
// appendChild and insertBefore (both move an attached node, as in a browser).
class FrameElement {
  constructor(document, tag) { this.ownerDocument = document; this.tagName = tag; this.attributes = new Map(); this.childNodes = []; this.parentNode = null; }
  setAttribute(name, value) { this.attributes.set(String(name), String(value)); }
  getAttribute(name) { return this.attributes.has(name) ? this.attributes.get(name) : null; }
  appendChild(child) { return this.insertBefore(child, null); }
  insertBefore(child, reference) {
    if (child.parentNode) child.parentNode.childNodes.splice(child.parentNode.childNodes.indexOf(child), 1);
    const index = reference ? this.childNodes.indexOf(reference) : -1;
    if (reference && index < 0) throw Error("Reference node is not a child");
    this.childNodes.splice(index < 0 ? this.childNodes.length : index, 0, child);
    child.parentNode = this;
    return child;
  }
  serialize() {
    const attributes = [...this.attributes].map(([name, value]) => ` ${name}="${escapeAttribute(value)}"`).join("");
    const children = this.childNodes.map(child => child.serialize()).join("");
    return children ? `<${this.tagName}${attributes}>${children}</${this.tagName}>` : `<${this.tagName}${attributes}/>`;
  }
}
class FrameDocument {
  createElementNS(namespace, tag) {
    if (namespace !== SVG_NS) throw Error("Only SVG elements are expected");
    return new FrameElement(this, tag);
  }
}

export async function loadLineHeroScene(name) {
  const scene = LINE_HERO_SCENES[name];
  if (!scene) throw Error(`Unknown line hero scene ${name}`);
  const module = await import(pathToFileURL(path.join(repoRoot, ...scene.module.split("/"))).href);
  return module[scene.factory];
}

// One frame as a standalone SVG file. A fresh scene renders exactly one time,
// as the approved page did for ?t=.
export function renderLineHeroFrame(createScene, frame) {
  const svg = new FrameDocument().createElementNS(SVG_NS, "svg");
  svg.setAttribute("xmlns", SVG_NS);
  const scene = createScene(svg);
  if (!LINE_HERO_FRAMES.includes(frame)) throw Error(`Unknown frame ${frame}`);
  scene.render(frame === "still" ? scene.still : 0);
  svg.setAttribute("width", "1600");
  svg.setAttribute("height", "900");
  return svg.serialize() + "\n";
}

export const lineHeroFramePath = (name, frame) => `${LINE_HERO_FRAME_DIR}/${name}-${frame}.svg`;

// A frame's content version. The frames are LF text (.gitattributes); line
// endings are normalised before hashing as well, so a checkout that rewrites
// them as CRLF neither changes the pages' ?v= nor the build output.
export const lineHeroFrameHash = bytes => createHash("sha256").update(Buffer.from(bytes).toString("utf8").replace(/\r\n/g, "\n"), "utf8").digest("hex");

// The committed frames with their content versions, for the page builder.
export async function readLineHeroFrames(root = repoRoot) {
  const frames = new Map();
  for (const name of Object.keys(LINE_HERO_SCENES)) {
    const entry = {};
    for (const frame of LINE_HERO_FRAMES) {
      const file = lineHeroFramePath(name, frame);
      entry[frame] = { path: file, sha256: lineHeroFrameHash(await fs.readFile(path.join(root, ...file.split("/")))) };
    }
    frames.set(name, entry);
  }
  return frames;
}

async function main() {
  await fs.mkdir(path.join(repoRoot, ...LINE_HERO_FRAME_DIR.split("/")), { recursive: true });
  for (const name of Object.keys(LINE_HERO_SCENES)) {
    const createScene = await loadLineHeroScene(name);
    for (const frame of LINE_HERO_FRAMES) {
      const file = lineHeroFramePath(name, frame), svg = renderLineHeroFrame(createScene, frame);
      await fs.writeFile(path.join(repoRoot, ...file.split("/")), svg);
      console.log(`${file}: ${svg.length} bytes`);
    }
  }
}
if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) await main();
