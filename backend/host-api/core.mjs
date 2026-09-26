import { openPayload, sealPayload } from './crypto.mjs';

export class HostApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const invalid = (message) => { throw new HostApiError(400, 'INVALID_REQUEST', message); };
const invalidValue = (message) => { throw new HostApiError(422, 'INVALID_SYSTEM_VALUE', message); };
const record = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const nonempty = (v) => typeof v === 'string' && v.trim().length > 0;
const phone = (v) => typeof v === 'string' && /^\+[1-9]\d{6,14}$/.test(v);
const commandTypes = new Set(['PULSE', 'PULSE_AFTER_PULSE', 'PULSE_AFTER_PULSE_AFTER_PULSE', 'PUSH_BUTTON', 'TOGGLE']);
const gateFields = new Set(['i', 'n', 'kid', 'dpk', 'psk', 'sn', 's', 'gc', 'fc', 'v', 'gi', 'ad', 'alat', 'alng', 'cm', 'rn', 'fl', 'ap', 'pk']);
const dualFields = new Set(['dcid', 'n', 'gs', 'l1', 'l2', 'dcf', 'dci', 'ad', 'alat', 'alng']);
const groupFields = new Set(['gid', 'n', 'gs', 'dcs', 'ad', 'alat', 'alng', 'cm', 'rn', 'fl', 'ap', 'pk']);
function allowedFields(value, fields) {
  if (Object.keys(value).some(key => !fields.has(key))) invalidValue('Unexpected Host KEY snapshot field');
}

function gateSnapshot(gate) {
  if (!record(gate) || !nonempty(gate.i) || !nonempty(gate.n) ||
      !nonempty(gate.kid) || !nonempty(gate.dpk) || !nonempty(gate.psk)) invalidValue('Incomplete gate snapshot');
  allowedFields(gate, gateFields);
  if (gate.gc !== undefined && !commandTypes.has(gate.gc)) invalidValue('Unsupported gate command');
  return gate.i;
}

function dualSnapshot(dual, topLevel = false) {
  if (!record(dual) || !nonempty(dual.dcid) || !nonempty(dual.n) ||
      !nonempty(dual.l1) || !nonempty(dual.l2) || !Array.isArray(dual.gs) || dual.gs.length !== 2) {
    invalidValue('Dual Control requires two gates and its metadata');
  }
  if (!topLevel) allowedFields(dual, dualFields);
  if (dual.dcf !== undefined && !['PULSE', 'PUSH_BUTTON', 'TOGGLE'].includes(dual.dcf)) invalidValue('Invalid Dual Control family');
  const ids = dual.gs.map(gateSnapshot);
  if (ids[0] === ids[1]) invalidValue('Dual Control gates must be distinct');
  return ids;
}

export function decodeHostKey(encryptedKeyValue, secretHex, environment = 'live') {
  const prefix = `wgk_${environment}_`;
  if (typeof encryptedKeyValue !== 'string' || !encryptedKeyValue.startsWith(`${prefix}v1.`)) invalidValue('Invalid Host KEY prefix');
  if (encryptedKeyValue.length > 12 * 1024) invalidValue('Host KEY exceeds 12KB');
  let value;
  try { value = openPayload(encryptedKeyValue.slice(prefix.length), secretHex); }
  catch { invalidValue('Host KEY authentication failed'); }
  if (!record(value) || value.k !== 'guests-api-key' || !phone(value.h) ||
      !nonempty(value.he) || value.he !== value.he.toLowerCase()) invalidValue('Invalid Host KEY identity');
  const commonFields = new Set(['k', 'sc', 'h', 'he', 'hn']);
  let ids;
  let targetId;
  if (value.sc === 'gate') {
    allowedFields(value, new Set([...commonFields, 'gate']));
    ids = [gateSnapshot(value.gate)];
    targetId = ids[0];
  } else if (value.sc === 'dual-control') {
    allowedFields(value, new Set([...commonFields, ...dualFields]));
    ids = dualSnapshot(value, true);
    targetId = value.dcid;
  } else if (value.sc === 'group') {
    allowedFields(value, new Set([...commonFields, ...groupFields]));
    if (!nonempty(value.gid) || !nonempty(value.n) || !Array.isArray(value.gs) ||
        (value.dcs !== undefined && !Array.isArray(value.dcs))) invalidValue('Invalid Group snapshot');
    ids = [...value.gs.map(gateSnapshot), ...(value.dcs ?? []).flatMap(dualSnapshot)];
    if (ids.length < 1 || ids.length > 20 || new Set(ids).size !== ids.length) invalidValue('Group must contain 1–20 unique systems');
    targetId = value.gid;
  } else invalidValue('Unsupported target type');
  return { snapshot: value, targetType: value.sc, targetId, systemIds: ids };
}

