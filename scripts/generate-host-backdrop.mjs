// scripts/generate-host-backdrop.mjs
// The /dashboard/host/ background: the picker's construction (a network
// globe, meshes and a dense web of fine lines and dots, near-black at 3.5%)
// with its own wiring. The globe sits low on the end side, away from the
// sidebar; the web is calmer and thins out behind the content column; and a
// few long cables run along the margins from the globe to the meshes, each
// ending in a small rounded-square gate pad. The page mirrors it in RTL.
// Deterministic: a fixed seed gives the same file.
// Run: node scripts/generate-host-backdrop.mjs

import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  createRandom,
  round,
  between,
  scatter,
  wire,
  line,
  node,
  globePoints,
  globeArcs,
  lattice,
  dots,
} from "./lib/network-backdrop.mjs";

const output = fileURLToPath(
  new URL("../assets/img/host-backdrop.svg", import.meta.url),
);
const width = 1440;
const height = 900;
const random = createRandom(0x40572026);

// The globe: lower end, mostly off the edge (the picker's is lower start).
const globe = { x: 1240, y: 800, r: 300 };
const globeNodes = globePoints(random, globe, 22);
const globeEdges = wire(globeNodes, 2);
const arcs = globeArcs(globe);

// Three meshes: upper end, lower middle (just past the sidebar) and a small
// one behind the top of the sidebar.
const endMesh = scatter(14, () => [
  between(random, 1080, 1460),
  between(random, 90, 330),
]);
const lowerMesh = scatter(10, () => [
  between(random, 300, 640),
  between(random, 720, 940),
]);
const sidebarMesh = scatter(8, () => [
  between(random, 30, 260),
  between(random, 70, 290),
]);

// The content column right of the 288px sidebar stays calm: most of the web
// inside this ellipse is left out, and its dots are dropped.
const calm = { x: 864, y: 470, rx: 430, ry: 300 };
const inCalm = ([x, y]) =>
  ((x - calm.x) / calm.rx) ** 2 + ((y - calm.y) / calm.ry) ** 2 < 1;
const web = lattice(random, {
  width,
  height,
  step: 56,
  jitter: 10,
  diagonal: 0.25,
  keep: (a, b) =>
    !inCalm([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]) || random() < 0.25,
});
const webDots = dots(random, web.points, 0.3, (point) => !inCalm(point));

// Cables: long quadratic curves whose control point is pushed past the
// nearest canvas edge, so each one bows out along a margin. Each cable ends in
// a gate pad: the app's gate icon box at 1/8 scale.
function cable(from, to) {
  const middle = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
  const edges = [
    [middle[0], [-60, middle[1]]],
    [width - middle[0], [width + 60, middle[1]]],
    [middle[1], [middle[0], -60]],
    [height - middle[1], [middle[0], height + 60]],
  ].sort((a, b) => a[0] - b[0]);
  const control = edges[0][1];
  return `<path d="M${round(from[0])} ${round(from[1])}Q${round(control[0])} ${round(control[1])} ${round(to[0])} ${round(to[1])}" />`;
}
const pad = ([x, y]) =>
  `<rect x="${round(x - 3.5)}" y="${round(y - 3.5)}" width="7" height="7" rx="2" />`;
const pick = (points) => points[Math.floor(random() * points.length)];
const cables = [
  ...[0, 1, 2].map(() => [pick(globeNodes), pick(endMesh)]),
  ...[0, 1, 2].map(() => [pick(globeNodes), pick(lowerMesh)]),
  ...[0, 1].map(() => [pick(endMesh), pick(sidebarMesh)]),
];

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid slice">
<defs><clipPath id="hostGlobeClip"><circle cx="${globe.x}" cy="${globe.y}" r="${globe.r}" /></clipPath></defs>
<g fill="none" opacity="0.035" stroke="#111111">
<path stroke-width="0.5" stroke-linecap="round" d="${web.segments.join("")}" />
<path fill="#111111" stroke="none" d="${webDots.join("")}" />
<circle cx="${globe.x}" cy="${globe.y}" r="${globe.r}" stroke-width="1.2" />
<g clip-path="url(#hostGlobeClip)">
${arcs.join("\n")}
<g stroke-width="1">
${globeEdges.map(line).join("\n")}
</g>
</g>
<g fill="#111111" stroke="none">
${globeNodes.map((point, index) => node(point, index % 4 === 0 ? 3.2 : 1.4)).join("\n")}
</g>
<g stroke-width="0.8">
${wire(endMesh, 2).map(line).join("\n")}
${wire(lowerMesh, 2).map(line).join("\n")}
${wire(sidebarMesh, 2).map(line).join("\n")}
</g>
<g fill="#111111" stroke="none">
${[...endMesh, ...lowerMesh, ...sidebarMesh].map((point, index) => node(point, index % 5 === 0 ? 2.6 : 1.1)).join("\n")}
</g>
<g stroke-width="0.7" stroke-linecap="round">
${cables.map(([from, to]) => cable(from, to)).join("\n")}
</g>
<g stroke-width="1" fill="#ffffff">
${cables.map(([, to]) => pad(to)).join("\n")}
</g>
</g>
</svg>
`;

await writeFile(output, svg);
console.log(
  `host-backdrop.svg ${svg.length} bytes, ${web.segments.length} web segments, ${webDots.length} dots, ${cables.length} cables`,
);
