import { isLocalStaging } from "./firebase-config.js";

const isLocalSite =
  typeof location !== "undefined" &&
  ["127.0.0.1", "localhost"].includes(location.hostname) &&
  location.port === "8000";

export const hostApiBaseUrl = isLocalStaging
  ? "http://127.0.0.1:8101"
  : isLocalSite
    ? "http://127.0.0.1:8001"
    : "https://api.wifigate.io";

export const profileApiBaseUrl = hostApiBaseUrl;
