import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { after, test } from 'node:test';
import { gcm } from '@noble/ciphers/aes.js';
import { managedNonce, utf8ToBytes } from '@noble/ciphers/utils.js';
import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { buildGuestPayload, createInvitation, decodeHostKey, HostApiError } from './core.mjs';
import { openPayload, sealPayload } from './crypto.mjs';
import { createHostApiServer } from './http.mjs';

const secret = randomBytes(32).toString('hex');
const now = Date.parse('2026-09-27T10:00:00Z');
const gate = (i, gc = 'PULSE') => ({ i, n: `Gate ${i}`, kid: 'key-1', dpk: 'a'.repeat(66), psk: 'b'.repeat(64), gc });
const base = { k: 'guests-api-key', h: '+972501111111', he: 'host@example.com', hn: 'Host' };
const body = (value) => ({ encryptedKeyValue: `wgk_live_${sealPayload(value, secret)}`,
  guest: { name: 'Guest', phone: '+972509999999', floor: '4' },
  access: { startsAt: '2026-09-28T10:00:00Z', endsAt: '2026-09-29T10:00:00Z' },
  delivery: { channel: 'none' }, externalReference: 'booking-1' });

test('Node encryption is readable by mobile noble cipher and vice versa', () => {
  const key = hkdf(sha256, Buffer.from(secret, 'hex'), utf8ToBytes('wifigate-invite-link:key-salt'),
    utf8ToBytes('wifigate-invite-link:aes-256-gcm'), 32);
  const mobileCipher = managedNonce(gcm);
  const mobileValue = `v1.${Buffer.from(mobileCipher(key, utf8ToBytes('wifigate-invite-link:v1'))
    .encrypt(utf8ToBytes(JSON.stringify({ hello: 'mobile' })))).toString('base64url')}`;
  assert.deepEqual(openPayload(mobileValue, secret), { hello: 'mobile' });
  const serverValue = sealPayload({ hello: 'backend' }, secret);
  const decrypted = mobileCipher(key, utf8ToBytes('wifigate-invite-link:v1'))
    .decrypt(Buffer.from(serverValue.slice(3), 'base64url'));
  assert.deepEqual(JSON.parse(Buffer.from(decrypted).toString()), { hello: 'backend' });
});

for (const [type, value, count] of [
  ['gate', { ...base, sc: 'gate', gate: gate('1', 'TOGGLE') }, 1],
  ['dual-control', { ...base, sc: 'dual-control', dcid: 'dc1', n: 'Parking', l1: 'On', l2: 'Off', dcf: 'TOGGLE', gs: [gate('1'), gate('2')] }, 2],
  ['group', { ...base, sc: 'group', gid: 'gr1', n: 'Hotel', gs: [gate('1')],
    dcs: [{ dcid: 'dc1', n: 'Parking', l1: 'On', l2: 'Off', gs: [gate('2'), gate('3')] }] }, 3],
]) {
  test(`${type} produces a private, time bound mobile invitation`, () => {
    const request = body(value);
    const result = createInvitation(request, secret, 'live', now);
    assert.equal(result.decoded.targetType, type);
    assert.equal(result.decoded.systemIds.length, count);
    const ep = new URL(result.inviteUrl).searchParams.get('ep');
    const invite = openPayload(ep, secret);
    assert.equal(invite.g, 1);
    assert.equal(invite.p, request.guest.phone);
    assert.equal(invite.he, base.he);
    assert.equal(invite.fl, '4');
    assert.equal(invite.it, 'TB');
    assert.equal(invite.ss, Date.parse(request.access.startsAt));
    if (type === 'gate') assert.equal(invite.gc, 'TOGGLE');
    else assert.equal(invite.k, type);
  });
}

test('rejects duplicate group systems, incomplete pairing and invalid access windows', () => {
  const duplicate = { ...base, sc: 'group', gid: 'gr1', n: 'Group', gs: [gate('1'), gate('1')] };
  assert.throws(() => decodeHostKey(body(duplicate).encryptedKeyValue, secret), e => e.code === 'INVALID_SYSTEM_VALUE');
  assert.throws(() => decodeHostKey(body({ ...base, sc: 'gate', gate: { i: '1', n: 'Gate' } }).encryptedKeyValue, secret),
    e => e.code === 'INVALID_SYSTEM_VALUE');
  assert.throws(() => decodeHostKey(body({ ...base, sc: 'gate', gate: { ...gate('1'), r: 'A' } }).encryptedKeyValue, secret),
    e => e.code === 'INVALID_SYSTEM_VALUE');
  const request = body({ ...base, sc: 'gate', gate: gate('1') });
  request.access.endsAt = request.access.startsAt;
  assert.throws(() => createInvitation(request, secret, 'live', now), e => e.code === 'INVALID_REQUEST');
});

test('HTTP authenticates before parsing and checks scope, entitlement and idempotency', async () => {
  const records = new Map();
  const server = createHostApiServer({ inviteSecretHex: secret, now: () => now,
    authenticate: async token => token === 'valid' ? { keyId: 'key1', clientId: 'client1', environment: 'live', status: 'active',
      scopes: ['guest-invitations:create'], targetTypes: ['gate'] } : null,
    hasEntitlements: async (_client, ids) => ids.length === 1 && ids[0] === '1',
    checkLimit: async () => {},
    idempotency: { run: async (id, key, hash, create) => {
      const lookup = `${id}:${key}`;
      if (records.has(lookup)) {
        const old = records.get(lookup);
        if (old.hash !== hash) throw new HostApiError(409, 'IDEMPOTENCY_CONFLICT', 'Body changed');
        return old.response;
      }
      const response = await create();
      records.set(lookup, { hash, response });
      return response;
    } },
  });
  server.listen(0, '127.0.0.1');
  after(() => server.close());
  await new Promise(resolve => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}/v1/guest-invitations`;
  const request = body({ ...base, sc: 'gate', gate: gate('1') });
  const post = (token, value = request) => fetch(url, { method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Idempotency-Key': 'reservation-12345678' },
    body: JSON.stringify(value) });
  const unauthorized = await post('invalid', { invalid: true });
  assert.equal(unauthorized.status, 401);
  const first = await post('valid');
  assert.equal(first.status, 201);
  const firstBody = await first.json();
  const replay = await post('valid');
  assert.deepEqual(await replay.json(), firstBody);
  const conflict = await post('valid', { ...request, externalReference: 'booking-2' });
  assert.equal(conflict.status, 409);
});
