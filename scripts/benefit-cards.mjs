// scripts/benefit-cards.mjs
// The shape of the benefit cards of a use-case or landing page, checked
// against the Hebrew source: { icon, title, text, tags?, visual? } per card,
// with the visual of the lead card in one of the types setNicheBenefits draws.
// Every locale keeps the Hebrew's cards, icons, tags, visual and numbers.

import { BENEFIT_ICONS } from "./benefit-icons.mjs";

const VISUAL_FIELDS = {
  roster: { strings: ["heading", "status"], rows: ["name", "badge"] },
  history: { strings: ["heading"], optional: ["status"], rows: ["time", "name", "event"] },
  invite: { strings: ["heading", "status", "guest", "when", "note"], rows: null },
  schedule: { strings: ["heading"], optional: ["status"], rows: ["day", "range"] },
};

const filled = (value) => typeof value === "string" && value.trim().length > 0;
const numbersOf = (text) => (String(text).match(/\d+/g) || []).sort().join(",");

export function benefitCardProblems(at, cards, source) {
  const problems = [];
  if (!Array.isArray(cards) || !cards.length) return [`${at}.benefits must be a list of cards`];
  if (!Array.isArray(source) || cards.length !== source.length) {
    return [`${at}.benefits has ${cards.length} cards, the Hebrew has ${source?.length ?? 0}`];
  }
  const sameNumbers = (path, value, from) => {
    if (numbersOf(value) !== numbersOf(from)) problems.push(`${path}: numbers differ from the Hebrew`);
  };
  cards.forEach((card, index) => {
    const from = source[index];
    const path = `${at}.benefits[${index}]`;
    if (!BENEFIT_ICONS[card?.icon]) problems.push(`${path}.icon "${card?.icon}" is not in scripts/benefit-icons.mjs`);
    if (card?.icon !== from.icon) problems.push(`${path}.icon must be "${from.icon}" as in the Hebrew`);
    for (const field of ["title", "text"]) {
      if (!filled(card?.[field])) problems.push(`${path}.${field} is missing`);
      else sameNumbers(`${path}.${field}`, card[field], from[field]);
    }
    const tags = card?.tags || [];
    const sourceTags = from.tags || [];
    if (tags.length !== sourceTags.length || !tags.every(filled)) problems.push(`${path}.tags needs ${sourceTags.length} labels`);
    else tags.forEach((tag, i) => sameNumbers(`${path}.tags[${i}]`, tag, sourceTags[i]));
    if (!from.visual) {
      if (card?.visual) problems.push(`${path} has a visual the Hebrew does not`);
      return;
    }
    const visual = card?.visual;
    const shape = VISUAL_FIELDS[from.visual.type];
    if (!shape) problems.push(`${path}.visual.type "${from.visual.type}" is unknown`);
    else if (visual?.type !== from.visual.type) problems.push(`${path}.visual.type must be "${from.visual.type}"`);
    else {
      for (const field of shape.strings) {
        if (!filled(visual[field])) problems.push(`${path}.visual.${field} is missing`);
        else sameNumbers(`${path}.visual.${field}`, visual[field], from.visual[field]);
      }
      for (const field of shape.optional || []) {
        if (Boolean(from.visual[field]) !== Boolean(visual[field])) problems.push(`${path}.visual.${field} must match the Hebrew`);
      }
      if (shape.rows) {
        const rows = visual.rows || [];
        if (rows.length !== from.visual.rows.length) problems.push(`${path}.visual.rows needs ${from.visual.rows.length} rows`);
        else rows.forEach((row, i) => shape.rows.forEach((field) => {
          if (!filled(row?.[field])) problems.push(`${path}.visual.rows[${i}].${field} is missing`);
          else sameNumbers(`${path}.visual.rows[${i}].${field}`, row[field], from.visual.rows[i][field]);
        }));
      }
    }
  });
  return problems;
}
