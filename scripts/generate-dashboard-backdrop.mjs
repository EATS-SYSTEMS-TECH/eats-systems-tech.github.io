// scripts/generate-dashboard-backdrop.mjs
// The /dashboard/ background: the same construction as the sign-in backdrop
// (assets/img/login-backdrop.svg — a network globe, two meshes and a dense
// web of fine lines and dots, near-black at 3.5%) with its own wiring, drawn
// for a wide screen. Deterministic: a fixed seed gives the same file.
// Run: node scripts/generate-dashboard-backdrop.mjs

import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const output = fileURLToPath(
  new URL("../assets/img/dashboard-backdrop.svg", import.meta.url),
);
const width = 1440;
const height = 900;
let seed = 0x5eed2026;

function random() {
  seed = (seed + 0x6d2b79f5) | 0;
  let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
}

const round = (value) => Math.round(value * 10) / 10;
const between = (low, high) => low + random() * (high - low);

function scatter(count, inside) {
  const points = [];
  while (points.length < count) {
    const point = inside();
    if (points.every((other) => Math.hypot(other[0] - point[0], other[1] - point[1]) > 34))
      points.push(point);
  }
  return points;
}

// Each node links to its nearest neighbours: a sparse, connected-looking net.
function wire(points, neighbours) {
  const edges = new Set();
  points.forEach((point, index) => {
    points
      .map((other, otherIndex) => [Math.hypot(other[0] - point[0], other[1] - point[1]), otherIndex])
      .filter(([, otherIndex]) => otherIndex !== index)
      .sort((a, b) => a[0] - b[0])
      .slice(0, neighbours)
      .forEach(([, otherIndex]) => edges.add([index, otherIndex].sort((a, b) => a - b).join(":")));
  });
  return [...edges].map((key) => key.split(":").map((index) => points[Number(index)]));
}

const line = ([a, b]) =>
  `<line x1="${round(a[0])}" y1="${round(a[1])}" x2="${round(b[0])}" y2="${round(b[1])}" />`;
const node = ([x, y], r) => `<circle cx="${round(x)}" cy="${round(y)}" r="${r}" />`;

// The globe: lower left, mostly off the edge (the sign-in globe is upper right).
const globe = { x: 250, y: 700, r: 330 };
const globePoints = scatter(26, () => {
  const angle = random() * Math.PI * 2;
  const distance = Math.sqrt(random()) * (globe.r - 18);
  return [globe.x + Math.cos(angle) * distance, globe.y + Math.sin(angle) * distance];
});
const globeEdges = wire(globePoints, 3);
const meridians = [-0.62, -0.25, 0.25, 0.62].map((bend) => {
  const top = [globe.x, globe.y - globe.r];
  const bottom = [globe.x, globe.y + globe.r];
  const pull = globe.r * bend * 1.35;
  return `<path d="M${top[0]} ${top[1]}C${round(globe.x + pull)} ${round(globe.y - globe.r * 0.55)} ${round(globe.x + pull)} ${round(globe.y + globe.r * 0.55)} ${bottom[0]} ${bottom[1]}" />`;
});
const parallels = [-0.58, -0.2, 0.2, 0.58].map((offset) => {
  const y = globe.y + globe.r * offset;
  const half = Math.sqrt(1 - offset * offset) * globe.r;
  const sag = globe.r * 0.16 * (offset < 0 ? 1 : -1);
  return `<path d="M${round(globe.x - half)} ${round(y)}C${round(globe.x - half * 0.4)} ${round(y + sag)} ${round(globe.x + half * 0.4)} ${round(y + sag)} ${round(globe.x + half)} ${round(y)}" />`;
});

// Two meshes: upper right and lower right.
const upperMesh = scatter(18, () => [between(1010, 1470), between(-30, 280)]);
const lowerMesh = scatter(12, () => [between(1080, 1460), between(640, 930)]);

// The dense web: a jittered lattice, each point tied to its right and lower
// neighbours and one diagonal.
const step = 46;
const columns = Math.ceil(width / step) + 2;
const rows = Math.ceil(height / step) + 2;
const lattice = [];
for (let row = 0; row < rows; row++) {
  lattice.push([]);
  for (let column = 0; column < columns; column++)
    lattice[row].push([
      round((column - 1) * step + between(-14, 14)),
      round((row - 1) * step + between(-14, 14)),
    ]);
}
const segments = [];
for (let row = 0; row < rows; row++)
  for (let column = 0; column < columns; column++) {
    const point = lattice[row][column];
    const next = [];
    if (column + 1 < columns) next.push(lattice[row][column + 1]);
    if (row + 1 < rows) next.push(lattice[row + 1][column]);
    if (row + 1 < rows && column + 1 < columns && random() < 0.5)
      next.push(lattice[row + 1][column + 1]);
    else if (row + 1 < rows && column > 0) next.push(lattice[row + 1][column - 1]);
    for (const target of next) segments.push(`M${point[0]} ${point[1]}L${target[0]} ${target[1]}`);
  }
const dots = lattice
  .flat()
  .filter(() => random() < 0.42)
  .map(([x, y]) => {
    const r = round(between(0.3, 0.55));
    return `M${round(x - r)} ${y}a${r} ${r} 0 1 0 ${round(r * 2)} 0a${r} ${r} 0 1 0 ${round(-r * 2)} 0`;
  });

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid slice">
<defs><clipPath id="dashboardGlobeClip"><circle cx="${globe.x}" cy="${globe.y}" r="${globe.r}" /></clipPath></defs>
<g fill="none" opacity="0.035" stroke="#111111">
<circle cx="${globe.x}" cy="${globe.y}" r="${globe.r}" stroke-width="1.2" />
<g clip-path="url(#dashboardGlobeClip)">
${[...meridians, ...parallels].join("\n")}
<g stroke-width="1">
${globeEdges.map(line).join("\n")}
</g>
</g>
<g fill="#111111" stroke="none">
${globePoints.map((point, index) => node(point, index % 4 === 0 ? 3.2 : 1.4)).join("\n")}
</g>
<g stroke-width="0.8">
${wire(upperMesh, 2).map(line).join("\n")}
${wire(lowerMesh, 2).map(line).join("\n")}
</g>
<g fill="#111111" stroke="none">
${[...upperMesh, ...lowerMesh].map((point, index) => node(point, index % 5 === 0 ? 2.6 : 1.1)).join("\n")}
</g>
<path stroke-width="0.5" stroke-linecap="round" d="${segments.join("")}" />
<path fill="#111111" stroke="none" d="${dots.join("")}" />
</g>
</svg>
`;

await writeFile(output, svg);
console.log(`dashboard-backdrop.svg ${svg.length} bytes, ${segments.length} web segments, ${dots.length} dots`);
