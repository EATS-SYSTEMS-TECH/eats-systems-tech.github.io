// scripts/audience-art.mjs
// One small illustration per customer type in the "Built for:" row of the
// WIFIGATE Host and WIFIGATE Manager pages, drawn in the language of the hero
// line animations: the same blue, an isometric view, pale context lines, one
// bold entrance that WIFIGATE opens, its status light and a faint tint in the
// opening. Faces are white and drawn back to front, so nearer faces hide the
// lines behind them.
// Regenerate after changing a drawing:
//   node scripts/audience-art.mjs
// scripts/host-marketing-page.test.mjs fails while a committed file differs
// from what this module draws.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const AUDIENCE_ART_DIR = "assets/img/audience";
export const AUDIENCE_ART_SIZE = Object.freeze({ width: 220, height: 170 });
const BLUE = "#146BFF";
const COS = Math.sqrt(3) / 2;
const PAD = 9, MAX_SCALE = 1.3;
const n1 = value => (Math.round(value * 10) / 10).toString();

// A drawing surface: world x runs to the lower right, y to the lower left
// (the street side), z up, exactly as the hero scenes are seen.
function surface({ scale, cx, cy }) {
  const parts = [], box = [Infinity, Infinity, -Infinity, -Infinity];
  const seen = (x, y, r = 0) => { box[0] = Math.min(box[0], x - r); box[1] = Math.min(box[1], y - r); box[2] = Math.max(box[2], x + r); box[3] = Math.max(box[3], y + r); };
  const P = ([x, y, z = 0]) => { const point = [cx + (x - y) * COS * scale, cy + (x + y) * 0.5 * scale - z * scale]; seen(point[0], point[1]); return point; };
  const d = (points, closed) => points.map((point, index) => `${index ? "L" : "M"}${n1(point[0])} ${n1(point[1])}`).join("") + (closed ? "Z" : "");
  const STYLES = {
    // context lines: thin and pale; primary lines: the entrance WIFIGATE opens; dashed: sites still to come
    c: 'stroke-width="1.3" stroke-opacity=".72"', p: 'stroke-width="2.4"', d: 'stroke-width="1.3" stroke-opacity=".72" stroke-dasharray="4 4"',
  };
  const FILLS = { white: 'fill="#fff"', tint: `fill="${BLUE}" fill-opacity=".1"`, none: "" };
  const api = {
    P, scale, box,
    // a closed face (white unless told otherwise) or an open line
    face(points, style = "c", fill = "white") { parts.push(`<path d="${d(points.map(P), true)}" ${FILLS[fill]} ${STYLES[style]}/>`); },
    line(points, style = "c") { parts.push(`<path d="${d(points.map(P), false)}" ${STYLES[style]}/>`); },
    tint(points) { parts.push(`<path d="${d(points.map(P), true)}" ${FILLS.tint} stroke="none"/>`); },
    // a box: its top, street (+y) and right (+x) faces
    box3(x, y, z, dx, dy, dz, style = "c") {
      const x1 = x + dx, y1 = y + dy, z1 = z + dz;
      api.face([[x, y, z1], [x1, y, z1], [x1, y1, z1], [x, y1, z1]], style);
      api.face([[x, y1, z], [x1, y1, z], [x1, y1, z1], [x, y1, z1]], style);
      api.face([[x1, y, z], [x1, y1, z], [x1, y1, z1], [x1, y, z1]], style);
    },
    // rectangles on a street-facing (y = const) or right-facing (x = const) wall
    front(x0, x1, y, z0, z1, style = "c", fill = "none") { api.face([[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]], style, fill); },
    side(x, y0, y1, z0, z1, style = "c", fill = "none") { api.face([[x, y0, z0], [x, y1, z0], [x, y1, z1], [x, y0, z1]], style, fill); },
    // a circle lying on a horizontal plane
    ring(x, y, z, r, style = "c", fill = "none") {
      const points = [];
      for (let k = 0; k < 32; k++) { const a = Math.PI * k / 16; points.push([x + r * Math.cos(a), y + r * Math.sin(a), z]); }
      api.face(points, style, fill);
    },
    // a round mark that faces the viewer (a tree crown); r is in world units
    disc(x, y, z, r) {
      const [sx, sy] = P([x, y, z]); seen(sx, sy, r * scale + 1);
      parts.push(`<circle cx="${n1(sx)}" cy="${n1(sy)}" r="${n1(r * scale)}" fill="#fff" ${STYLES.c}/>`);
    },
    // the status light of the hero scenes: a ring with a solid centre, clear of the lines around it
    light(x, y, z) {
      const [sx, sy] = P([x, y, z]); seen(sx, sy, 8);
      parts.push(`<circle cx="${n1(sx)}" cy="${n1(sy)}" r="7.5" fill="#fff" stroke="none"/><circle cx="${n1(sx)}" cy="${n1(sy)}" r="5" stroke-width="1.4"/><circle cx="${n1(sx)}" cy="${n1(sy)}" r="2.4" fill="${BLUE}" stroke="none"/>`);
    },
    // the plus of the open ending
    plus(x, y, z) {
      const [sx, sy] = P([x, y, z]); seen(sx, sy, 15);
      parts.push(`<circle cx="${n1(sx)}" cy="${n1(sy)}" r="13" fill="#fff" ${STYLES.p}/><path d="M${n1(sx - 6)} ${n1(sy)}h12M${n1(sx)} ${n1(sy - 6)}v12" ${STYLES.p}/>`);
    },
    // the plate every site stands on, as in the hero's wide view
    plate(w, depth, style = "c") {
      api.face([[0, 0, 0], [w, 0, 0], [w, depth, 0], [0, depth, 0]], style);
      api.line([[0, depth, 0], [0, depth, -4], [w, depth, -4], [w, 0, -4], [w, 0, 0]], style);
      api.line([[w, depth, 0], [w, depth, -4]], style);
    },
    svg() {
      const { width, height } = AUDIENCE_ART_SIZE;
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" fill="none" stroke="${BLUE}" stroke-linecap="round" stroke-linejoin="round">${parts.join("")}</svg>\n`;
    },
  };
  return api;
}

