// Render proof text with Cheerio's text encoder; locale copy is never HTML.
export function setNicheList($, selector, items, className) {
  const targets = $(selector);
  // Optional template slots must not inspect content when the slot is absent.
  if (!targets.length) return;
  targets.empty();

  // Keep the original array traversal (including sparse holes and falsy input)
  // while preparing child nodes before one append to each matched container.
  const children = [];
  (items || []).forEach((text) => {
    children.push($("<li>").addClass(className).text(text));
  });
  // Cheerio clones the prepared sequence for multiple matching containers.
  targets.append(children);
}
