// scripts/lib/network-backdrop.mjs
// Shared drawing helpers for the dashboard backdrops: a seeded generator, a
// spaced scatter, nearest-neighbour wiring, a network globe and the dense web
// of fine lines and dots. Every helper takes the generator it draws from, so
// each backdrop stays deterministic: a fixed seed gives the same file.

export function createRandom(seed) {
  let state = seed;
  return function random() {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export const round = (value) => Math.round(value * 10) / 10;

export const between = (random, low, high) => low + random() * (high - low);

export function scatter(count, inside, spacing = 34) {
  const points = [];
  while (points.length < count) {
    const point = inside();
    if (
      points.every(
        (other) =>
          Math.hypot(other[0] - point[0], other[1] - point[1]) > spacing,
      )
    )
      points.push(point);
  }
  return points;
}

// Each node links to its nearest neighbours: a sparse, connected-looking net.
export function wire(points, neighbours) {
  const edges = new Set();
  points.forEach((point, index) => {
    points
      .map((other, otherIndex) => [
        Math.hypot(other[0] - point[0], other[1] - point[1]),
        otherIndex,
      ])
      .filter(([, otherIndex]) => otherIndex !== index)
      .sort((a, b) => a[0] - b[0])
      .slice(0, neighbours)
      .forEach(([, otherIndex]) =>
        edges.add([index, otherIndex].sort((a, b) => a - b).join(":")),
      );
  });
  return [...edges].map((key) =>
    key.split(":").map((index) => points[Number(index)]),
  );
}

export const line = ([a, b]) =>
  `<line x1="${round(a[0])}" y1="${round(a[1])}" x2="${round(b[0])}" y2="${round(b[1])}" />`;

export const node = ([x, y], r) =>
  `<circle cx="${round(x)}" cy="${round(y)}" r="${r}" />`;

// Points spread inside the globe, kept clear of its rim.
export function globePoints(random, globe, count) {
  return scatter(count, () => {
    const angle = random() * Math.PI * 2;
    const distance = Math.sqrt(random()) * (globe.r - 18);
    return [
      globe.x + Math.cos(angle) * distance,
      globe.y + Math.sin(angle) * distance,
    ];
  });
}

// Four meridians and four parallels: the curved lines that make a globe.
export function globeArcs(globe) {
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
  return [...meridians, ...parallels];
}

// The dense web: a jittered lattice, each point tied to its right and lower
// neighbours and one diagonal. `keep(a, b)` may drop a segment (a calm zone);
// it is asked only after the diagonal is chosen, so the draw order matches.
export function lattice(
  random,
  { width, height, step, jitter, diagonal = 0.5, keep = () => true },
) {
  const columns = Math.ceil(width / step) + 2;
  const rows = Math.ceil(height / step) + 2;
  const points = [];
  for (let row = 0; row < rows; row++) {
    points.push([]);
    for (let column = 0; column < columns; column++)
      points[row].push([
        round((column - 1) * step + between(random, -jitter, jitter)),
        round((row - 1) * step + between(random, -jitter, jitter)),
      ]);
  }
  const segments = [];
  for (let row = 0; row < rows; row++)
    for (let column = 0; column < columns; column++) {
      const point = points[row][column];
      const next = [];
      if (column + 1 < columns) next.push(points[row][column + 1]);
      if (row + 1 < rows) next.push(points[row + 1][column]);
      if (row + 1 < rows && column + 1 < columns && random() < diagonal)
        next.push(points[row + 1][column + 1]);
      else if (row + 1 < rows && column > 0)
        next.push(points[row + 1][column - 1]);
      for (const target of next)
        if (keep(point, target))
          segments.push(`M${point[0]} ${point[1]}L${target[0]} ${target[1]}`);
    }
  return { points: points.flat(), segments };
}

// Tiny dots on a share of the lattice points, drawn as one path.
export function dots(random, points, probability, keep = () => true) {
  return points
    .filter((point) => random() < probability && keep(point))
    .map(([x, y]) => {
      const r = round(between(random, 0.3, 0.55));
      return `M${round(x - r)} ${y}a${r} ${r} 0 1 0 ${round(r * 2)} 0a${r} ${r} 0 1 0 ${round(-r * 2)} 0`;
    });
}
