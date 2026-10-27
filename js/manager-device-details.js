// Display only facts present in a device response. In particular, internal
// LittleFS/history-file bytes never stand in for removable SD card capacity.
const byteCount = (value) =>
  Number.isSafeInteger(value) && value >= 0 ? value : null;

export function formatManagerBytes(value, language = "en") {
  const bytes = byteCount(value);
  if (bytes === null) return null;
  const units = ["B", "KB", "MB", "GB", "TB"];
  let amount = bytes, index = 0;
  while (amount >= 1024 && index < units.length - 1) {
    amount /= 1024;
    index++;
  }
  return `${new Intl.NumberFormat(language === "he" ? "he-IL" : "en-US", {
    maximumFractionDigits: 2,
  }).format(amount)} ${units[index]}`;
}

export function managerMaximumUsers(capabilities) {
  const maximum = (capabilities?.data ?? capabilities)?.limits?.maxUsers;
  return Number.isSafeInteger(maximum) && maximum > 0 ? maximum : null;
}

export function managerRfDetails(value) {
  const saved = value?.rfCode;
  const present = typeof saved?.present === "boolean" ? saved.present : null;
  const code = present === true && typeof saved.codeHex === "string" &&
    /^[0-9a-f]{1,16}$/i.test(saved.codeHex) && /[1-9a-f]/i.test(saved.codeHex)
    ? `0x${saved.codeHex.toUpperCase()}` : null;
  return { present, code };
}

export function managerSdDetails(value, language = "en") {
  const sd = value?.sd;
  const supported = typeof sd?.supported === "boolean" ? sd.supported : null;
  const mounted = typeof sd?.mounted === "boolean" ? sd.mounted : null;
  const readable = supported !== false && mounted === true;
  return {
    supported,
    mounted,
    format: readable && sd?.formatCompatible === true
      ? "compatible"
      : readable && sd?.formatCompatible === false
        ? "incompatible"
        : "unknown",
    capacity: readable ? formatManagerBytes(sd?.capacityBytes, language) : null,
    total: readable ? formatManagerBytes(sd?.totalBytes, language) : null,
    used: readable ? formatManagerBytes(sd?.usedBytes, language) : null,
    free: readable ? formatManagerBytes(sd?.freeBytes, language) : null,
  };
}

export function managerOpeningFields(command) {
  switch (command) {
    case "PULSE":
      return ["pulseWidth1Millis"];
    case "PULSE_AFTER_PULSE":
      return ["pulseWidth1Millis", "timeBetweenPulses1Seconds", "pulseWidth2Millis"];
    case "PULSE_AFTER_PULSE_AFTER_PULSE":
      return ["pulseWidth1Millis", "timeBetweenPulses1Seconds", "pulseWidth2Millis",
        "timeBetweenPulses2Seconds", "pulseWidth3Millis"];
    default:
      return [];
  }
}