// Every drawing is laid out to be measured, then fitted and centred in the
// frame, so the line weights stay the same whatever the size of the site.
// Fixed-size marks (lights, the plus) do not scale, so the fit is refined.
function fitted(draw) {
  const { width, height } = AUDIENCE_ART_SIZE;
  const laid = at => { const s = surface(at); draw(s); return s; };
  let at = { scale: 1, cx: 0, cy: 0 };
  for (let pass = 0; pass < 3; pass++) {
    const [x0, y0, x1, y1] = laid(at).box;
    const scale = Math.min(MAX_SCALE, at.scale * Math.min((width - 2 * PAD) / (x1 - x0), (height - 2 * PAD) / (y1 - y0)));
    const now = laid({ scale, cx: 0, cy: 0 }).box;
    at = { scale, cx: (width - now[0] - now[2]) / 2, cy: (height - now[1] - now[3]) / 2 };
  }
  return laid(at).svg();
}

// Shared pieces ---------------------------------------------------------------
// A double door in a street-facing wall: tinted opening, bold frame, centre line.
function doubleDoor(s, x0, x1, y, h) {
  s.tint([[x0, y, 0], [x1, y, 0], [x1, y, h], [x0, y, h]]);
  s.front(x0, x1, y, 0, h, "p");
  s.line([[(x0 + x1) / 2, y, 0], [(x0 + x1) / 2, y, h]], "p");
}
// A single door with its handle.
function door(s, x0, x1, y, h) {
  s.tint([[x0, y, 0], [x1, y, 0], [x1, y, h], [x0, y, h]]);
  s.front(x0, x1, y, 0, h, "p");
  s.line([[x1 - 3, y, h * 0.42], [x1 - 3, y, h * 0.6]], "p");
}
// The parked car of the hero scene: a body and a cabin.
function car(s, x, y, w = 16, l = 30) {
  s.box3(x, y, 0, w, l, 6);
  s.box3(x + 2, y + 7, 6, w - 4, l - 15, 5);
}
// A gable roof whose ridge runs along y; the gable end faces the street.
function roofAlongY(s, x0, x1, y0, y1, z, rise) {
  const xm = (x0 + x1) / 2;
  s.face([[x0, y0, z], [x0, y1, z], [xm, y1, z + rise], [xm, y0, z + rise]]);
  s.face([[x1, y0, z], [x1, y1, z], [xm, y1, z + rise], [xm, y0, z + rise]]);
  s.face([[x0, y1, z], [x1, y1, z], [xm, y1, z + rise]]);
}
// A round tree: a trunk and a crown.
function tree(s, x, y, h = 16, r = 8) {
  s.line([[x, y, 0], [x, y, h]]);
  s.disc(x, y, h + r * 0.7, r);
}

