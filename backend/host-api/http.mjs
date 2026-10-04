import { createHash, randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { createInvitation, HostApiError } from './core.mjs';

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  if (!/^application\/json(?:\s*;|\s*$)/i.test(req.headers['content-type'] ?? '')) {
    throw new HostApiError(400, 'INVALID_REQUEST', 'Content-Type must be application/json');
  }
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 32 * 1024) throw new HostApiError(400, 'INVALID_REQUEST', 'Request body exceeds 32KB');
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new HostApiError(400, 'INVALID_REQUEST', 'Invalid JSON'); }
}

/**
 * Integration ports are mandatory. In production they must be backed by a
 * distributed auth store, entitlement store, quota limiter and atomic durable
 * idempotency store. No development credentials or in-memory fallbacks exist.
 */
export function createHostApiServer({ authenticate, hasEntitlements, checkLimit,
  idempotency, inviteSecretHex, environment = 'live', now = () => Date.now() }) {
  if (![authenticate, hasEntitlements, checkLimit, idempotency?.run].every(v => typeof v === 'function')) {
    throw new Error('Host API integration ports are required');
  }
  return createServer(async (req, res) => {
    const requestId = `req_${randomUUID().replaceAll('-', '')}`;
    try {
      if (req.method !== 'POST' || req.url !== '/v1/guest-invitations') {
        send(res, 404, { requestId, code: 'NOT_FOUND' });
        return;
      }
      const match = /^Bearer (\S+)$/.exec(req.headers.authorization ?? '');
      const principal = match ? await authenticate(match[1]) : null;
      if (!principal || principal.environment !== environment || principal.status !== 'active') {
        throw new HostApiError(401, 'INVALID_CLIENT_API_KEY', 'Invalid Client API key');
      }
      const body = await readBody(req);
      const key = req.headers['idempotency-key'];
      if (typeof key !== 'string' || key.length < 16 || key.length > 128 || !/^[\x21-\x7e]+$/.test(key)) {
        throw new HostApiError(400, 'INVALID_REQUEST', 'Idempotency-Key must contain 16–128 visible ASCII characters');
      }
      const { decoded, input, inviteUrl } = createInvitation(body, inviteSecretHex, environment, now());
      if (!principal.scopes?.includes('guest-invitations:create')) throw new HostApiError(403, 'SCOPE_DENIED', 'Scope denied');
      if (!principal.targetTypes?.includes(decoded.targetType)) throw new HostApiError(403, 'TARGET_TYPE_DENIED', 'Target type denied');
      const bodyHash = createHash('sha256').update(JSON.stringify(body)).digest('hex');
      const response = await idempotency.run(principal.keyId, key, bodyHash, async () => {
        if (!await hasEntitlements(principal.clientId, decoded.systemIds, environment)) {
          throw new HostApiError(402, 'ENTITLEMENT_REQUIRED', 'Active entitlement required for every system');
        }
        await checkLimit(principal, decoded.systemIds.length);
        return { requestId, invitationId: `inv_${randomUUID().replaceAll('-', '')}`,
          targetType: decoded.targetType, targetId: decoded.targetId,
          startsAt: new Date(input.start).toISOString(), endsAt: new Date(input.end).toISOString(), inviteUrl };
      });
      send(res, 201, response);
    } catch (error) {
      const status = error instanceof HostApiError ? error.status : 503;
      const code = error instanceof HostApiError ? error.code : 'DEPENDENCY_UNAVAILABLE';
      send(res, status, { requestId, code, message: error instanceof HostApiError ? error.message : 'Service unavailable' },
        status === 429 ? { 'Retry-After': '60' } : {});
    }
  });
}
