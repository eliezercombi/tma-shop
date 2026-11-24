// Server-side pricing. The mini app sends item ids, options and quantities;
// every price is recomputed here from the menu, so a tampered client cannot
// change what an order costs.

import { MENU, GROUPS } from '../webapp/menu.js';

const byId = new Map(MENU.map((item) => [item.id, item]));

export function priceOrder(raw) {
  if (!raw || !Array.isArray(raw.items) || raw.items.length === 0 || raw.items.length > 30) {
    throw new Error('Empty or malformed order');
  }
  const lines = raw.items.map((line) => {
    const item = byId.get(line.id);
    const qty = Number(line.qty);
    if (!item || !Number.isInteger(qty) || qty < 1 || qty > 20) throw new Error('Unknown item or quantity');

    let unit = item.price;
    const labels = [];
    for (const key of item.groups) {
      const group = GROUPS[key];
      const chosen = [].concat(line.opts?.[key] ?? []);
      for (const option of group.options) {
        if (!chosen.includes(option.id)) continue;
        unit += option.add;
        labels.push(option.label);
      }
    }
    return { name: item.name, labels, qty, unit };
  });

  return {
    lines,
    total: lines.reduce((sum, line) => sum + line.qty * line.unit, 0),
    point: String(raw.point ?? '').slice(0, 40),
    wait: Math.min(120, Math.max(0, Number(raw.in) || 0)),
    pay: ['stars', 'ton', 'counter'].includes(raw.pay) ? raw.pay : 'counter',
    note: String(raw.note ?? '').slice(0, 200),
  };
}
