// scripts/highlight-art.mjs
// The drawing above each of the three highlights of a use-case page, in the
// language of the WIFIGATE Host and WIFIGATE Manager step drawings
// (assets/img/subscription-flow/): one blue, thin lines, pale context lines,
// dashed links, a faint tint and the status light. One drawing per highlight
// kind (the `icon` of a highlight in scripts/niche-pages/*.mjs), and the wave
// that carries the three of them.
// Regenerate after changing a drawing:
//   node scripts/highlight-art.mjs
// scripts/highlight-art.test.mjs fails while a committed file differs from
// what this module draws.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const HIGHLIGHT_ART_DIR = "assets/img/highlight-flow";
export const HIGHLIGHT_ART_SIZE = Object.freeze({ width: 320, height: 220 });
export const HIGHLIGHT_WAVE = Object.freeze({ file: "wave-points.svg", width: 1160, height: 200 });
const BLUE = "#146BFF";

// Shared pieces ---------------------------------------------------------------
const thin = body => `<g stroke-width="1.4" opacity=".75">${body}</g>`;
const tint = shape => shape.replace("/>", ` fill="${BLUE}" fill-opacity=".09" stroke="none"/>`);
const dashed = d => `<path d="${d}" stroke-width="1.4" stroke-dasharray="5 6" opacity=".8"/>`;
const dot = (x, y, r = 2.4) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${BLUE}" stroke="none"/>`;
// the status light of the hero scenes: a ring with a solid centre on a clear ground
const light = (x, y) => `<circle cx="${x}" cy="${y}" r="9" fill="#fff"/>${dot(x, y, 4)}`;
// a light that is off: an empty dashed ring
const lightOff = (x, y) => `<circle cx="${x}" cy="${y}" r="9" fill="#fff" stroke-width="1.4" stroke-dasharray="3 4" opacity=".8"/>`;
const phone = (x, y, w = 84, h = 168) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="#fff"/><path d="M${x + w / 2 - 12} ${y + 12}h24" stroke-width="1.4" opacity=".75"/>`;
// Wi-Fi arcs opening to the right of a point
const waves = (x, y) => [14, 24, 34].map(r => `<path d="M${(x + r * 0.707).toFixed(1)} ${(y - r * 0.707).toFixed(1)}A${r} ${r} 0 0 1 ${(x + r * 0.707).toFixed(1)} ${(y + r * 0.707).toFixed(1)}"/>`).join("");
// a door in its wall: tinted leaf, handle on the given side
const door = (x, y, w, h, handle = "end") => `${tint(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3"/>`)}<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3"/><path d="M${handle === "end" ? x + w - 10 : x + 10} ${y + h / 2 - 6}v12"/>`;
const ground = (x0, x1, y) => `<path d="M${x0} ${y}H${x1}" stroke-width="1.4" opacity=".75"/>`;
// a person: head and shoulders
const person = (x, y, r = 9) => `<circle cx="${x}" cy="${y}" r="${r}"/><path d="M${x - r * 1.8} ${y + r * 3}a${r * 1.8} ${r * 1.7} 0 0 1 ${r * 3.6} 0"/>`;
const tip = (x, y, direction = "right") => direction === "right" ? `<path d="M${x - 8} ${y - 6}l8 6l-8 6"/>` : `<path d="M${x + 8} ${y - 6}l-8 6l8 6"/>`;

// The drawings ----------------------------------------------------------------
const DRAWINGS = {
  // a list in which every permission has a name, and the door it opens
  roster: () => [
    `<rect x="30" y="34" width="166" height="152" rx="10"/><path d="M30 60h166"/>${dot(44, 47, 2)}${dot(53, 47, 2)}${dot(62, 47, 2)}`,
    tint(`<rect x="40" y="70" width="146" height="30" rx="6"/>`),
    thin([70, 108, 146].map(y => `<rect x="40" y="${y}" width="146" height="30" rx="6"/><circle cx="56" cy="${y + 15}" r="7"/><path d="M72 ${y + 11}h52M72 ${y + 20}h30"/>`).join("")),
    light(170, 85), light(170, 123), lightOff(170, 161),
    dashed("M196 110h28"), tip(230, 110),
    door(238, 66, 52, 106), ground(222, 306, 172), light(264, 46),
  ],
  // one press on the phone, and the way in reaches the guest
  invite: () => [
    phone(36, 26),
    thin(`<rect x="48" y="58" width="60" height="42" rx="6"/><path d="M56 70h34M56 80h44M56 90h24"/>`),
    tint(`<rect x="48" y="126" width="60" height="28" rx="14"/>`), `<rect x="48" y="126" width="60" height="28" rx="14"/><path d="M70 140h14"/>${tip(90, 140)}`,
    dashed("M120 140c38 0 30 -52 78 -52"), tip(204, 88),
    `<path d="M250 132c-15 -19 -24 -31 -24 -44a24 24 0 0 1 48 0c0 13 -9 25 -24 44Z" fill="#fff"/>`, dot(250, 88, 7),
    door(232, 146, 36, 40), ground(206, 296, 186),
  ],
  // Auto Open: the phone stays in the pocket and the door opens on the way
  handsfree: () => [
    `<circle cx="70" cy="62" r="15"/><rect x="52" y="86" width="36" height="90" rx="18"/>`,
    `<rect x="72" y="122" width="10" height="17" rx="2.5" fill="${BLUE}" stroke="none"/>`,
    waves(84, 130),
    tint(`<rect x="196" y="54" width="96" height="122"/>`),
    `<path d="M196 176V54h96v122"/>`,
    thin(`<rect x="244" y="60" width="42" height="116"/><path d="M252 112v14"/>`),
    `<path d="M196 54l-30 14v122l30 -14Z" fill="#fff"/><path d="M174 118v14"/>`,
    ground(40, 160, 176), ground(202, 306, 176), light(244, 34),
  ],
  // the booking opens the entrance for exactly its dates
  calendar: () => [
    `<rect x="32" y="42" width="140" height="138" rx="10"/><path d="M32 72h140M62 32v20M142 32v20"/>`,
    tint(`<rect x="72" y="112" width="76" height="20" rx="5"/>`),
    thin([84, 112, 140].map(y => [44, 72, 100, 128].map(x => `<rect x="${x}" y="${y}" width="20" height="20" rx="5"/>`).join("")).join("")),
    `<rect x="72" y="112" width="76" height="20" rx="5"/>`,
    dashed("M172 110h36"), tip(214, 110),
    door(234, 66, 54, 106), ground(218, 304, 172), light(261, 46),
  ],
  // no key, no remote: the phone takes their place
  keyless: () => [
    `<circle cx="88" cy="110" r="58" stroke-width="1.4" stroke-dasharray="5 6" opacity=".8"/>`,
    thin(`<circle cx="70" cy="92" r="17"/><circle cx="70" cy="92" r="5"/><path d="M82 104l40 40M106 128l-8 8M116 138l-8 8"/>`),
    `<path d="M47 151L129 69"/>`,
    dashed("M150 110h32"), tip(188, 110),
    phone(198, 28, 84, 164),
    tint(`<circle cx="240" cy="112" r="24"/>`), `<circle cx="240" cy="112" r="24"/>`, dot(240, 112, 8),
    thin(`<path d="M222 160h36"/>`),
  ],
  // the control sits inside, behind the shutter, out of reach
  shutter: () => [
    tint(`<rect x="46" y="124" width="150" height="56"/>`),
    `<rect x="38" y="36" width="166" height="22" rx="4"/><path d="M46 58V180M196 58V180M46 124h150"/>`,
    thin(`<path d="M46 72h150M46 85h150M46 98h150M46 111h150"/>`),
    `<rect x="150" y="136" width="28" height="34" rx="5" fill="#fff"/>`, dot(164, 148, 4), thin(`<path d="M158 160h12"/>`),
    ground(26, 216, 180),
    dashed("M178 152c30 0 30 -30 60 -30"),
    phone(244, 78, 48, 92),
    tint(`<circle cx="268" cy="126" r="12"/>`), `<circle cx="268" cy="126" r="12"/>`, dot(268, 126, 4),
  ],
  // every person holds a permission of their own
  users: () => [
    tint(`<rect x="28" y="48" width="78" height="124" rx="10"/>`),
    [28, 121, 214].map(x => `<rect x="${x}" y="48" width="78" height="124" rx="10"/>`).join(""),
    thin([67, 160, 253].map(x => person(x, 84, 10)).join("")),
    thin([67, 160, 253].map(x => `<path d="M${x - 18} 128h36"/>`).join("")),
    light(67, 150), light(160, 150), lightOff(253, 150),
  ],
  // the phone opens the gate from wherever you are
  phone: () => [
    phone(38, 28, 86, 164),
    tint(`<circle cx="81" cy="112" r="25"/>`), `<circle cx="81" cy="112" r="25"/>`, dot(81, 112, 8),
    thin(`<path d="M62 160h38"/>`),
    waves(134, 112),
    `<path d="M210 60V178M296 60V178"/>`,
    tint(`<rect x="216" y="84" width="74" height="94"/>`), `<rect x="216" y="84" width="74" height="94"/>`,
    thin(`<path d="M234.5 84v94M253 84v94M271.5 84v94"/>`),
    ground(196, 310, 178), light(253, 58),
  ],
  // access for a set time, which ends by itself
  clock: () => [
    tint(`<path d="M104 112V50A62 62 0 0 1 157.7 143Z"/>`),
    `<circle cx="104" cy="112" r="62"/><path d="M104 112V72M104 112l27 15.5"/>`,
    thin(`<path d="M104 56v8M104 160v8M48 112h8M152 112h8"/>`), dot(104, 112, 3.5),
    dashed("M168 100h28"), tip(202, 100),
    `<rect x="210" y="72" width="84" height="56" rx="8"/>`, thin(`<circle cx="228" cy="92" r="7"/><path d="M242 88h36M242 97h22"/>`), light(276, 112),
    `<rect x="210" y="140" width="84" height="40" rx="8" stroke-width="1.4" stroke-dasharray="5 6" opacity=".8"/>`,
    thin(`<circle cx="228" cy="160" r="7" stroke-dasharray="3 4"/>`),
  ],
  // a gate that stays dependable and private
  gate: () => [
    `<rect x="36" y="70" width="14" height="110" rx="2"/><rect x="270" y="70" width="14" height="110" rx="2"/>`,
    tint(`<rect x="50" y="92" width="220" height="88"/>`), `<rect x="50" y="92" width="220" height="88"/>`,
    thin(`<path d="${[72, 94, 116, 138, 160, 182, 204, 226, 248].map(x => `M${x} 92v88`).join("")}"/>`),
    ground(20, 300, 180),
    `<path d="M160 30l-30 12v24c0 19 12 33 30 39c18 -6 30 -20 30 -39V42Z" fill="#fff"/><path d="M147 66l9 9l17 -18"/>`,
    light(43, 52),
  ],
  // every entry on record: who came in, and when
  history: () => [
    `<rect x="30" y="32" width="160" height="156" rx="10"/><path d="M30 58h160"/>${dot(44, 45, 2)}${dot(53, 45, 2)}${dot(62, 45, 2)}`,
    thin(`<path d="M56 74V174"/>`),
    [84, 118, 152].map(y => `<circle cx="56" cy="${y}" r="5" fill="#fff"/><path d="M76 ${y - 4}h64"/>`).join(""),
    thin([84, 118, 152].map(y => `<path d="M76 ${y + 6}h38M152 ${y}h22"/>`).join("")),
    dot(56, 84, 2.6),
    dashed("M190 110h20"),
    `<path d="M214 110a40 40 0 1 0 12.2 -28.7"/><path d="M214 75v25.5h26"/><path d="M254 91v21l14 8.5"/>`,
  ],
  // any other highlight: access that is protected
  default: () => [
    `<path d="M112 28l-60 24v46c0 38 24 66 60 78c36 -12 60 -40 60 -78V52Z"/>`,
    tint(`<path d="M112 28l-60 24v46c0 38 24 66 60 78c36 -12 60 -40 60 -78V52Z"/>`),
    `<path d="M88 100l17 17l33 -35"/>`,
    dashed("M172 110h36"), tip(214, 110),
    door(234, 66, 54, 106), ground(218, 304, 172), light(261, 46),
  ],
};

const svg = body => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${HIGHLIGHT_ART_SIZE.width} ${HIGHLIGHT_ART_SIZE.height}" width="${HIGHLIGHT_ART_SIZE.width}" height="${HIGHLIGHT_ART_SIZE.height}" fill="none" stroke="${BLUE}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>\n`;

export const HIGHLIGHT_ART_NAMES = Object.freeze(Object.keys(DRAWINGS));
// The drawing of a highlight kind; kinds without their own drawing share the default.
export const highlightArtName = icon => (Object.hasOwn(DRAWINGS, icon) ? icon : "default");
export const highlightArtPath = icon => `${HIGHLIGHT_ART_DIR}/${highlightArtName(icon)}.svg`;
export function renderHighlightArt(name) {
  if (!Object.hasOwn(DRAWINGS, name)) throw new Error(`Unknown highlight drawing ${name}`);
  return svg(DRAWINGS[name]().flat().join(""));
}

// The wave of the Host and Manager steps, without their order: the three
// points are status lights, not numbers, and no arrow leads from one to the
// next. It is symmetric, so one file serves both text directions.
export function renderHighlightWave() {
  const curve = "M1160 84C1090 84 1050 40 980 40S700 98 580 98S300 40 180 40S70 84 0 84";
  const point = (x, y) => `<path d="M${x} -24V${y - 22}" stroke-width="1.4" stroke-dasharray="4 6" opacity=".8"/><circle cx="${x}" cy="${y}" r="13" fill="#fff" stroke-width="2"/><circle cx="${x}" cy="${y}" r="5.5" fill="${BLUE}" stroke="none"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -30 ${HIGHLIGHT_WAVE.width} ${HIGHLIGHT_WAVE.height}" width="${HIGHLIGHT_WAVE.width}" height="${HIGHLIGHT_WAVE.height}" fill="none" stroke="${BLUE}" stroke-linecap="round" stroke-linejoin="round"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${BLUE}" stop-opacity=".13"/><stop offset="1" stop-color="${BLUE}" stop-opacity="0"/></linearGradient></defs><path d="${curve}V170H1160Z" fill="url(#g)" stroke="none"/><path d="${curve}" stroke-width="3"/><path d="${curve}" transform="translate(0 18)" stroke-width="1.4" stroke-dasharray="5 7" opacity=".7"/>${point(980, 40)}${point(580, 98)}${point(180, 40)}</svg>\n`;
}

export const highlightArtFiles = () => [
  ...HIGHLIGHT_ART_NAMES.map(name => ({ file: `${HIGHLIGHT_ART_DIR}/${name}.svg`, svg: renderHighlightArt(name) })),
  { file: `${HIGHLIGHT_ART_DIR}/${HIGHLIGHT_WAVE.file}`, svg: renderHighlightWave() },
];

async function main() {
  await fs.mkdir(path.join(repoRoot, ...HIGHLIGHT_ART_DIR.split("/")), { recursive: true });
  for (const { file, svg: content } of highlightArtFiles()) {
    await fs.writeFile(path.join(repoRoot, ...file.split("/")), content, "utf8");
    console.log(`${file}: ${Buffer.byteLength(content)} bytes`);
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