function requiredText(value, max, label) {
  if (!nonempty(value) || value.length > max) invalid(`${label} is required and limited to ${max} characters`);
  return value.trim();
}

function optionalText(value, max, label) {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || value.length > max) invalid(`${label} must be text of at most ${max} characters`);
  return value.trim() || undefined;
}

function time(value, label) {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(value)) invalid(`${label} must be RFC 3339 with offset`);
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) invalid(`${label} is invalid`);
  return ms;
}

export function validateInvitationRequest(body, now = Date.now()) {
  if (!record(body) || !record(body.guest) || !record(body.access) ||
      !record(body.delivery) || body.delivery.channel !== 'none') invalid('Invalid request structure');
  for (const key of Object.keys(body)) {
    if (!['encryptedKeyValue', 'guest', 'access', 'externalReference', 'delivery'].includes(key)) invalid(`Unexpected field: ${key}`);
  }
  for (const key of Object.keys(body.guest)) {
    if (!['name', 'phone', 'email', 'floor', 'apartment', 'parking', 'carNumber', 'comment'].includes(key)) invalid(`Unexpected guest field: ${key}`);
  }
  if (Object.keys(body.delivery).some(key => key !== 'channel')) invalid('Unexpected delivery field');
  if (Object.keys(body.access).some(key => !['startsAt', 'endsAt'].includes(key))) invalid('Unexpected access field');
  const name = requiredText(body.guest.name, 120, 'guest.name');
  if (!phone(body.guest.phone)) invalid('guest.phone must be E.164');
  const start = time(body.access.startsAt, 'access.startsAt');
  const end = time(body.access.endsAt, 'access.endsAt');
  if (start < now - 15 * 60_000 || start > now + 730 * 86_400_000 ||
      end - start < 60_000 || end - start > 365 * 86_400_000) invalid('Access window is outside product limits');
  const guest = { name, phone: body.guest.phone };
  for (const [field, max] of Object.entries({ email: 254, floor: 50, apartment: 80, parking: 80, carNumber: 50, comment: 100 })) {
    const value = optionalText(body.guest[field], max, `guest.${field}`);
    if (value !== undefined) guest[field] = value;
  }
  if (guest.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email)) invalid('guest.email is invalid');
  const externalReference = optionalText(body.externalReference, 128, 'externalReference');
  return { guest, start, end, externalReference };
}

export function buildGuestPayload(decoded, input, issuedAt = Date.now()) {
  const { snapshot, targetType } = decoded;
  const details = { gn: input.guest.name, p: input.guest.phone };
  const defaults = targetType === 'gate' ? snapshot.gate : snapshot;
  for (const [source, dest] of Object.entries({ floor: 'fl', apartment: 'ap', parking: 'pk', comment: 'cm', carNumber: 'car' })) {
    const value = input.guest[source] ?? defaults[dest];
    if (value !== undefined) details[dest] = value;
  }
  const shared = { g: 1, h: snapshot.h, he: snapshot.he, p: input.guest.phone,
    cg: 0, it: 'TB', ti: issuedAt, ss: input.start, se: input.end, ...details };
  if (snapshot.hn) shared.hn = snapshot.hn;
  if (targetType === 'gate') return { ...snapshot.gate, ...shared };
  const { k, sc, h, he, hn, ...entity } = snapshot;
  return { ...entity, k: targetType, ...shared };
}

export function createInvitation(body, secretHex, environment = 'live', now = Date.now()) {
  const input = validateInvitationRequest(body, now);
  const decoded = decodeHostKey(body.encryptedKeyValue, secretHex, environment);
  const payload = buildGuestPayload(decoded, input, now);
  const inviteUrl = `https://wifigate.io/wifigate-api/?ep=${encodeURIComponent(sealPayload(payload, secretHex))}`;
  if (inviteUrl.length > 16 * 1024) invalidValue('Invitation URL is too large');
  return { decoded, input, inviteUrl, payload };
}
