// Telegram bot for the Brew Bar mini app.
// Node 20+, no dependencies: long polling over the Bot API plus a small HTTP
// endpoint for orders sent from menu-button and inline launches.
//
//   BOT_TOKEN=123:abc WEBAPP_URL=https://example.org/ node bot.mjs
//
// Optional: PORT (default 8080), STAFF_CHAT_ID (where new orders are posted),
// STAR_USD (value of one Star used to price invoices, default 0.013).

import { createServer } from 'node:http';
import { priceOrder } from './pricing.mjs';
import { verifyInitData } from './verify.mjs';

const { BOT_TOKEN, WEBAPP_URL, STAFF_CHAT_ID } = process.env;
const PORT = Number(process.env.PORT ?? 8080);
const STAR_USD = Number(process.env.STAR_USD ?? 0.013);

if (!BOT_TOKEN || !WEBAPP_URL) {
  console.error('Set BOT_TOKEN and WEBAPP_URL before starting the bot.');
  process.exit(1);
}

const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function call(method, payload = {}) {
  const response = await fetch(`${API}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!data.ok) throw new Error(`${method}: ${data.description}`);
  return data.result;
}

/* ---------- orders ---------- */

const money = (cents) => `$${(cents / 100).toFixed(2)}`;
const escapeHtml = (text) => text.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

function receipt(order) {
  const rows = order.lines.map((line) =>
    `${line.qty} × <b>${escapeHtml(line.name)}</b>${line.labels.length ? ` <i>(${escapeHtml(line.labels.join(', '))})</i>` : ''} — ${money(line.qty * line.unit)}`);
  return [
    ...rows,
    '',
    `Total: <b>${money(order.total)}</b>`,
    `Pickup: ${escapeHtml(order.point)}, ${order.wait ? `in ${order.wait} min` : 'as soon as possible'}`,
    order.note ? `Note: ${escapeHtml(order.note)}` : null,
  ].filter((row) => row !== null).join('\n');
}

async function acceptOrder(user, raw) {
  const order = priceOrder(raw);

  if (order.pay === 'stars') {
    // Telegram Stars: currency XTR, empty provider token, amount in whole Stars.
    await call('sendInvoice', {
      chat_id: user.id,
      title: 'Brew Bar order',
      description: order.lines.map((line) => `${line.qty} × ${line.name}`).join(', ').slice(0, 255),
      payload: JSON.stringify({ t: Date.now(), total: order.total }),
      provider_token: '',
      currency: 'XTR',
      prices: [{ label: 'Order', amount: Math.ceil(order.total / 100 / STAR_USD) }],
    });
  }

  await call('sendMessage', {
    chat_id: user.id,
    parse_mode: 'HTML',
    text: `Thanks, ${escapeHtml(user.first_name ?? 'friend')}! Here is your order:\n\n${receipt(order)}`,
  });

  if (STAFF_CHAT_ID) {
    await call('sendMessage', {
      chat_id: STAFF_CHAT_ID,
      parse_mode: 'HTML',
      text: `New order from ${escapeHtml(user.first_name ?? 'guest')} (${order.pay}):\n\n${receipt(order)}`,
    });
  }
}

/* ---------- updates ---------- */

async function onMessage(message) {
  const chat_id = message.chat.id;

  if (message.web_app_data) {
    try {
      await acceptOrder(message.from, JSON.parse(message.web_app_data.data));
    } catch (error) {
      console.error(error);
      await call('sendMessage', { chat_id, text: 'Sorry, that order could not be read. Please try again.' });
    }
    return;
  }

  if (message.successful_payment) {
    return call('sendMessage', { chat_id, text: 'Payment received. We are making your order now.' });
  }

  if (message.text?.startsWith('/start') || message.text?.startsWith('/menu')) {
    return call('sendMessage', {
      chat_id,
      text: 'Welcome to Brew Bar. Tap the button below to order ahead and skip the queue.',
      reply_markup: {
        keyboard: [[{ text: 'Open the menu', web_app: { url: WEBAPP_URL } }]],
        resize_keyboard: true,
      },
    });
  }

  return call('sendMessage', { chat_id, text: 'Send /menu to open the ordering app.' });
}

async function onUpdate(update) {
  if (update.message) return onMessage(update.message);
  // Stars and other payments must be confirmed within 10 seconds.
  if (update.pre_checkout_query) return call('answerPreCheckoutQuery', { pre_checkout_query_id: update.pre_checkout_query.id, ok: true });
}

async function poll() {
  let offset = 0;
  for (;;) {
    try {
      const updates = await call('getUpdates', { offset, timeout: 50, allowed_updates: ['message', 'pre_checkout_query'] });
      for (const update of updates) {
        offset = update.update_id + 1;
        onUpdate(update).catch((error) => console.error('update failed:', error.message));
      }
    } catch (error) {
      console.error('polling failed:', error.message);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

/* ---------- HTTP endpoint for menu-button / inline launches ---------- */

const allowedOrigin = new URL(WEBAPP_URL).origin;

const server = createServer(async (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Telegram-Init-Data');
  if (request.method === 'OPTIONS') return response.writeHead(204).end();
  if (request.method !== 'POST' || request.url !== '/order') return response.writeHead(404).end();

  const user = verifyInitData(String(request.headers['x-telegram-init-data'] ?? ''), BOT_TOKEN);
  if (!user) return response.writeHead(401).end();

  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 8192) return response.writeHead(413).end();
  }

  try {
    await acceptOrder(user, JSON.parse(body));
    response.writeHead(204).end();
  } catch (error) {
    console.error(error);
    response.writeHead(400).end();
  }
});

const me = await call('getMe');
server.listen(PORT, () => console.log(`@${me.username} is running; order endpoint on :${PORT}`));
poll();
