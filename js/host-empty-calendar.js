import { hostText, hostLocale } from "./host-locale.js";
import { node } from "./host-ui.js";
// A real empty state: no invented properties, stays, counts or backend requests.
export function renderEmptyHostCalendar(
  container,
  { organization, reason = "organization" } = {},
) {
  const section = node("section", undefined, {
    class: "host-calendar host-empty-calendar",
    "aria-label": "Reservation calendar",
  });
  const heading = node("div", undefined, { class: "calendar-heading" }),
    title = node("h2"),
    subtitle = node(
      "p",
      organization
        ? hostText("No properties configured")
        : hostText("No organization selected"),
    );
  const text = node("div", undefined, { class: "calendar-heading-text" });
  text.append(title, subtitle);
  const add = node("button", hostText("Add Reservation"), {
    type: "button",
    disabled: "",
    "aria-label": "New reservation",
    title:
      reason === "organization"
        ? "Join an organization to create reservations"
        : "Add a property and room first",
  });
  heading.append(text, add);
  const toolbar = node("div", undefined, { class: "calendar-toolbar" }),
    moves = node("div", undefined, { class: "calendar-navigation" }),
    ranges = node("div", undefined, {
      class: "calendar-ranges",
      "aria-label": "Calendar range",
    });
  let anchor = new Date();
  anchor.setHours(12, 0, 0, 0);
  let days = 14;
  const buttons = [];
  for (const [label, value] of [
    ["1 Week", 7],
    ["2 Weeks", 14],
    ["3 Weeks", 21],
    ["1 Month", 0],
  ]) {
    const button = node("button", hostText(label), {
      type: "button",
      "aria-pressed": String(value === 14),
    });
    button.addEventListener("click", () => {
      days = value;
      draw();
    });
    buttons.push([button, value]);
    ranges.append(button);
  }
  for (const [label, delta] of [
    ["Previous", -1],
    ["Today", 0],
    ["Next", 1],
  ]) {
    const button = node("button", hostText(label), { type: "button" });
    button.addEventListener("click", () => {
      if (!delta) {
        anchor = new Date();
        anchor.setHours(12, 0, 0, 0);
      } else if (!days)
        anchor = new Date(
          anchor.getFullYear(),
          anchor.getMonth() + delta,
          1,
          12,
        );
      else anchor.setDate(anchor.getDate() + delta * days);
      draw();
    });
    moves.append(button);
  }
  toolbar.append(moves, ranges);
  const grid = node("div", undefined, {
    class: "calendar-scroll empty-calendar-grid",
    tabindex: "0",
    "aria-label": "Calendar table",
  });
  const empty = node("div", undefined, { class: "calendar-onboarding" });
  empty.append(
    node(
      "span",
      reason === "organization"
        ? hostText("Start with your organization")
        : hostText("Your calendar is ready"),
      { class: "eyebrow" },
    ),
    node(
      "h3",
      reason === "organization"
        ? hostText("No organization access")
        : hostText("Add your first property"),
    ),
    node(
      "p",
      reason === "organization"
        ? hostText(
            "No active organization memberships. An owner can add your verified email.",
          )
        : hostText(
            "Connect a property and its rooms to start managing real reservations.",
          ),
    ),
  );
  const manage = node(
    "button",
    reason === "organization"
      ? hostText("View invitations")
      : hostText("Manage properties"),
    { type: "button" },
  );
  manage.addEventListener("click", () =>
    window.dispatchEvent(
      new CustomEvent("host:workspace-view", {
        detail: reason === "organization" ? "Organizations" : "Properties",
      }),
    ),
  );
  empty.append(manage);
  section.append(heading, toolbar, grid, empty);
  container.append(section);
  function draw() {
    if (!days)
      anchor = new Date(anchor.getFullYear(), anchor.getMonth(), 1, 12);
    const count =
        days ||
        new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate(),
      end = new Date(anchor);
    end.setDate(end.getDate() + count - 1);
    const format = new Intl.DateTimeFormat(hostLocale, {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    title.textContent = `${format.format(anchor)} – ${format.format(end)}`;
    for (const [button, value] of buttons)
      button.setAttribute("aria-pressed", String(days === value));
    const table = node("table"),
      row = node("tr");
    row.append(node("th", hostText("Property / Room"), { scope: "col" }));
    for (let i = 0; i < count; i++) {
      const day = new Date(anchor);
      day.setDate(day.getDate() + i);
      const cell = node("th", undefined, { scope: "col" });
      cell.append(
        node(
          "small",
          new Intl.DateTimeFormat(hostLocale, { weekday: "short" }).format(day),
        ),
        node("span", String(day.getDate())),
      );
      if (day.toDateString() === new Date().toDateString())
        cell.classList.add("calendar-today");
      row.append(cell);
    }
    const head = node("thead");
    head.append(row);
    const body = node("tbody"),
      blank = node("tr"),
      cell = node("td", undefined, { colspan: String(count + 1) });
    cell.style.height = "180px";
    blank.append(cell);
    body.append(blank);
    table.append(head, body);
    grid.replaceChildren(table);
  }
  draw();
  return section;
}
