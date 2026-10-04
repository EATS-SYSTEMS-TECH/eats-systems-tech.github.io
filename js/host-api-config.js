// The management API specified by WIFIGATE Host. Override for staging when available.
import { isLocalStaging } from "./firebase-config.js";

export const hostApiBaseUrl = isLocalStaging ? "http://127.0.0.1:8101" : "https://api.wifigate.io";

const isLocalSite = typeof location !== "undefined"
  && ["127.0.0.1", "localhost"].includes(location.hostname)
  && location.port === "8000";

export const profileApiBaseUrl = isLocalStaging
  ? "http://127.0.0.1:8101"
  : isLocalSite
    ? "http://127.0.0.1:8001"
    : hostApiBaseUrl;
