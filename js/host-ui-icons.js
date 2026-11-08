import { managerUiIcon } from "./manager-ui-icons.js";

// Manager's icon component, plus the two Host-only views' symbols (Bookings
// and API keys) drawn in the same 24px, 1.7px-stroke style.
const hostPaths = {
  list: "M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01",
  key: "M15 3a6 6 0 1 1-5.2 9L3 18.8V21h3v-2h2v-2h2l1.8-1.8A6 6 0 0 1 15 3ZM16.5 6.5h.01",
};
export function hostUiIcon(kind) {
  const svg = managerUiIcon(kind);
  if (hostPaths[kind]) svg.querySelector("path").setAttribute("d", hostPaths[kind]);
  return svg;
}
