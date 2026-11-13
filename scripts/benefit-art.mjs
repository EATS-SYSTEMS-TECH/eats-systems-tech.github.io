// scripts/benefit-art.mjs
// A small frameless drawing for each benefit kind of the "Key benefits" cards,
// in place of the icon in its tile. The drawings speak the site's line
// language at the size of that tile (56 x 56): one blue, a main line and a
// paler thin one, a faint tint, solid node dots, the status light, and a
// small round badge that says what happens (a check, a plus, a clock).
// The names are those of scripts/benefit-icons.mjs, so every benefit keeps its
// kind; a kind without a drawing keeps its icon.
// The colour is currentColor, so the page (and its high-contrast mode) sets it.
const thin = body => `<g stroke-width="1.3" opacity=".75">${body}</g>`;
const tint = shape => shape.replace("/>", ' fill="currentColor" fill-opacity=".1" stroke="none"/>');
const dot = (x, y, r = 2.2) => `<circle cx="${x}" cy="${y}" r="${r}" fill="currentColor" stroke="none"/>`;
// the status light of the hero scenes: a ring with a solid centre on a clear ground
const light = (x, y) => `<circle cx="${x}" cy="${y}" r="8.5" fill="#fff" stroke="none"/><circle cx="${x}" cy="${y}" r="6.5" stroke-width="1.6"/>${dot(x, y, 2.8)}`;
// a small light for the top of an entrance
const lamp = (x, y) => `${thin(`<circle cx="${x}" cy="${y}" r="5"/>`)}${dot(x, y, 2.3)}`;
// a round badge at the lower corner, with its glyph
const badge = glyph => `<circle cx="42" cy="41" r="9.5" fill="#fff"/>${glyph}`;
const CHECK = '<path d="M37.4 41l3.4 3.4l6 -7"/>', PLUS = '<path d="M37.5 41h9M42 36.5v9"/>', MINUS = '<path d="M37.5 41h9"/>';
const CLOCK = '<path d="M42 35.5v6l4 2.6"/>', WRENCH = '<path d="M37.8 45.2l6 -6"/><path d="M46.6 35.6a3.6 3.6 0 1 0 1.8 4.6"/>';
// a person: a head, and shoulders over a faint tint
const person = (x, y, r, w) => `${tint(`<path d="M${x - w} ${y + r + 19}a${w} ${(w * 0.92).toFixed(1)} 0 0 1 ${2 * w} 0Z"/>`)}<circle cx="${x}" cy="${y}" r="${r}"/><path d="M${x - w} ${y + r + 19}a${w} ${(w * 0.92).toFixed(1)} 0 0 1 ${2 * w} 0"/>`;
// something that is no longer needed: inside a dashed ring, struck out
const gone = body => `${thin('<circle cx="28" cy="28" r="22.5" stroke-dasharray="4 4.5"/>')}${body}<path d="M11 45L45 11"/>`;
// Wi-Fi arcs opening to the right of a point
const waves = (x, y, radii) => radii.map(r => `<path d="M${(x + r * 0.707).toFixed(1)} ${(y - r * 0.707).toFixed(1)}A${r} ${r} 0 0 1 ${(x + r * 0.707).toFixed(1)} ${(y + r * 0.707).toFixed(1)}"/>`).join("");
const phone = (x = 13) => `<rect x="${x}" y="3" width="30" height="50" rx="7"/>${thin(`<path d="M${x + 11} 9h8"/>`)}`;
const calendar = '<rect x="5" y="10" width="34" height="34" rx="5"/><path d="M5 19h34M14 6v8M30 6v8"/>';

