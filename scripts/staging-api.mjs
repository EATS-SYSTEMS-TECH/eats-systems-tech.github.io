import { createServer } from "node:http";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
if (process.env.FIREBASE_AUTH_EMULATOR_HOST !== "127.0.0.1:9099") throw new Error("Staging API requires the local Firebase Auth Emulator");
const auth = getAuth(initializeApp({ projectId: "demo-wifigate-host" }));
const allowedOrigins = new Set(["http://127.0.0.1:8100", "http://localhost:8100"]);
const approvals = new Set();
function send(res, status, body, origin) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", Vary: "Origin", ...(allowedOrigins.has(origin) ? { "Access-Control-Allow-Origin": origin } : {}) });
  res.end(JSON.stringify(body));
}
function profile(decoded, record) {
  const email = String(decoded.email || "").toLowerCase();
  const admin = ["admin@wifigate.test", "admin-e2e@wifigate.test"].includes(email);
  const approved = admin || approvals.has(email) || /^(owner|member)(-e2e)?@grandplaza\.test$/.test(email);
  const state = !decoded.email_verified ? "denied" : approved ? "active" : email.startsWith("pending") ? "pending" : "denied";
  const enrolled = Boolean(record.multiFactor?.enrolledFactors?.some((factor) => factor.factorId === "totp"));
  const verified = enrolled && decoded.firebase?.sign_in_second_factor === "totp";
  return { user: { uid: decoded.uid, email, displayName: record.displayName || null, emailVerified: decoded.email_verified === true }, role: approved ? admin ? "admin" : "user" : null, access: { state }, mfa: { required: admin, enrolled, verified } };
}
const server = createServer(async (req, res) => {
  const origin = req.headers.origin || "";
  if (origin && !allowedOrigins.has(origin)) { send(res, 403, { error: { code: "ORIGIN_DENIED" } }, origin); return; }
  if (req.method === "OPTIONS") {
    if (!allowedOrigins.has(origin)) { send(res, 403, { error: { code: "ORIGIN_DENIED" } }, origin); return; }
    res.writeHead(204, { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "GET, PUT, POST, OPTIONS", "Access-Control-Allow-Headers": "Authorization, Accept, Content-Type, Cache-Control, Idempotency-Key", Vary: "Origin" }); res.end(); return;
  }
  if (req.url === "/health") { send(res, 200, { status: "ok", environment: "local-staging" }, origin); return; }
  const bearer = /^Bearer (\S+)$/.exec(req.headers.authorization || "");
  if (!bearer) { send(res, 401, { error: { code: "UNAUTHENTICATED" } }, origin); return; }
  let decoded; let record;
  try { decoded = await auth.verifyIdToken(bearer[1]); record = await auth.getUser(decoded.uid); }
  catch { send(res, 401, { error: { code: "INVALID_ID_TOKEN" } }, origin); return; }
  const me = profile(decoded, record);
  if (req.url === "/api/v1/users/me" && ["PUT", "GET"].includes(req.method)) { send(res, 200, me, origin); return; }
  if (req.url === "/api/v1/admin/portal-access" && req.method === "POST") {
    if (me.role !== "admin" || me.access.state !== "active" || !me.mfa.verified) { send(res, 403, { error: { code: "MFA_REQUIRED" } }, origin); return; }
    try {
      let raw = ""; for await (const chunk of req) { raw += chunk; if (raw.length > 2048) throw new Error("body-size"); }
      const { email } = JSON.parse(raw);
      if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("invalid-email");
      approvals.add(email.trim().toLowerCase()); send(res, 200, { access: { state: "active" } }, origin);
    } catch { send(res, 400, { error: { code: "INVALID_REQUEST" } }, origin); }
    return;
  }
  send(res, 404, { error: { code: "NOT_FOUND" } }, origin);
});
server.listen(8101, "127.0.0.1", () => console.log("Staging API: http://127.0.0.1:8101"));