// The drawings ----------------------------------------------------------------
const DRAWINGS = {
  // Manager ---------------------------------------------------------------
  "manager-residential": s => {
    s.plate(96, 84);
    s.box3(60, 12, 0, 28, 36, 62);                                  // the lower neighbour
    [16, 30, 44].forEach(z => { s.front(64, 84, 48, z, z + 8); });
    s.line([[22, 56, 0], [22, 84, 0]]); s.line([[42, 56, 0], [42, 84, 0]]);   // the walkway
    s.box3(12, 14, 0, 40, 42, 104);                                 // the tower
    s.face([[16, 18, 104], [48, 18, 104], [48, 52, 104], [16, 52, 104]]);
    [32, 50, 68, 86].forEach(z => {
      s.front(16, 30, 56, z, z + 9); s.side(52, 20, 50, z, z + 9);
      s.box3(33, 56, z - 2, 15, 5, 5);                              // a balcony per floor
    });
    s.box3(19, 56, 22, 26, 7, 2.5);                                 // the canopy
    doubleDoor(s, 24, 40, 56, 18);
    s.light(47, 56, 12);
  },
  "manager-offices": s => {
    s.plate(104, 80);
    s.line([[44, 56, 0], [44, 80, 0]]); s.line([[68, 56, 0], [68, 80, 0]]);
    s.box3(10, 14, 0, 84, 42, 72);
    s.face([[15, 19, 72], [89, 19, 72], [89, 51, 72], [15, 51, 72]]);
    s.box3(60, 24, 72, 18, 14, 7);                                  // the roof plant
    // the curtain wall: one glazed field, its mullions and floors
    s.front(15, 89, 56, 24, 66); s.side(94, 19, 51, 24, 66);
    [28, 41, 54, 67, 80].forEach(x => s.line([[x, 56, 24], [x, 56, 66]]));
    [38, 52].forEach(z => { s.line([[15, 56, z], [89, 56, z]]); s.line([[94, 19, z], [94, 51, z]]); });
    [30, 40].forEach(y => s.line([[94, y, 24], [94, y, 66]]));
    s.box3(40, 56, 20, 32, 6, 2.5);
    doubleDoor(s, 46, 66, 56, 17);
    s.light(78, 56, 11);
  },
  "manager-sports": s => {
    s.plate(112, 94);
    // floodlights at the back
    [[8, 14], [104, 14]].forEach(([x, y]) => { s.line([[x, y, 0], [x, y, 44]]); s.front(x - 5, x + 5, y, 44, 50, "c", "white"); s.line([[x, y, 44], [x, y, 50]]); });
    // the pitch: touchlines, halfway line, centre circle, goal areas and goals
    s.face([[14, 26, 0], [98, 26, 0], [98, 76, 0], [14, 76, 0]], "c", "none");
    s.line([[56, 26, 0], [56, 76, 0]]);
    s.ring(56, 51, 0, 10);
    s.line([[14, 39, 0], [26, 39, 0], [26, 63, 0], [14, 63, 0]]); s.line([[98, 39, 0], [86, 39, 0], [86, 63, 0], [98, 63, 0]]);
    [14, 98].forEach(x => {
      const back = x < 56 ? x - 5 : x + 5;
      s.line([[x, 45, 0], [x, 45, 9], [x, 57, 9], [x, 57, 0]]);
      s.line([[x, 45, 9], [back, 45, 0]]); s.line([[x, 57, 9], [back, 57, 0]]); s.line([[back, 45, 0], [back, 57, 0]]);
    });
    // the fence along the right side and the street, with its bold gate
    const rail = 12;
    s.line([[106, 22, rail], [106, 88, rail], [70, 88, rail]]); s.line([[46, 88, rail], [6, 88, rail]]);
    [22, 44, 66, 88].forEach(y => s.line([[106, y, 0], [106, y, rail]]));
    [6, 26, 88].forEach(x => s.line([[x, 88, 0], [x, 88, rail]]));
    s.tint([[46, 88, 0], [70, 88, 0], [70, 88, 16], [46, 88, 16]]);
    s.front(46, 70, 88, 0, 16, "p"); s.line([[58, 88, 0], [58, 88, 16]], "p");
    s.light(79, 88, 22);
  },
  "manager-parking": s => {
    s.plate(108, 92);
    // bays along the back, three of them taken
    for (let i = 0; i <= 4; i++) s.line([[10 + i * 22, 6, 0], [10 + i * 22, 42, 0]]);
    car(s, 13, 8); car(s, 57, 8); car(s, 79, 8);
    // the lane in from the street, its islands and the barrier across it
    s.line([[36, 62, 0], [36, 92, 0]]); s.line([[92, 62, 0], [92, 92, 0]]);
    s.box3(10, 62, 0, 26, 14, 3);
    s.box3(92, 62, 0, 8, 14, 3);
    s.box3(94, 66, 3, 3, 4, 17, "p");
    s.box3(22, 64, 3, 11, 9, 23, "p");
    s.face([[31, 69, 18], [96, 69, 18], [96, 69, 23], [31, 69, 23]], "p");
    [42, 53, 64, 75, 86].forEach(x => s.line([[x, 69, 18], [x + 4, 69, 23]]));
    s.light(27, 69, 38);
  },
  // Host ------------------------------------------------------------------
  "host-hotels": s => {
    s.plate(104, 84);
    s.line([[40, 58, 0], [40, 84, 0]]); s.line([[66, 58, 0], [66, 84, 0]]);
    s.box3(12, 14, 0, 80, 44, 92);
    s.face([[17, 19, 92], [87, 19, 92], [87, 53, 92], [17, 53, 92]]);
    s.box3(24, 51, 92, 42, 3, 13);                                  // the roof sign
    // rooms: a window per room
    [30, 46, 62, 78].forEach(z => {
      [18, 33, 48, 63, 78].forEach(x => s.front(x, x + 9, 58, z, z + 9));
      [20, 32, 44].forEach(y => s.side(92, y, y + 8, z, z + 9));
    });
    s.box3(36, 58, 21, 34, 10, 2.5);                                // the canopy
    doubleDoor(s, 43, 63, 58, 18);
    s.box3(74, 64, 0, 10, 6, 12);                                   // a suitcase by the door
    s.line([[76.5, 70, 12], [76.5, 70, 18], [81.5, 70, 18], [81.5, 70, 12]]);
    s.light(26, 58, 12);
  },
  "host-rentals": s => {
    s.plate(100, 88);
    // a two-storey holiday apartment with a flat roof and a balcony
    s.box3(14, 12, 0, 54, 40, 52);
    s.face([[18, 16, 52], [64, 16, 52], [64, 48, 52], [18, 48, 52]]);
    s.side(68, 18, 46, 32, 44); s.side(68, 18, 46, 8, 20);
    s.front(20, 40, 52, 29, 44); s.line([[30, 52, 29], [30, 52, 44]]);       // the balcony door
    s.front(20, 38, 52, 6, 18);
    s.box3(16, 52, 26, 28, 8, 2);                                   // the balcony slab and its rail
    s.side(44, 52, 60, 28, 36);
    s.front(16, 44, 60, 28, 36);
    [23, 30, 37].forEach(x => s.line([[x, 60, 28], [x, 60, 36]]));
    door(s, 48, 60, 52, 21);
    // the terrace: a lounger and a sun umbrella
    s.box3(72, 62, 0, 8, 20, 3);
    s.line([[88, 70, 0], [88, 70, 20]]);
    s.ring(88, 70, 20, 12, "c", "white");
    for (let k = 0; k < 6; k++) { const a = Math.PI * k / 3; s.line([[88, 70, 27], [88 + 12 * Math.cos(a), 70 + 12 * Math.sin(a), 20]]); }
    s.light(66, 52, 30);
  },
  "host-guesthouses": s => {
    s.plate(98, 86);
    tree(s, 84, 22, 18, 9);
    // a house with its gable to the street, a chimney and a sign on a post
    s.box3(20, 14, 0, 46, 40, 34);
    roofAlongY(s, 17, 69, 11, 57, 34, 22);
    s.box3(52, 22, 42, 6, 6, 16);
    s.side(66, 20, 30, 12, 24); s.side(66, 38, 48, 12, 24);
    s.front(26, 38, 54, 12, 24); s.line([[32, 54, 12], [32, 54, 24]]); s.line([[26, 54, 18], [38, 54, 18]]);
    s.front(38, 48, 54, 38, 47);
    door(s, 46, 58, 54, 22);
    s.line([[46, 54, 0], [46, 86, 0]]); s.line([[58, 54, 0], [58, 86, 0]]);
    s.line([[12, 76, 0], [12, 76, 30], [28, 76, 30]]);
    s.front(16, 28, 76, 16, 27, "c", "white"); s.line([[19, 76, 21.5], [25, 76, 21.5]]);
    s.light(70, 54, 12);
  },
  "host-parking": s => {
    s.plate(100, 92);
    // a private garage: the sectional door is half open and a car waits on the drive
    s.box3(16, 8, 0, 64, 40, 36);
    s.face([[20, 12, 36], [76, 12, 36], [76, 44, 36], [20, 44, 36]]);
    s.side(80, 16, 40, 12, 26);
    s.tint([[26, 48, 0], [70, 48, 0], [70, 48, 14], [26, 48, 14]]);
    s.line([[26, 48, 0], [26, 42, 0]]);
    s.front(26, 70, 48, 0, 28, "p");
    s.line([[26, 48, 14], [70, 48, 14]], "p");
    [18.5, 23].forEach(z => s.line([[26, 48, z], [70, 48, z]]));
    s.line([[26, 48, 0], [26, 92, 0]]); s.line([[70, 48, 0], [70, 92, 0]]);
    car(s, 40, 56, 16, 30);
    s.light(77, 48, 22);
  },
  "host-storage": s => {
    s.plate(108, 86);
    // a row of storage units behind roller doors; one is open, with boxes on the way in
    s.box3(8, 10, 0, 92, 36, 32);
    s.face([[12, 14, 32], [96, 14, 32], [96, 42, 32], [12, 42, 32]]);
    s.side(100, 16, 40, 8, 24); s.line([[100, 28, 8], [100, 28, 24]]);
    [[14, 36], [70, 92]].forEach(([x0, x1]) => {
      s.front(x0, x1, 46, 0, 24);
      [6, 12, 18].forEach(z => s.line([[x0, 46, z], [x1, 46, z]]));
    });
    s.tint([[42, 46, 0], [64, 46, 0], [64, 46, 14], [42, 46, 14]]);
    s.line([[42, 46, 0], [42, 40, 0]]);
    s.front(42, 64, 46, 0, 24, "p");
    s.line([[42, 46, 14], [64, 46, 14]], "p"); s.line([[42, 46, 19], [64, 46, 19]]);
    s.box3(44, 58, 0, 12, 12, 10); s.box3(47, 61, 10, 8, 8, 7);
    s.box3(62, 66, 0, 9, 9, 8);
    s.light(96, 46, 29);
  },
  // The open ending: sites still to come, in dashed outline, and a plus.
  more: s => {
    s.plate(100, 84, "d");
    s.box3(54, 14, 0, 30, 30, 44, "d");
    s.box3(16, 22, 0, 30, 34, 70, "d");
    s.box3(58, 52, 0, 26, 22, 22, "d");
    s.plus(40, 84, 26);
  },
};

