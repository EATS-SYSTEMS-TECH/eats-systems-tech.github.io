export const managerColumns = [
  "countryCode",
  "localNumber",
  "name",
  "email",
  "floorNumber",
  "apartmentNumber",
  "parkingNumber",
];
export function parseManagerCsv(text) {
  if (
    typeof text !== "string" ||
    new TextEncoder().encode(text).length > 4 * 1024 * 1024
  )
    throw new Error("INVALID_CSV");
  text = text.replace(/^\ufeff/, "");
  const rows = [];
  let row = [],
    cell = "",
    quoted = false,
    closed = false;
  for (let i = 0; i <= text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === undefined) throw new Error("INVALID_CSV");
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          quoted = false;
          closed = true;
        }
      } else cell += c;
      continue;
    }
    if (c === '"') {
      if (cell || closed) throw new Error("INVALID_CSV");
      quoted = true;
      continue;
    }
    if (c === "," || c === "\n" || c === "\r" || c === undefined) {
      row.push(cell);
      cell = "";
      closed = false;
      if (c !== ",") {
        if (row.some((v) => v.length)) rows.push(row);
        row = [];
        if (c === "\r" && text[i + 1] === "\n") i++;
      }
      continue;
    }
    if (closed) throw new Error("INVALID_CSV");
    cell += c;
  }
  const header = rows.shift();
  if (
    !header ||
    header.length !== 7 ||
    new Set(header).size !== 7 ||
    ["Name","Email","Country","Local","Floor","Apt","Parking"].some((k,i) => header[i].trim().toLowerCase() !== k.toLowerCase()) ||
    !rows.length ||
    rows.length > 5000
  )
    throw new Error("INVALID_CSV");
  const indexes = [2,3,0,1,4,5,6],
    phones = new Set();
  return rows.map((r) => {
    if (r.length !== 7) throw new Error("INVALID_CSV");
    const values = indexes.map((index) => r[index].trim());
    values[1] = values[1].length > 1 && values[1].startsWith("0") ? values[1].slice(1) : values[1];
    values[2] = values[2].replace(/^'(?=[=+\-@'])/, "").trim();
    values[3] = values[3].replace(/^'(?=[=+\-@'])/, "").trim().toLowerCase();
    if (
      !/^\d{1,3}$/.test(values[0]) ||
      !/^\d{1,20}$/.test(values[1]) || (values[1].length > 1 && values[1].startsWith("0")) ||
      !values[2].trim() ||
      Array.from(values[2]).length > 20 || /[\u0000-\u001f\u007f]/.test(values[2]+values[3]) ||
      new TextEncoder().encode(values[3]).length > 254 || !/^[^\s@]+@[^\s@]+$/.test(values[3])
    )
      throw new Error("INVALID_CSV");
    const phone = values[0] + values[1];
    if (phones.has(phone)) throw new Error("DUPLICATE_PHONE");
    phones.add(phone);
    for (let n = 4; n < 7; n++) {
      if (!/^\d+$/.test(values[n])) throw new Error("INVALID_CSV");
      values[n] = Number(values[n]);
      if (
        !Number.isSafeInteger(values[n]) ||
        values[n] > (n === 6 ? 0xffffffff : 65535)
      )
        throw new Error("INVALID_CSV");
    }
    return values;
  });
}
export function encodeManagerCsv(rows) {
  const cell = (v) =>
    '"' +
    String(v ?? "")
      .replace(/^'/, "''")
      .replace(/^[=+@\-\t\r]/, "'$&")
      .replaceAll('"', '""') +
    '"';
  return (
    "\ufeff" +
    [
      ["Name","Email","Country","Local","Floor","Apt","Parking"].map(cell).join(","),
      ...rows.map((row) =>
        [2,3,0,1,4,5,6]
          .map((i) => cell(Array.isArray(row) ? row[i] : row[managerColumns[i]]))
          .join(","),
      ),
    ].join("\r\n")
  );
}
