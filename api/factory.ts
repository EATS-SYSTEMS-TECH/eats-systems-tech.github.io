import { authenticatedRequest, profileApi, type FirebaseUser } from "./api.js";

export const getFactoryWorkspace = (user: FirebaseUser, signal: AbortSignal) =>
  authenticatedRequest<unknown>(profileApi, user, {
    method: "GET", url: "/api/v1/factory/workspace", signal,
  });

export const getFactoryJobs = (user: FirebaseUser, stationId: string, cursor: string | null, signal: AbortSignal) =>
  authenticatedRequest<unknown>(profileApi, user, {
    method: "GET", url: "/api/v1/factory/jobs", signal,
    params: { stationId, cursor: cursor ?? undefined, limit: 30 },
  });

export const createFactoryJob = (user: FirebaseUser, stationId: string, batchId: string, key: string, signal: AbortSignal) =>
  authenticatedRequest<unknown>(profileApi, user, {
    method: "POST", url: "/api/v1/factory/jobs", signal,
    headers: { "Idempotency-Key": key }, data: { stationId, batchId },
  });

export const changeFactoryJob = (user: FirebaseUser, jobId: string, reason: "OPERATOR_REVIEW" | null, signal: AbortSignal) =>
  authenticatedRequest<unknown>(profileApi, user, {
    method: "POST", signal,
    url: "/api/v1/factory/jobs/" + encodeURIComponent(jobId) + (reason ? "/quarantine" : "/cancel"),
    data: reason ? { reason } : {},
  });
