import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto';

const aad = Buffer.from('wifigate-invite-link:v1');
const salt = Buffer.from('wifigate-invite-link:key-salt');
const info = Buffer.from('wifigate-invite-link:aes-256-gcm');

function keyFromHex(secretHex) {
  if (typeof secretHex !== 'string' || !/^(?:[0-9a-f]{2}){32,}$/i.test(secretHex)) {
    throw new Error('WIFIGATE_INVITE_LINK_SECRET must be a hex secret of at least 32 bytes');
  }
  return hkdfSync('sha256', Buffer.from(secretHex, 'hex'), salt, info, 32);
}

export function sealPayload(payload, secretHex) {
  const nonce = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', keyFromHex(secretHex), nonce);
  cipher.setAAD(aad);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()]);
  return `v1.${Buffer.concat([nonce, encrypted, cipher.getAuthTag()]).toString('base64url')}`;
}

export function openPayload(value, secretHex) {
  if (typeof value !== 'string' || !/^v1\.[A-Za-z0-9_-]+$/.test(value)) throw new Error('Invalid envelope');
  const bytes = Buffer.from(value.slice(3), 'base64url');
  if (bytes.length < 29) throw new Error('Invalid envelope');
  const decipher = createDecipheriv('aes-256-gcm', keyFromHex(secretHex), bytes.subarray(0, 12));
  decipher.setAAD(aad);
  decipher.setAuthTag(bytes.subarray(-16));
  return JSON.parse(Buffer.concat([decipher.update(bytes.subarray(12, -16)), decipher.final()]).toString('utf8'));
}