// The drawing for each entry of a product's audience list, in the list's order
// (scripts/homepage-copy/*.mjs: automation.audiences, automation.manager.audiences).
export const AUDIENCE_ART = Object.freeze({
  host: Object.freeze(["host-hotels", "host-rentals", "host-guesthouses", "host-parking", "host-storage", "more"]),
  manager: Object.freeze(["manager-residential", "manager-offices", "manager-sports", "manager-parking", "more"]),
});
export const AUDIENCE_ART_NAMES = Object.freeze(Object.keys(DRAWINGS));
export const audienceArtPath = name => `${AUDIENCE_ART_DIR}/${name}.svg`;
export function renderAudienceArt(name) {
  if (!DRAWINGS[name]) throw new Error(`Unknown audience drawing ${name}`);
  return fitted(DRAWINGS[name]);
}

async function main() {
  await fs.mkdir(path.join(repoRoot, ...AUDIENCE_ART_DIR.split("/")), { recursive: true });
  for (const name of AUDIENCE_ART_NAMES) {
    const file = audienceArtPath(name), svg = renderAudienceArt(name);
    await fs.writeFile(path.join(repoRoot, ...file.split("/")), svg, "utf8");
    console.log(`${file}: ${Buffer.byteLength(svg)} bytes`);
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
