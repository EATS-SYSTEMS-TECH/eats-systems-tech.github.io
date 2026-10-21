import test from "node:test";
import assert from "node:assert/strict";
import { parseManagerCsv, encodeManagerCsv } from "../js/manager-csv.js";
test("Manager CSV preserves international text, quoted commas and typed profile fields", () => {
  const row = [
    "972",
    "500000000",
    "שירה, לוי",
    "resident@example.test",
    3,
    12,
    45,
  ];
  assert.deepEqual(parseManagerCsv(encodeManagerCsv([row])), [row]);
  assert.deepEqual(
    parseManagerCsv(
      'Name,Email,Country,Local,Floor,Apt,Parking\r\n"שירה, לוי",resident@example.test,972,0500000000,3,12,45',
    ),
    [row],
  );
  assert.equal(
    encodeManagerCsv([
      ["1", "5550001234", "=HYPERLINK(test)", "", 0, 0, 0],
    ]).includes('"\'=HYPERLINK(test)"'),
    true,
  );
  assert.throws(
    () => parseManagerCsv(encodeManagerCsv([row, row])),
    /DUPLICATE_PHONE/,
  );
  assert.throws(
    () => parseManagerCsv("countryCode,localNumber\n972,5"),
    /INVALID_CSV/,
  );
  assert.throws(
    () =>
      parseManagerCsv(
        encodeManagerCsv([["972", "500000000", "Name", "", -1, 0, 0]]),
      ),
    /INVALID_CSV/,
  );
});
