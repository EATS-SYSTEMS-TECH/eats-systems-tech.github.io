// Convert the live controller's label payload to the factory WGQ format through
// the authenticated API. The shared factory key never reaches the website.
export function createManagerQrSource({ request, gateId, isCurrent }) {
  return async payload => {
    if (!isCurrent()) throw new Error("CANCELLED");
    if (payload?.i !== gateId) throw new Error("INVALID_RESPONSE");
    const result = await request(`/gates/${encodeURIComponent(gateId)}/qr-label`, "POST", {payload});
    if (!isCurrent()) throw new Error("CANCELLED");
    if (typeof result?.token !== "string" || !/^WGQ\.[A-Za-z0-9_-]{40,2800}$/.test(result.token)) throw new Error("INVALID_RESPONSE");
    return result.token;
  };
}
