// Shared by the reservation reader, editor and details view. Only these
// fields can become invitation overrides; preserve numeric zero coordinates.
export const accessNoteFields = [
  ["note", "Access note: message", 100],
  ["residentName", "Access note: host name", 20],
  ["floor", "Access note: floor", 50],
  ["apartment", "Access note: room or apartment", 80],
  ["parking", "Access note: parking", 80],
  ["address", "Access note: address", 100],
  ["latitude", "Access note: latitude", null],
  ["longitude", "Access note: longitude", null],
];
export function readAccessNote(value) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return undefined;
  return Object.fromEntries(
    accessNoteFields.flatMap(([field, , max]) => {
      const item = value[field];
      if (max === null)
        return typeof item === "number" && Number.isFinite(item)
          ? [[field, item]]
          : [];
      return typeof item === "string" && item.trim() ? [[field, item]] : [];
    }),
  );
}
