# V10 Service health

Choose an authorized organization in the Host dashboard, then **Service health**. Owners, administrators and staff can inspect scheduled observations. Only owners see the policy editing form; backend authorization remains authoritative for every request.

**Refresh service health** reads the new `/api/v1/organizations/:orgId/operations/service-health?limit=12` endpoint. It shows the policy revision, responsible member, last completed window, sample counts, success rates, p95 latency, breach reasons and recent retained history. It distinguishes unconfigured, disabled, unowned, awaiting, stale and unavailable monitoring from current measured health. No requests or samples means unknown. Old results are explicitly historical. The response's check time remains visible; refresh before relying on it. Windows overlap and must not be summed.

**Load service targets** loads the current version before saving. Owners explicitly approve internal thresholds and a responsible operations UID. **Verify identity to edit targets** completes the existing authenticator flow when the five-minute sign-in limit has elapsed. Retry preserves the original idempotency intent; a version conflict requires loading and reviewing the changed policy. Saving removes the previously displayed health result so it cannot imply evidence for the new policy.

**Review alerts and deliveries** opens the existing Operations view. **Open support access** opens the existing time-limited, owner-approved support controls. The health view neither enables deployment workers nor approves a production launch.

Release the backend and its additive Firestore index first. Then build and deploy the portal. The V10 bundle and workspace stylesheet use updated cache query versions. Older backends produce an explicit unavailable message; the UI does not substitute a successful manual measurement. No new browser storage, credentials, package runtime, or customer-data collection is introduced.

Run `npm run test:api`, `npm run test:dashboard`, `npm run test:platform`, `npm run test:health`, `npm run test:staging`, and `npm audit --audit-level=moderate`. `.github/workflows/host-verification.yml` checks this repository's current commit; the backend's pinned-site integration job also checks V1 compatibility until its final V10 pin is updated.

Real pilot traffic, named support/on-call ownership, production SLO and recovery evidence, and product approval remain release acceptance tasks. Backend `docs/v10-release-runbook.md` contains the matched deployment and rollback procedure.
