import { createHmac, timingSafeEqual } from 'node:crypto';

// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
export function verifyInitData(initData, token, maxAgeSeconds = 3600) {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');

  const checkString = [...params].map(([key, value]) => `${key}=${value}`).sort().join('\n');
  const secret = createHmac('sha256', 'WebAppData').update(token).digest();
  const expected = createHmac('sha256', secret).update(checkString).digest();
  const given = Buffer.from(hash, 'hex');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;

  // Reject stale launches (and tolerate a minute of clock drift).
  const age = Date.now() / 1000 - Number(params.get('auth_date'));
  if (!(age >= -60 && age <= maxAgeSeconds)) return null;

  try {
    return JSON.parse(params.get('user'));
  } catch {
    return null;
  }
}
