import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { verifyInitData } from '../bot/verify.mjs';

const TOKEN = '123456:TEST-TOKEN';

function sign(fields, token = TOKEN) {
  const checkString = Object.entries(fields).map(([k, v]) => `${k}=${v}`).sort().join('\n');
  const secret = createHmac('sha256', 'WebAppData').update(token).digest();
  const hash = createHmac('sha256', secret).update(checkString).digest('hex');
  return new URLSearchParams({ ...fields, hash }).toString();
}

const now = () => Math.floor(Date.now() / 1000);
const user = JSON.stringify({ id: 42, first_name: 'Ada' });

test('accepts data signed with the bot token', () => {
  const initData = sign({ auth_date: now(), query_id: 'AAE', user });
  assert.deepEqual(verifyInitData(initData, TOKEN), { id: 42, first_name: 'Ada' });
});

test('rejects data signed with another token', () => {
  const initData = sign({ auth_date: now(), user }, '999:OTHER');
  assert.equal(verifyInitData(initData, TOKEN), null);
});

test('rejects a tampered user field', () => {
  const params = new URLSearchParams(sign({ auth_date: now(), user }));
  params.set('user', JSON.stringify({ id: 1, first_name: 'Mallory' }));
  assert.equal(verifyInitData(params.toString(), TOKEN), null);
});

test('rejects stale launches', () => {
  const initData = sign({ auth_date: now() - 7200, user });
  assert.equal(verifyInitData(initData, TOKEN), null);
  assert.notEqual(verifyInitData(initData, TOKEN, 86400), null);
});

test('rejects missing or malformed hashes', () => {
  assert.equal(verifyInitData('', TOKEN), null);
  assert.equal(verifyInitData(`auth_date=${now()}&user=%7B%7D&hash=zz`, TOKEN), null);
});
