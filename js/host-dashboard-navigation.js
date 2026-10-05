// Navigation follows the actual authorized DOM and is cleared with its session.
const nav = document.getElementById("host-section-navigation");
const root = document.getElementById("host-management");
const entries = [
  ["Calendar", '.host-calendar'], ["Properties", 'section[aria-label="properties"]'],
  ["Rooms", 'section[aria-label="rooms"]'], ["Staff", 'section[aria-label="members"]'],
  ["Access Keys", 'section[aria-label="WIFIGATE systems"]'], ["API integrations", 'section[aria-label="API integrations"]'],
  ["Reservations / PMS", 'section[aria-label="Reservation integrations"]'],
  ["Automation", 'section[aria-label="Automatic guest access"]'],
  ["Jobs Calendar", 'section[aria-label="Host operations"]'],
  ["System Import", 'section[aria-label="System import approvals"]'],
  ["Service Targets", 'section[aria-label="Internal service targets"]'],
  ["Organizations", '#host-management'], ["Settings", '#account-details']
];
function refresh() {
  const active = nav.querySelector('[aria-current="location"]')?.textContent;
  nav.replaceChildren();
  for (const [label, selector] of entries) {
    const target = document.querySelector(selector);
    if (!target || target.hidden) continue;
    const button = document.createElement("button"); button.type = "button"; button.textContent = label;
    if (active === label) button.setAttribute("aria-current", "location");
    button.addEventListener("click", () => {
      for (const link of nav.children) link.removeAttribute("aria-current");
      button.setAttribute("aria-current", "location");
      if (target.tagName === "DETAILS") target.open = true;
      target.tabIndex = -1; target.focus({preventScroll:true}); target.scrollIntoView({block:"start",behavior:"smooth"});
    });
    nav.append(button);
  }
}
new MutationObserver(refresh).observe(root, {childList:true, subtree:true});
new MutationObserver(refresh).observe(document.getElementById("account-details"), {attributes:true, attributeFilter:["hidden"]});
refresh();
