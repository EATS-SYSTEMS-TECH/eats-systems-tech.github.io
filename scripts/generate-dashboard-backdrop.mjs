// scripts/generate-dashboard-backdrop.mjs
// The /dashboard/ background: the same construction as the sign-in backdrop
// (assets/img/login-backdrop.svg — a network globe, two meshes and a dense
// web of fine lines and dots, near-black at 3.5%) with its own wiring, drawn
// for a wide screen. Deterministic: a fixed seed gives the same file.
// Run: node scripts/generate-dashboard-backdrop.mjs

import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  createRandom,
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
  new URL("../assets/img/dashboard-backdrop.svg", import.meta.url),
);
const width = 1440;
const height = 900;
const random = createRandom(0x5eed2026);

// The globe: lower left, mostly off the edge (the sign-in globe is upper right).
const globe = { x: 250, y: 700, r: 330 };
const globeNodes = globePoints(random, globe, 26);
const globeEdges = wire(globeNodes, 3);
const arcs = globeArcs(globe);

// Two meshes: upper right and lower right.
const upperMesh = scatter(18, () => [
  between(random, 1010, 1470),
  between(random, -30, 280),
]);
const lowerMesh = scatter(12, () => [
  between(random, 1080, 1460),
  between(random, 640, 930),
]);

// The dense web.
const web = lattice(random, { width, height, step: 46, jitter: 14 });
const webDots = dots(random, web.points, 0.42);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid slice">
<defs><clipPath id="dashboardGlobeClip"><circle cx="${globe.x}" cy="${globe.y}" r="${globe.r}" /></clipPath></defs>
<g fill="none" opacity="0.035" stroke="#111111">
<circle cx="${globe.x}" cy="${globe.y}" r="${globe.r}" stroke-width="1.2" />
<g clip-path="url(#dashboardGlobeClip)">
${arcs.join("\n")}
<g stroke-width="1">
${globeEdges.map(line).join("\n")}
</g>
</g>
<g fill="#111111" stroke="none">
${globeNodes.map((point, index) => node(point, index % 4 === 0 ? 3.2 : 1.4)).join("\n")}
</g>
<g stroke-width="0.8">
${wire(upperMesh, 2).map(line).join("\n")}
${wire(lowerMesh, 2).map(line).join("\n")}
</g>
<g fill="#111111" stroke="none">
${[...upperMesh, ...lowerMesh].map((point, index) => node(point, index % 5 === 0 ? 2.6 : 1.1)).join("\n")}
</g>
<path stroke-width="0.5" stroke-linecap="round" d="${web.segments.join("")}" />
<path fill="#111111" stroke="none" d="${webDots.join("")}" />
</g>
</svg>
`;

await writeFile(output, svg);
console.log(
  `dashboard-backdrop.svg ${svg.length} bytes, ${web.segments.length} web segments, ${webDots.length} dots`,
);
