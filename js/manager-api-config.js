import { hostApiBaseUrl } from "./host-api-config.js";
import { isLocalStaging } from "./firebase-config.js";

const isLocalSite =
  typeof location !== "undefined" &&
  ["127.0.0.1", "localhost"].includes(location.hostname) &&
  location.port === "8000";

// Manager has its own API deployment and metadata database. Host and shared
// account identity continue to use host-api-config.js. Local fixtures keep
// their existing API; the deployed Manager service enforces App Check and MFA.
export const managerApiBaseUrl =
  isLocalStaging || isLocalSite
    ? hostApiBaseUrl
    : "https://wifigate-manager-api-759449834452.us-central1.run.app";
