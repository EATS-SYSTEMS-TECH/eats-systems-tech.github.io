import axios from "axios";
import { authenticatedRequest, type FirebaseUser } from "./api.js";
import { siteIntegrityHeaders } from "../js/site-app-check.js";
import { managerApiBaseUrl } from "../js/manager-api-config.js";

const managerApi = axios.create({ baseURL: managerApiBaseUrl, timeout: 15_000, withCredentials: false, headers: { Accept: "application/json" } });

export async function managerRequest<T = Record<string, unknown>>(
  user: FirebaseUser, path: string, method: "GET" | "POST" = "GET", data?: unknown,
): Promise<T> {
  if (!/^\/api\/v1\/manager\/[A-Za-z0-9_/?=&%-]+$/.test(path) || path.includes("..") ||
      (method === "GET" && data !== undefined)) throw new Error("invalid-request");
  return authenticatedRequest<T>(managerApi, user, {
    url: path, method, ...(data === undefined ? {} : { data }), headers: await siteIntegrityHeaders(),
  });
}
