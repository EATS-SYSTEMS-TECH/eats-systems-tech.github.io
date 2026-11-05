const gearOutline = Array.from({ length: 32 }, (_, i) => {
  const radius = [8, 10, 10, 8][i % 4];
  const angle = (i * 360 / 32 - 90) * Math.PI / 180;
  return `${i ? "L" : "M"}${(12 + radius * Math.cos(angle)).toFixed(2)} ${(12 + radius * Math.sin(angle)).toFixed(2)}`;
}).join(" ") + "ZM9 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0";
export function managerUiIcon(kind) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  for (const [key, value] of Object.entries({viewBox:"0 0 24 24",width:"24",height:"24",fill:"none",stroke:"currentColor","stroke-width":"1.7","stroke-linecap":"round","stroke-linejoin":"round","aria-hidden":"true"})) svg.setAttribute(key,value);
  const path = document.createElementNS(svg.namespaceURI,"path");
  path.setAttribute("d", {
    systems:"M3 4h7v7H3zM14 4h7v7h-7zM3 15h7v6H3zM14 15h7v6h-7z",
    calendar:"M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2ZM7 2v5M17 2v5M3 10h18M7 14h3M14 14h3M7 17h3",
    capacity:"M3 9V3h6M15 3h6v6M21 15v6h-6M9 21H3v-6M8 16v-1a4 4 0 0 1 8 0v1M12 6a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5",
    history:"M3 11a9 9 0 1 1 2 7M3 4v7h7M12 7v5l3 2",
    signal:"M5 8a11 11 0 0 1 14 0M8 11a6 6 0 0 1 8 0M11 14a2 2 0 0 1 2 0M12 18h.01",
    gate:"M4 21V5h4v16M8 6h13v4H8M12 6l-2 4M17 6l-2 4M21 6l-2 4M2 21h9",
    organizations:"M4 21V3h12v18M16 9h4v12M2 21h20M8 7h4M8 11h4M8 15h4",
    people:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8M17 4a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.87",
    settings:gearOutline,
    account:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8m7 8 2 2 4-4",
    app:"M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2ZM10 18h4M9 6h6M9 10h6",
    export:"M12 16V3m-5 5 5-5 5 5M4 15v5h16v-5",
    refresh:"M20 7V3l-4 4M4 17v4l4-4M20 7a9 9 0 0 0-15-2M4 17a9 9 0 0 0 15 2",
    founder:"m2 5 5 4 5-6 5 6 5-4-3 12H5ZM5 21h14",
    admin:"m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6ZM8 12l3 3 5-6",
    viewer:"M2 12s4-8 10-8 10 8 10 8-4 8-10 8S2 12 2 12Zm7 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0",
    add:"M12 5v14M5 12h14",
    remove:"M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7",
    search:"M21 21l-5-5M10.5 3a7.5 7.5 0 1 0 0 15a7.5 7.5 0 1 0 0-15",
    next:"m9 5 7 7-7 7",
    previous:"m15 5-7 7 7 7",
  }[kind] ?? "M4 12h16");
  svg.append(path);
  return svg;
}
