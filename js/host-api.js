import { hostApiBaseUrl } from "./host-api-config.js";

export async function hostGet(user, path, { signal } = {}) {
  if (!user || !/^\/v1\/[a-z0-9/\-]+$/.test(path)) throw new Error("invalid-request");
  const token = await user.getIdToken();
  const response = await fetch(new URL(path, hostApiBaseUrl), {
    method: "GET",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
    credentials: "omit",
    signal
  });
  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}
