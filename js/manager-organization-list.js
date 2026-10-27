/** Reconcile personal ownership on API versions that list memberships only.
 * Profile IDs are candidates; the personal workspace endpoint checks live access.
 */
export function createPersonalOrganizationPage({
  request,
  organizations = [],
  hasAccount = false,
  isCurrent = () => true,
}) {
  const owned = hasAccount
    ? [
        ...new Map(
          organizations
            .filter((org) => org.role === "owner")
            .map((org) => [org.id, org]),
        ).values(),
      ]
    : [];
  const seen = new Set();
  let first = true;
  const checkCurrent = () => {
    if (!isCurrent()) throw new Error("CANCELLED");
  };
  return async (path) => {
    const page = await request(path);
    checkCurrent();
    const rows = [...page.items];
    if (first) {
      if (owned.length > 100) throw new Error("LIST_LIMIT");
      const listed = new Set(rows.map((org) => org.id));
      const missing = owned.filter((org) => !listed.has(org.id));
      const recovered = new Array(missing.length);
      let next = 0;
      await Promise.all(
        Array.from({ length: Math.min(3, missing.length) }, async () => {
          while (next < missing.length) {
            checkCurrent();
            const index = next++;
            const candidate = missing[index];
            try {
              const detail = await request(
                `/organizations/${encodeURIComponent(candidate.id)}`,
              );
              checkCurrent();
              if (detail.organization?.id !== candidate.id)
                throw new Error("INVALID_RESPONSE");
              recovered[index] = {
                ...detail.organization,
                owner: { ...detail.owner, role: "user" },
                linkedSystemCount: detail.counts.systems,
              };
            } catch (error) {
              checkCurrent();
              // Stale profile metadata never grants access or produces a card.
              const stale =
                error.status !== undefined
                  ? [403, 404].includes(error.status)
                  : ["MANAGER_ACCESS_DENIED", "RESOURCE_NOT_FOUND"].includes(
                      error.code ?? error.message,
                    );
              if (!stale) throw error;
            }
          }
        }),
      );
      rows.push(...recovered.filter(Boolean));
      first = false;
    }
    checkCurrent();
    return {
      ...page,
      items: rows.filter((org) => {
        if (seen.has(org.id)) return false;
        seen.add(org.id);
        return true;
      }),
    };
  };
}
