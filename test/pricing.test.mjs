import { test } from 'node:test';
import assert from 'node:assert/strict';
import { priceOrder } from '../bot/pricing.mjs';

test('recomputes prices from the menu and ignores client totals', () => {
  const order = priceOrder({
    items: [
      { id: 'flat-white', qty: 2, unit: 1, opts: { size: 'm', milk: 'oat', extras: ['shot'] } },
      { id: 'cookie', qty: 1, unit: 1, opts: { warm: 'warm' } },
    ],
    total: 3,
    point: 'Old Town',
    in: 15,
    pay: 'ton',
  });
  assert.equal(order.lines[0].unit, 390 + 60 + 50 + 80);
  assert.deepEqual(order.lines[0].labels, ['Medium', 'Oat', 'Extra shot']);
  assert.equal(order.total, 2 * 580 + 270);
  assert.equal(order.pay, 'ton');
  assert.equal(order.wait, 15);
});

test('ignores options that do not belong to the item', () => {
  const order = priceOrder({ items: [{ id: 'croissant', qty: 1, opts: { size: 'l', extras: ['shot'] } }] });
  assert.equal(order.total, 320);
});

test('falls back to paying at the counter for unknown payment methods', () => {
  assert.equal(priceOrder({ items: [{ id: 'filter', qty: 1 }], pay: 'free' }).pay, 'counter');
});

test('rejects unknown items, bad quantities and empty orders', () => {
  assert.throws(() => priceOrder({ items: [{ id: 'nope', qty: 1 }] }));
  assert.throws(() => priceOrder({ items: [{ id: 'filter', qty: 0 }] }));
  assert.throws(() => priceOrder({ items: [{ id: 'filter', qty: 1.5 }] }));
  assert.throws(() => priceOrder({ items: [] }));
  assert.throws(() => priceOrder(null));
});

test('trims free-text fields', () => {
  const order = priceOrder({ items: [{ id: 'filter', qty: 1 }], note: 'x'.repeat(500), point: 'y'.repeat(100) });
  assert.equal(order.note.length, 200);
  assert.equal(order.point.length, 40);
});
