import test from "node:test";
import assert from "node:assert/strict";
import {
  parseManagerCsv,
  encodeManagerCsv,
  managerCsvTemplate,
  managerCsvExampleRows,
  validateManagerCsvImport,
} from "../js/manager-csv.js";
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

test("Manager CSV template is a valid import for users and administrators", () => {
  assert.deepEqual(parseManagerCsv(managerCsvTemplate()), managerCsvExampleRows);
  assert.deepEqual(validateManagerCsvImport(managerCsvTemplate(), 20), managerCsvExampleRows);
  assert.throws(() => validateManagerCsvImport(managerCsvTemplate(), 1), /CSV_CAPACITY_EXCEEDED/);
  assert.deepEqual(validateManagerCsvImport(managerCsvTemplate()), managerCsvExampleRows);
  for (const capacity of [0, -1, 5001, null, 1.5])
    assert.throws(() => validateManagerCsvImport(managerCsvTemplate(), capacity), /INVALID_CAPABILITIES/);
});

test("Manager CSV errors identify invalid record rows without changing the wire schema", () => {
  const [first, second] = managerCsvExampleRows;
  assert.throws(() => parseManagerCsv(encodeManagerCsv([first, first])), (error) => {
    assert.equal(error.message, "DUPLICATE_PHONE");
    assert.equal(error.row, 3);
    assert.equal(error.field, "Local");
    return true;
  });
  const invalid = [...second];
  invalid[4] = 65536;
  assert.throws(() => parseManagerCsv(encodeManagerCsv([first, invalid])), (error) => {
    assert.equal(error.message, "INVALID_CSV");
    assert.equal(error.row, 3);
    assert.equal(error.field, "Floor");
    return true;
  });
  assert.throws(() => parseManagerCsv("Country,Local,Name,Email,Floor,Apt,Parking\n972,501234567,Dana,dana@example.com,0,0,0"), /INVALID_CSV/);
});
