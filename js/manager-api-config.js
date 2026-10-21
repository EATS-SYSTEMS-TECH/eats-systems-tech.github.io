import { hostApiBaseUrl } from "./host-api-config.js";

// A staging build can replace this module without redirecting Host requests.
export const managerApiBaseUrl = hostApiBaseUrl;
