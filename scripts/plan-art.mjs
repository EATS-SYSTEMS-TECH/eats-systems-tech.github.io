// scripts/plan-art.mjs
// The small drawing that stands on the top edge of a pricing card of the
// WIFIGATE Host and WIFIGATE Manager pages (owner request, 13 Nov 2026). The
// card's top line is the ground: the Host plans show one plant at three ages
// (START a sprout, GROWTH a sapling, SCALE a tree), the Manager cards show
// what they price (a gate, a row of buildings).
// Each drawing is a list of [tag, attributes] shapes in the site's line
// language: one colour (currentColor), a main line and a paler thin one, a
// faint tint and solid node dots. The view box is 120 wide; its bottom edge
// is the ground.
const round = value => String(Math.round(value * 10) / 10);
const line = d => ["path", { d }];
const thin = d => ["path", { d, "stroke-width": "1.3", opacity: ".75" }];
const tint = d => ["path", { d, fill: "currentColor", "fill-opacity": ".1", stroke: "none" }];
const dot = (cx, cy, r = 2.4) => ["circle", { cx: String(cx), cy: String(cy), r: String(r), fill: "currentColor", stroke: "none" }];
const ring = (cx, cy, r) => ["circle", { cx: String(cx), cy: String(cy), r: String(r), "stroke-width": "1.3", opacity: ".75" }];
const shape = d => [tint(d), line(d)];

// A leaf that leaves the stem at (x, y) to one side (-1 or 1), with its midrib.
function leaf(x, y, side, size) {
  const at = (dx, dy) => `${round(x + side * dx * size)} ${round(y + dy * size)}`;
  const outline = `M${x} ${y}C${at(0.1, -0.55)} ${at(0.6, -0.85)} ${at(1, -0.7)}C${at(0.95, -0.2)} ${at(0.5, 0.05)} ${x} ${y}Z`;
  return [...shape(outline), thin(`M${x} ${y}L${at(0.72, -0.5)}`)];
}
// The soil the plant stands in: a low mound on the card's line.
const mound = (x0, x1, ground, rise) => [tint(`M${x0} ${ground}Q${(x0 + x1) / 2} ${ground - rise * 2} ${x1} ${ground}Z`), line(`M${x0} ${ground}Q${(x0 + x1) / 2} ${ground - rise * 2} ${x1} ${ground}`)];

const DRAWINGS = {
  // START: the first two leaves are out of the soil
  sprout: { height: 46, shapes: () => [
    ...mound(40, 80, 46, 6), line("M60 41V27"),
    ...leaf(60, 28, -1, 20), ...leaf(60, 25, 1, 23),
  ] },
  // GROWTH: a stem with leaves on both sides and a bud at its top
  sapling: { height: 74, shapes: () => [
    ...mound(38, 82, 74, 6.5), line("M60 69V24"),
    ...leaf(60, 56, -1, 23), ...leaf(60, 49, 1, 23), ...leaf(60, 39, -1, 17), ...leaf(60, 33, 1, 16),
    ...shape("M60 25c-5.500 -5 -5.500 -12 0 -19c5.500 7 5.500 14 0 19Z"),
  ] },
  // SCALE: a grown tree, bearing fruit
  tree: { height: 100, shapes: () => [
    ...mound(34, 86, 100, 7),
    ...shape("M46 62a16.500 16.500 0 0 1 -7 -31a22 22 0 0 1 42 0a16.500 16.500 0 0 1 -7 31Z"),
    line("M56.500 95c1.200 -11 1.200 -22 0 -33M63.500 95c-1.200 -11 -1.200 -22 0 -33"),
    thin("M60 62V40M60 56l-11 -9M60 49l10 -8"),
    dot(47, 34), dot(72, 31), dot(60, 22), dot(69, 48, 2), dot(50, 50, 2),
  ] },
  // Manager, "Systems": a gate with its status light
  systems: { height: 70, shapes: () => [
    line("M30 70V26M90 70V26"),
    tint("M35 36h50v34h-50Z"), line("M35 70V36h50v34"),
    thin("M45 36v34M55 36v34M65 36v34M75 36v34"),
    ring(60, 14, 6.5), dot(60, 14, 2.8),
  ] },
  // Manager, "Organizations": separate buildings under one account
  organizations: { height: 70, shapes: () => [
    line("M22 70V38h22v32"), thin("M28 47h10M28 55h10M28 63h10"),
    tint("M49 70V12h24v58Z"), line("M49 70V12h24v58"), thin("M55 22h12M55 31h12M55 40h12M55 49h12M55 58h12"),
    line("M78 70V44h20v26"), thin("M84 53h8M84 61h8"),
  ] },
};

export const PLAN_ART_WIDTH = 120;
export const PLAN_ART_NAMES = Object.freeze(Object.keys(DRAWINGS));
export const hasPlanArt = name => Object.hasOwn(DRAWINGS, name);
// { width, height, shapes }: the caller builds the <svg> and its nodes.
export function planArt(name) {
  if (!hasPlanArt(name)) throw new Error(`Unknown plan drawing ${name}`);
  return { width: PLAN_ART_WIDTH, height: DRAWINGS[name].height, shapes: DRAWINGS[name].shapes() };
}
// The same drawing as markup, for review sheets and tests.
export function planArtSvg(name) {
  const { width, height, shapes } = planArt(name);
  const body = shapes.map(([tag, attributes]) => `<${tag}${Object.entries(attributes).map(([key, value]) => ` ${key}="${value}"`).join("")}/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}
