// Idle discovery timing is negotiated separately from grants and commands.
const policies = Object.freeze({
  1: Object.freeze({ timingVersion: 1, demandLifetimeMs: 90000, softWaitMs: 60000, pollIntervalMs: 60000 }),
  2: Object.freeze({ timingVersion: 2, demandLifetimeMs: 180000, softWaitMs: 120000, pollIntervalMs: 90000 }),
});

export function managerRequestedTiming(profile) {
  const policy = profile?.timingPolicy;
  return policy?.preferredVersion === 2 && Array.isArray(policy.supportedVersions) && policy.supportedVersions.includes(2) ? 2 : 1;
}

export function managerDemandTiming(response, requestedVersion = 1, requestedAt = Date.now()) {
  const hasTiming = response?.timingVersion !== undefined;
  const version = hasTiming ? response.timingVersion : 1;
  if (version !== 1 && version !== 2) throw new Error("INVALID_CONNECTION_TIMING");
  const policy = policies[version];
  if (!policy || (version === 2 && requestedVersion !== 2)) throw new Error("INVALID_CONNECTION_TIMING");
  for (const field of ["demandLifetimeMs", "softWaitMs", "pollIntervalMs"]) {
    if ((hasTiming || response?.[field] !== undefined) && response?.[field] !== policy[field]) throw new Error("INVALID_CONNECTION_TIMING");
  }
  let expiresAt = requestedAt + policy.demandLifetimeMs;
  if (response?.expiresAt !== undefined) {
    const serverExpiry = typeof response.expiresAt === "string" ? Date.parse(response.expiresAt) : NaN;
    if (!Number.isFinite(serverExpiry)) throw new Error("INVALID_CONNECTION_TIMING");
    expiresAt = Math.min(expiresAt, serverExpiry);
  }
  return { ...policy, expiresAt };
}