const DRAWINGS = {
  // people and their permissions ---------------------------------------------
  // a permission of their own: the person and the light that is theirs
  "user-check": () => [person(21, 17, 8, 14), light(42, 40)],
  // someone joins; the one before is no longer there
  "user-plus": () => [thin(`<g stroke-dasharray="3 3.5"><circle cx="39" cy="14" r="6"/></g>`), person(19, 18, 7.5, 13), badge(PLUS)],
  // a permission is taken back
  "user-minus": () => [person(19, 18, 7.5, 13), badge(MINUS)],
  // several people, each with a permission of their own
  users: () => [thin(`<circle cx="39" cy="13" r="6"/><path d="M32 25.500a10.500 9.500 0 0 1 17.500 4"/>`), person(19, 19, 7.5, 13), light(42, 41)],
  // service people hold a permission of their own
  wrench: () => [person(19, 18, 7.5, 13), badge(WRENCH)],
  // users and permissions, in order
  "list-checks": () => ['<path d="M7 13.5l3.6 3.6l6.4 -7.4M7 28l3.6 3.6l6.4 -7.4"/>', '<path d="M24 14h25M24 28.5h25"/>', thin('<rect x="7" y="37.5" width="10" height="10" rx="2.5"/><path d="M24 43h17"/>')],

  // what is no longer needed --------------------------------------------------
  "key-off": () => [gone(`<circle cx="21" cy="21" r="6.5"/>${dot(21, 21, 1.8)}<path d="M25.6 25.6L40 40M34 34l-4 4M38.5 38.5l-4 4"/>`)],
  "card-off": () => [gone(`${tint('<rect x="12" y="19" width="32" height="20" rx="3.5"/>')}<rect x="12" y="19" width="32" height="20" rx="3.5"/>${thin('<path d="M12 26h32M17 33h9"/>')}`)],
  "sim-off": () => [gone(`${tint('<path d="M18 13h13l8 8v22h-21Z"/>')}<path d="M18 13h13l8 8v22h-21Z"/>${thin('<rect x="23" y="27" width="11" height="11" rx="2"/><path d="M23 32.5h11M28.5 27v11"/>')}`)],

  // the phone ------------------------------------------------------------------
  // the phone opens the entrance
  smartphone: () => [phone(8), tint('<circle cx="23" cy="29" r="8.5"/>'), '<circle cx="23" cy="29" r="8.5"/>', dot(23, 29, 3.2), thin(waves(36, 29, [8, 14.5]))],
  "phone-check": () => [phone(8), thin('<path d="M15 20h16M15 27h16M15 34h9"/>'), badge(CHECK)],
  // a remote, or the app: the fob and its signal
  remote: () => ['<circle cx="22" cy="7.5" r="4"/><rect x="11" y="12.5" width="22" height="38" rx="9"/>', tint('<circle cx="22" cy="25" r="6.5"/>'), '<circle cx="22" cy="25" r="6.5"/>', thin('<circle cx="22" cy="40" r="3.6"/>'), thin(waves(34, 25, [8, 14.5]))],
  // an invite on its way
  send: () => [tint('<path d="M51 6L6 23l16 7.5l7.5 16Z"/>'), '<path d="M51 6L6 23l16 7.5l7.5 16Z"/>', thin('<path d="M22 30.5L51 6"/>'), thin('<path d="M5 49c5 -1 9 -4 12 -9" stroke-dasharray="3 3.5"/>'), dot(5, 49, 2.4)],
  // Auto Open: the phone stays in the pocket and signals
  "hands-free": () => ['<circle cx="16" cy="11" r="6.5"/><rect x="9" y="21" width="14" height="30" rx="7"/>', '<rect x="16" y="31" width="4.4" height="7.6" rx="1.3" fill="currentColor" stroke="none"/>', waves(20, 35, [10, 17, 24])],

  // time ---------------------------------------------------------------------
  // hours that are set
  clock: () => [tint('<path d="M28 28V7A21 21 0 0 1 46.2 38.5Z"/>'), '<circle cx="28" cy="28" r="21"/><path d="M28 28V14.5M28 28l9.5 5.5"/>', dot(28, 28, 2.4), thin('<path d="M28 10v3M28 43v3M10 28h3M43 28h3"/>')],
  // access for a while only
  timer: () => [tint('<path d="M28 31V13.5A17.5 17.5 0 0 1 43.2 39.8Z"/>'), '<circle cx="28" cy="31" r="17.5"/><path d="M28 13.5V8M23 6.5h10M41 17.5l3 -3"/><path d="M28 31V20.5"/>', dot(28, 31, 2.4)],
  calendar: () => ['<rect x="7" y="10" width="42" height="38" rx="6"/><path d="M7 20h42M17 6v8M39 6v8"/>', tint('<rect x="13" y="25.5" width="9" height="7.5" rx="2"/>'), '<rect x="13" y="25.5" width="9" height="7.5" rx="2"/>',
    thin('<rect x="25.5" y="25.5" width="9" height="7.5" rx="2"/><rect x="38" y="25.5" width="6" height="7.5" rx="2"/><rect x="13" y="36.5" width="9" height="7.5" rx="2"/><rect x="25.5" y="36.5" width="9" height="7.5" rx="2"/>')],
  // a booking opens the entrance
  "calendar-check": () => [calendar, tint('<rect x="10" y="24" width="10" height="8" rx="2"/>'), '<rect x="10" y="24" width="10" height="8" rx="2"/>', thin('<rect x="24" y="24" width="10" height="8" rx="2"/><rect x="10" y="34.5" width="10" height="6" rx="2"/>'), badge(CHECK)],
  // access by dates and hours
  "calendar-clock": () => [calendar, tint('<rect x="10" y="24" width="24" height="8" rx="2"/>'), '<rect x="10" y="24" width="24" height="8" rx="2"/>', thin('<rect x="10" y="34.5" width="10" height="6" rx="2"/>'), badge(CLOCK)],
  // the night hours
  moon: () => [tint('<path d="M40 35A17 17 0 1 1 23.5 9.5a13.5 13.5 0 0 0 16.5 25.5Z"/>'), '<path d="M40 35A17 17 0 1 1 23.5 9.5a13.5 13.5 0 0 0 16.5 25.5Z"/>', dot(41, 12, 2.4), thin('<circle cx="48" cy="24" r="2"/>')],
  // every opening on record
  history: () => ['<rect x="5" y="7" width="31" height="42" rx="5"/>', thin('<path d="M13 16v24"/>'), dot(13, 17), dot(13, 28), dot(13, 39), '<path d="M19 17h11M19 28h11"/>', thin('<path d="M19 39h8"/>'), '<circle cx="42" cy="37" r="11" fill="#fff"/><path d="M42 31v6.5l4.5 3"/>'],

  // entrances ----------------------------------------------------------------
  // the door and the gate, each with its light
  building: () => [tint('<rect x="5" y="21" width="15" height="27" rx="2"/>'), '<rect x="5" y="21" width="15" height="27" rx="2"/><path d="M16 32.5v5"/>', '<path d="M27 17v31M51 17v31"/>', tint('<rect x="30" y="26" width="18" height="22"/>'), '<rect x="30" y="26" width="18" height="22"/>',
    thin('<path d="M36 26v22M42 26v22M2 48h52"/>'), lamp(12.5, 11.5), lamp(39, 9.5)],
  // a home
  home: () => ['<path d="M5 27L28 8l23 19"/><path d="M10.5 23.5V48h35V23.5"/>', tint('<rect x="22" y="31" width="12" height="17" rx="1.5"/>'), '<rect x="22" y="31" width="12" height="17" rx="1.5"/><path d="M30.5 38.5v4"/>', lamp(28, 22.5)],
  // a private garage: the sectional door half open
  garage: () => ['<path d="M4 24L28 8l24 16"/><path d="M9 21.5V48h38V21.5"/>', tint('<rect x="15" y="40" width="26" height="8"/>'), '<path d="M15 48V29.5h26V48"/><path d="M15 40h26"/>', thin('<path d="M15 34.7h26"/>'), dot(28, 21.5, 2.3)],
  gate: () => ['<path d="M8 15v33M48 15v33"/>', tint('<rect x="12" y="23" width="32" height="25"/>'), '<rect x="12" y="23" width="32" height="25"/>', thin('<path d="M20 23v25M28 23v25M36 23v25M3 48h50"/>'), lamp(28, 10)],
  barrier: () => [tint('<rect x="7" y="27" width="11" height="21" rx="2.5"/>'), '<rect x="7" y="27" width="11" height="21" rx="2.5"/><path d="M18 31.5L51 19.5"/>', thin('<path d="M27 28.2l1.6 4.4M36 25l1.6 4.4M45 21.7l1.6 4.4M3 48h50"/>'), lamp(12.5, 16)],
  // an open door: someone walks in without waiting
  "door-open": () => [tint('<rect x="18" y="14" width="24" height="34"/>'), '<path d="M18 48V14h24v34"/>', '<path d="M18 14l-9 4.5V51l9 -3Z" fill="#fff"/><path d="M12.5 31v5"/>', thin('<path d="M22 48h28"/>'), lamp(30, 6.5)],
  // a roller shutter, half raised
  shutter: () => ['<rect x="7" y="7" width="42" height="9" rx="2.5"/><path d="M11 16v32M45 16v32M11 36h34"/>', tint('<rect x="11" y="36" width="34" height="12"/>'), thin('<path d="M11 21.5h34M11 26.5h34M11 31.5h34M4 48h48"/>')],
  // a shop behind its shutter
  store: () => ['<path d="M6 21l4.5 -11h35L50 21"/><path d="M6 21a5.5 5.5 0 0 0 11 0a5.5 5.5 0 0 0 11 0a5.5 5.5 0 0 0 11 0a5.5 5.5 0 0 0 11 0"/>', '<path d="M10 28v20h36V28"/>', tint('<rect x="17" y="31" width="22" height="17"/>'), '<path d="M17 48V31h22v17"/>', thin('<path d="M17 36.5h22M17 42h22"/>')],
  // the lock that is already in the door, opened from the phone
  lock: () => ['<path d="M15 25v-6.5a9.5 9.5 0 0 1 19 0V25"/>', tint('<rect x="8" y="25" width="33" height="24" rx="5.5"/>'), '<rect x="8" y="25" width="33" height="24" rx="5.5"/>', dot(24.5, 34.5, 3.2), '<path d="M24.5 36v6"/>', thin(waves(41, 20, [7, 13]))],
  "lock-open": () => ['<path d="M15 25v-6.5a9.5 9.5 0 0 1 18.4 -3.3"/>', tint('<rect x="8" y="25" width="33" height="24" rx="5.5"/>'), '<rect x="8" y="25" width="33" height="24" rx="5.5"/>', dot(24.5, 34.5, 3.2), '<path d="M24.5 36v6"/>'],

  // protection ---------------------------------------------------------------
  "shield-check": () => [tint('<path d="M28 5L8.5 12.5v14c0 12 8 20.5 19.5 24.5c11.500 -4 19.500 -12.500 19.500 -24.500v-14Z"/>'), '<path d="M28 5L8.5 12.5v14c0 12 8 20.5 19.5 24.5c11.500 -4 19.500 -12.500 19.500 -24.500v-14Z"/>', '<path d="M19 27.500l6.200 6.200l12 -13.200"/>'],
  // a clear view from where you stand: someone works the shutter from a few steps back
  // (the kind keeps its name from the copy; the drawing shows no eye)
  eye: () => [tint('<path d="M2 48v-7a7.500 7.500 0 0 1 15 0v7Z"/>'), '<circle cx="9.500" cy="23" r="5"/><path d="M2 48v-7a7.500 7.500 0 0 1 15 0v7"/>',
    thin(waves(17, 30, [4, 8.500])), '<rect x="29" y="8" width="25" height="7" rx="2.200"/><path d="M32 15v33M51 15v33M32 35h19"/>', tint('<rect x="32" y="35" width="19" height="13"/>'),
    thin('<path d="M32 20h19M32 25h19M32 30h19M1 48h54"/>')],

  // places and things ----------------------------------------------------------
  // a small business, a clinic, an office
  briefcase: () => [tint('<rect x="6" y="18" width="44" height="29" rx="5.5"/>'), '<rect x="6" y="18" width="44" height="29" rx="5.5"/><path d="M20 18v-4.500a3.500 3.500 0 0 1 3.500 -3.500h9a3.500 3.500 0 0 1 3.500 3.500V18"/>', thin('<path d="M6 30.500h17M33 30.500h17"/>'), '<rect x="23" y="27" width="10" height="7" rx="2" fill="#fff"/>'],
  // from a court to a gym
  dumbbell: () => ['<path d="M19 28h18"/>', tint('<rect x="10" y="16" width="9" height="24" rx="3"/>'), '<rect x="10" y="16" width="9" height="24" rx="3"/>', tint('<rect x="37" y="16" width="9" height="24" rx="3"/>'), '<rect x="37" y="16" width="9" height="24" rx="3"/>',
    thin('<rect x="4" y="21" width="6" height="14" rx="2.200"/><rect x="46" y="21" width="6" height="14" rx="2.200"/>')],
  // everything runs by itself
  zap: () => [tint('<path d="M32 4L10 31h14.500L21 52l25 -28H30.500Z"/>'), '<path d="M32 4L10 31h14.500L21 52l25 -28H30.500Z"/>'],
  "map-pin": () => [tint('<path d="M28 51c-10.500 -13 -16.500 -21.500 -16.500 -30a16.500 16.500 0 0 1 33 0c0 8.500 -6 17 -16.500 30Z"/>'), '<path d="M28 51c-10.500 -13 -16.500 -21.500 -16.500 -30a16.500 16.500 0 0 1 33 0c0 8.500 -6 17 -16.500 30Z"/>', dot(28, 21, 5)],
  car: () => [tint('<path d="M5 38v-8.500l7 -3l6 -10h19l7.500 10l6.500 3V38Z"/>'), '<path d="M5 38v-8.500l7 -3l6 -10h19l7.500 10l6.500 3V38Z"/>', thin('<path d="M12 26.500h32.500M27 16.500v10"/>'), '<circle cx="16.500" cy="39.500" r="5.500" fill="#fff"/><circle cx="39.500" cy="39.500" r="5.500" fill="#fff"/>'],
  package: () => [tint('<path d="M28 5l20 9.500v24.500L28 51L8 39V14.500Z"/>'), '<path d="M28 5l20 9.500v24.500L28 51L8 39V14.500Z"/><path d="M8 14.500l20 10.500l20 -10.500M28 25v26"/>', thin('<path d="M18 9.800l20 10.300v8"/>')],
  bed: () => ['<path d="M6 13v35M6 39h44v9"/>', tint('<rect x="6" y="29" width="44" height="10" rx="3"/>'), '<rect x="6" y="29" width="44" height="10" rx="3"/>', thin('<rect x="10" y="22" width="15" height="7" rx="3"/>')],
  layers: () => [tint('<path d="M28 5l23 11.500L28 28L5 16.500Z"/>'), '<path d="M28 5l23 11.500L28 28L5 16.500Z"/><path d="M5 28l23 11.500L51 28"/>', thin('<path d="M5 39l23 11.500L51 39"/>')],
};

export const BENEFIT_ART_NAMES = Object.freeze(Object.keys(DRAWINGS));
export const hasBenefitArt = name => Object.hasOwn(DRAWINGS, name);
// The drawing of a benefit kind as inline SVG markup (decorative: the card's title and text carry the meaning).
export function benefitArtSvg(name) {
  if (!hasBenefitArt(name)) throw new Error(`Unknown benefit drawing ${name}`);
  return `<svg viewBox="0 0 56 56" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${DRAWINGS[name]().flat().join("")}</svg>`;
}
