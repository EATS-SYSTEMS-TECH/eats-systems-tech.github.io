// The four objects people see everywhere: Gate, Dual Control, Roller Shutter
// and Group. On the wire a Roller Shutter stays type "dual-control"; only its
// category ("ROLLER_SHUTTER") tells it apart, never its icon. Host, Manager
// and Pay name it through this module.
export const ROLLER_SHUTTER_CATEGORY = "ROLLER_SHUTTER";
export const rollerShutterIcon = "roller-shutter-small";

export const isRollerShutter = (system) =>
  system?.type === "dual-control" &&
  system?.category === ROLLER_SHUTTER_CATEGORY;

export const rollerShutterLabel = (language = "en") =>
  language === "he" ? "תריס חשמלי" : "Roller Shutter";

// A screen keeps its own words for Gate, Dual Control and Group (`labels`,
// by type); a Roller Shutter is named the same on every screen.
export const systemKindLabel = (system, language, labels) =>
  isRollerShutter(system) ? rollerShutterLabel(language) : labels[system?.type];

// Manager shows no remote Open for a Roller Shutter or its sides, only this.
export const rollerShutterAppOnlyText = (language = "en") =>
  language === "he"
    ? "תריס חשמלי מופעל רק באפליקציית WIFIGATE, עם Safety והחזקת אצבע."
    : "Roller Shutter is operated only in the WIFIGATE app, with Safety and a finger hold.";
