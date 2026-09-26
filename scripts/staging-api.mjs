import { createServer } from "node:http";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

if (process.env.FIREBASE_AUTH_EMULATOR_HOST !== "127.0.0.1:9099") {
  throw new Error("Staging API requires the local Firebase Auth Emulator");
}

const projectId = "demo-wifigate-host";
const allowedOrigins = new Set(["http://127.0.0.1:8100", "http://localhost:8100"]);
const auth = getAuth(initializeApp({ projectId }));
const clients = [
  { clientId: "grand-plaza", name: "Grand Plaza Hotels · Demo", status: "active" },
  { clientId: "citystay", name: "CityStay PMS · Demo", status: "active" }
];
const keys = [
  { keyId: "demo-key-1", clientId: "grand-plaza", ownerEmail: "owner@grandplaza.test", label: "HOST_DEMO_MAIN", prefix: "wfg_test_k_A1B2", last4: "4D5E", status: "active", lastUsedAt: "2026-09-27T08:00:00Z" },
  { keyId: "demo-key-2", clientId: "grand-plaza", ownerEmail: "member@grandplaza.test", label: "HOST_DEMO_MEMBER", prefix: "wfg_test_k_F6G7", last4: "8H9J", status: "active", lastUsedAt: "2026-09-26T14:00:00Z" }
];
const usage = { totalAuthenticatedRequests: 9842, invitationsCreated: 9611, idempotentReplays: 173, errors: 58 };
const audit = [
  { action: "client.created", target: "grand-plaza", createdAt: "2026-09-26T09:00:00Z" },
  { action: "key.issued", target: "demo-key-1", createdAt: "2026-09-26T10:00:00Z" }
];

function send(res, status, body, origin) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Vary": "Origin",
    ...(allowedOrigins.has(origin) ? { "Access-Control-Allow-Origin": origin } : {})
  });
  res.end(JSON.stringify(body));
}
function persona(decoded) {
  if (decoded.email_verified !== true) return null;
  const email = String(decoded.email || "").toLowerCase();
  if (["admin@wifigate.test", "admin-e2e@wifigate.test"].includes(email)) return { role: "platform_admin", memberships: [] };
  if (["owner@grandplaza.test", "owner-e2e@grandplaza.test"].includes(email)) return { role: "client_owner", memberships: [{ clientId: "grand-plaza", clientName: clients[0].name, role: "client_owner", status: "active" }] };
  if (["member@grandplaza.test", "member-e2e@grandplaza.test"].includes(email)) return { role: "client_member", memberships: [{ clientId: "grand-plaza", clientName: clients[0].name, role: "client_member", status: "active" }] };
  return null;
}

const server = createServer(async (req, res) => {
  const origin = req.headers.origin || "";
  if (req.method === "OPTIONS") {
    if (!allowedOrigins.has(origin)) { send(res, 403, { code: "ORIGIN_DENIED" }, origin); return; }
    res.writeHead(204, {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Accept",
      "Access-Control-Max-Age": "600",
      "Vary": "Origin"
    });
    res.end();
    return;
  }
  if (req.method !== "GET") { send(res, 405, { code: "METHOD_NOT_ALLOWED" }, origin); return; }
  if (req.url === "/health") { send(res, 200, { status: "ok", environment: "local-staging" }, origin); return; }
  if (origin && !allowedOrigins.has(origin)) { send(res, 403, { code: "ORIGIN_DENIED" }, origin); return; }
  const bearer = /^Bearer (\S+)$/.exec(req.headers.authorization || "");
  if (!bearer) { send(res, 401, { code: "UNAUTHENTICATED" }, origin); return; }
  let decoded;
  try { decoded = await auth.verifyIdToken(bearer[1]); }
  catch { send(res, 401, { code: "INVALID_ID_TOKEN" }, origin); return; }
  const access = persona(decoded);
  if (!access) { send(res, 403, { code: "MEMBERSHIP_REQUIRED" }, origin); return; }
  const admin = access.role === "platform_admin";
  const email = String(decoded.email).toLowerCase();
  let body;
  switch (req.url) {
    case "/v1/me": body = { uid: decoded.uid, email, ...access }; break;
    case "/v1/portal/keys":
      if (admin) break;
      body = { keys: keys.filter((key) => access.role === "client_owner" || key.ownerEmail === email || email === "member-e2e@grandplaza.test" && key.ownerEmail === "member@grandplaza.test").map(({ ownerEmail, clientId, ...metadata }) => metadata) };
      break;
    case "/v1/portal/usage":
      if (admin) break;
      body = { summary: access.role === "client_owner" ? usage : { totalAuthenticatedRequests: 304, invitationsCreated: 290, idempotentReplays: 9, errors: 5 } };
      break;
    case "/v1/admin/clients": if (admin) body = { clients }; break;
    case "/v1/admin/usage": if (admin) body = { summary: { totalAuthenticatedRequests: 14533, invitationsCreated: 13900, idempotentReplays: 480, errors: 153 } }; break;
    case "/v1/admin/audit": if (admin) body = { events: audit }; break;
    default: send(res, 404, { code: "NOT_FOUND" }, origin); return;
  }
  if (!body) { send(res, 403, { code: "ROLE_DENIED" }, origin); return; }
  send(res, 200, body, origin);
});

server.listen(8101, "127.0.0.1", () => console.log("Staging API: http://127.0.0.1:8101"));
