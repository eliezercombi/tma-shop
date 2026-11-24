import { CATEGORIES, MENU, GROUPS, PICKUP_POINTS, artFor, toneFor } from './menu.js';

/* ------------------------------------------------------------------ */
/* Telegram bridge. Everything goes through these helpers so the same  */
/* build also runs in a plain browser tab.                             */
/* ------------------------------------------------------------------ */
const tg = window.Telegram?.WebApp;
const inTelegram = Boolean(tg && tg.platform && tg.platform !== 'unknown');
const API = new URLSearchParams(location.search).get('api'); // optional backend origin

const haptic = {
  tap: () => inTelegram && tg.HapticFeedback?.impactOccurred('light'),
  select: () => inTelegram && tg.HapticFeedback?.selectionChanged(),
  success: () => inTelegram && tg.HapticFeedback?.notificationOccurred('success'),
};

if (inTelegram) {
  document.body.classList.add('in-telegram');
  tg.ready();
  tg.expand();
  tg.setHeaderColor?.('secondary_bg_color');
  tg.enableClosingConfirmation?.();
}

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */
const STORE_KEY = 'brewbar.cart.v1';
const STAR_USD = 0.013; // rough value of one Telegram Star, for the estimate only
const byId = new Map(MENU.map((item) => [item.id, item]));

const state = {
  category: 'all',
  query: '',
  cart: loadCart(),
  pickupPoint: 0,
  pickupIn: 0,
  pay: 'stars',
};

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
    return saved.filter((line) => byId.has(line.id) && line.qty > 0);
  } catch {
    return [];
  }
}

function saveCart() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state.cart));
  } catch { /* private mode: the cart simply won't survive a reload */ }
}

const money = (cents) => `$${(cents / 100).toFixed(2)}`;
const $ = (id) => document.getElementById(id);

function optionsOf(item) {
  return item.groups.map((key) => ({ key, ...GROUPS[key] }));
}

function unitPrice(item, picked) {
  return optionsOf(item).reduce((sum, group) => {
    const chosen = [].concat(picked[group.key] ?? []);
    return sum + group.options.filter((o) => chosen.includes(o.id)).reduce((s, o) => s + o.add, 0);
  }, item.price);
}

function describe(item, picked) {
  return optionsOf(item)
    .flatMap((group) => group.options.filter((o) => [].concat(picked[group.key] ?? []).includes(o.id)))
    .map((o) => o.label)
    .join(' · ');
}

const lineKey = (id, picked) => `${id}|${JSON.stringify(picked)}`;
const cartCount = () => state.cart.reduce((n, line) => n + line.qty, 0);
const cartTotal = () => state.cart.reduce((n, line) => n + line.qty * line.unit, 0);
const qtyOf = (id) => state.cart.filter((line) => line.id === id).reduce((n, line) => n + line.qty, 0);

function addToCart(item, picked, qty) {
  const key = lineKey(item.id, picked);
  const existing = state.cart.find((line) => line.key === key);
  if (existing) existing.qty += qty;
  else state.cart.push({ key, id: item.id, picked, qty, unit: unitPrice(item, picked) });
  saveCart();
}

function changeQty(key, delta) {
  const line = state.cart.find((l) => l.key === key);
  if (!line) return;
  line.qty += delta;
  if (line.qty <= 0) state.cart = state.cart.filter((l) => l !== line);
  saveCart();
}

/* ------------------------------------------------------------------ */
/* Catalogue                                                           */
/* ------------------------------------------------------------------ */
function renderTabs() {
  $('tabs').innerHTML = CATEGORIES.map((c) =>
    `<button class="tab" role="tab" type="button" data-cat="${c.id}" aria-selected="${c.id === state.category}">${c.label}</button>`).join('');
}

function visibleItems() {
  const q = state.query.trim().toLowerCase();
  return MENU.filter((item) =>
    (state.category === 'all' || item.cat === state.category) &&
    (!q || `${item.name} ${item.note}`.toLowerCase().includes(q)));
}

function renderGrid() {
  const items = visibleItems();
  $('empty').hidden = items.length > 0;
  $('grid').innerHTML = items.map((item, i) => {
    const qty = qtyOf(item.id);
    return `<button class="card" type="button" data-id="${item.id}" style="--i:${i}">
      <div class="card__art" style="--tone:${toneFor(item)}">${artFor(item)}</div>
      ${item.badge ? `<span class="card__badge">${item.badge}</span>` : ''}
      ${qty ? `<span class="card__qty">${qty}</span>` : ''}
      <div class="card__body">
        <span class="card__name">${item.name}</span>
        <span class="card__note">${item.note}</span>
        <div class="card__foot"><span class="card__price">${money(item.price)}</span><span class="card__add" aria-hidden="true">+</span></div>
      </div>
    </button>`;
  }).join('');
}

function renderCartBar() {
  const count = cartCount();
  const pageOpen = !$('checkout').hidden || !$('done').hidden;
  $('cartbar').hidden = count === 0 || pageOpen;
  $('cartCount').textContent = count;
  $('cartTotal').textContent = money(cartTotal());
}

/* ------------------------------------------------------------------ */
/* Product sheet                                                       */
/* ------------------------------------------------------------------ */
let draft = null; // { item, picked, qty }

function openSheet(item) {
  const picked = {};
  for (const group of optionsOf(item)) picked[group.key] = group.pick === 'one' ? group.initial : [];
  draft = { item, picked, qty: 1 };
  renderSheet();
  $('scrim').hidden = false;
  $('sheet').hidden = false;
  document.body.style.overflow = 'hidden';
  haptic.tap();
}

function closeSheet() {
  $('scrim').hidden = true;
  $('sheet').hidden = true;
  document.body.style.overflow = '';
  draft = null;
}

function renderSheet() {
  const { item, picked, qty } = draft;
  const groups = optionsOf(item).map((group) => `
    <div class="group">
      <div class="group__label"><span>${group.label}</span><span>${group.pick === 'many' ? 'Optional' : ''}</span></div>
      <div class="chips">${group.options.map((o) => {
        const on = [].concat(picked[group.key]).includes(o.id);
        const extra = o.add ? `<small>+${money(o.add)}</small>` : o.hint ? `<small>${o.hint}</small>` : '';
        return `<button class="chip" type="button" data-group="${group.key}" data-opt="${o.id}" aria-pressed="${on}">${o.label}${extra}</button>`;
      }).join('')}</div>
    </div>`).join('');

  $('sheet').innerHTML = `
    <div class="sheet__art" style="--tone:${toneFor(item)}">${artFor(item)}
      <button class="sheet__close" type="button" data-close aria-label="Close">×</button>
    </div>
    <div class="sheet__body">
      <h2 class="sheet__title" id="sheetTitle">${item.name}</h2>
      <p class="sheet__desc">${item.desc}</p>
      <div class="sheet__meta"><span>${item.kcal} kcal</span><span>Ready in ~${item.mins} min</span></div>
      ${groups}
    </div>
    <div class="sheet__foot">
      <div class="stepper">
        <button type="button" data-step="-1" aria-label="Fewer" ${qty === 1 ? 'disabled' : ''}>−</button>
        <output>${qty}</output>
        <button type="button" data-step="1" aria-label="More">+</button>
      </div>
      <button class="btn" type="button" data-add><span>Add to order</span><span>${money(unitPrice(item, picked) * qty)}</span></button>
    </div>`;
}

$('sheet').addEventListener('click', (event) => {
  const target = event.target.closest('button');
  if (!target || !draft) return;

  if (target.dataset.close !== undefined) return closeSheet();

  if (target.dataset.opt) {
    const group = GROUPS[target.dataset.group];
    const id = target.dataset.opt;
    if (group.pick === 'one') draft.picked[target.dataset.group] = id;
    else {
      const set = new Set(draft.picked[target.dataset.group]);
      set.has(id) ? set.delete(id) : set.add(id);
      draft.picked[target.dataset.group] = [...set].sort();
    }
    haptic.select();
    return keepScroll(renderSheet);
  }

  if (target.dataset.step) {
    draft.qty = Math.min(20, Math.max(1, draft.qty + Number(target.dataset.step)));
    haptic.select();
    return keepScroll(renderSheet);
  }

  if (target.dataset.add !== undefined) {
    const { item, picked, qty } = draft;
    addToCart(item, picked, qty);
    haptic.success();
    closeSheet();
    renderGrid();
    renderCartBar();
    toast(`${qty} × ${item.name} added`);
  }
});

function keepScroll(render) {
  const top = $('sheet').scrollTop;
  render();
  $('sheet').scrollTop = top;
}

/* ------------------------------------------------------------------ */
/* Checkout                                                            */
/* ------------------------------------------------------------------ */
const PICKUP_TIMES = [{ label: 'ASAP', mins: 0 }, { label: '15 min', mins: 15 }, { label: '30 min', mins: 30 }];
const PAY_METHODS = [{ id: 'stars', label: 'Stars' }, { id: 'ton', label: 'TON' }, { id: 'counter', label: 'At pickup' }];

function openCheckout() {
  $('checkout').hidden = false;
  renderCheckout();
  renderCartBar();
  if (inTelegram) {
    tg.BackButton.show();
    tg.MainButton.show();
  }
  haptic.tap();
}

function closeCheckout() {
  $('checkout').hidden = true;
  if (inTelegram) {
    tg.BackButton.hide();
    tg.MainButton.hide();
  }
  renderGrid();
  renderCartBar();
}

function payLabel() {
  const total = cartTotal();
  if (state.pay === 'stars') return `Pay ${Math.ceil(total / 100 / STAR_USD)} ⭐`;
  if (state.pay === 'ton') return `Pay ${money(total)} in TON`;
  return `Place order · ${money(total)}`;
}

function renderCheckout() {
  if (state.cart.length === 0) return closeCheckout();
  const note = $('note')?.value ?? '';

  const lines = state.cart.map((line) => {
    const item = byId.get(line.id);
    return `<div class="line">
      <div class="line__art" style="--tone:${toneFor(item)}">${artFor(item)}</div>
      <div class="line__text"><div class="line__name">${item.name}</div><div class="line__opts">${describe(item, line.picked) || 'Standard'}</div></div>
      <div class="stepper stepper--sm">
        <button type="button" data-line="${encodeURIComponent(line.key)}" data-step="-1" aria-label="Fewer">−</button>
        <output>${line.qty}</output>
        <button type="button" data-line="${encodeURIComponent(line.key)}" data-step="1" aria-label="More">+</button>
      </div>
      <div class="line__price">${money(line.qty * line.unit)}</div>
    </div>`;
  }).join('');

  const seg = (name, options, current) => `<div class="seg">${options.map((o, i) => {
    const value = o.id ?? i;
    return `<button type="button" data-seg="${name}" data-value="${value}" aria-pressed="${value === current}">${o.label}</button>`;
  }).join('')}</div>`;

  const total = cartTotal();
  $('checkout').innerHTML = `<div class="page__inner">
    <div class="page__bar">
      ${inTelegram ? '' : '<button class="page__back" type="button" data-back aria-label="Back to menu">←</button>'}
      <h2 class="page__title" id="checkoutTitle">Your order</h2>
    </div>
    <div class="block">${lines}</div>
    <div class="block">
      <div class="field"><span class="field__label">Pickup at</span><strong>${PICKUP_POINTS[state.pickupPoint]}</strong></div>
      <div class="field"><span class="field__label">When</span>${seg('pickupIn', PICKUP_TIMES, state.pickupIn)}</div>
      <div class="field"><span class="field__label">Payment</span>${seg('pay', PAY_METHODS, state.pay)}</div>
    </div>
    <div class="block"><textarea class="note" id="note" rows="2" maxlength="200" placeholder="Note for the barista (optional)"></textarea></div>
    <div class="block">
      <div class="sum"><span>Subtotal</span><span>${money(total)}</span></div>
      <div class="sum"><span>Service</span><span>Free</span></div>
      <div class="sum sum--total"><span>Total</span><span>${money(total)}</span></div>
    </div>
  </div>
  <div class="paybar"><button class="btn btn--center" type="button" data-pay>${payLabel()}</button></div>`;

  $('note').value = note;
  if (inTelegram) tg.MainButton.setText(payLabel());
}

$('checkout').addEventListener('click', (event) => {
  const target = event.target.closest('button');
  if (!target) return;

  if (target.dataset.back !== undefined) return closeCheckout();
  if (target.dataset.pay !== undefined) return submitOrder();

  if (target.dataset.line) {
    changeQty(decodeURIComponent(target.dataset.line), Number(target.dataset.step));
    haptic.select();
    return renderCheckout();
  }

  if (target.dataset.seg) {
    const raw = target.dataset.value;
    state[target.dataset.seg] = target.dataset.seg === 'pay' ? raw : Number(raw);
    haptic.select();
    renderCheckout();
  }
});

/* ------------------------------------------------------------------ */
/* Sending the order                                                   */
/* ------------------------------------------------------------------ */
function buildOrder() {
  return {
    items: state.cart.map((line) => ({ id: line.id, opts: line.picked, qty: line.qty, unit: line.unit })),
    total: cartTotal(),
    point: PICKUP_POINTS[state.pickupPoint],
    in: PICKUP_TIMES[state.pickupIn].mins,
    pay: state.pay,
    note: ($('note')?.value ?? '').trim().slice(0, 200),
  };
}

let sending = false;

async function submitOrder() {
  if (sending || state.cart.length === 0) return;
  sending = true;
  const order = buildOrder();
  if (inTelegram) tg.MainButton.showProgress();

  try {
    if (API) {
      // Menu-button and inline launches: the backend validates initData and replies to the user.
      const response = await fetch(`${API}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Telegram-Init-Data': tg?.initData ?? '' },
        body: JSON.stringify(order),
      });
      if (!response.ok) throw new Error(`Server answered ${response.status}`);
    } else if (inTelegram && !tg.initDataUnsafe?.query_id) {
      // Keyboard-button launch: hand the order to the bot and let Telegram close the app.
      clearCart();
      tg.sendData(JSON.stringify(order));
      return;
    } else {
      await new Promise((resolve) => setTimeout(resolve, 700)); // browser demo
    }
    showDone(order);
  } catch (error) {
    toast('Could not send the order. Please try again.');
    console.error(error);
  } finally {
    sending = false;
    if (inTelegram) tg.MainButton.hideProgress();
  }
}

function clearCart() {
  state.cart = [];
  saveCart();
}

function showDone(order) {
  const wait = Math.max(order.in, Math.max(...order.items.map((line) => byId.get(line.id).mins)) + 2);
  const code = `${'ABCDEFGHJK'[Math.floor(Math.random() * 10)]}-${String(Math.floor(Math.random() * 900) + 100)}`;
  clearCart();
  $('checkout').hidden = true;
  $('done').hidden = false;
  $('done').innerHTML = `<div>
    <div class="done__ring"><svg viewBox="0 0 24 24"><path d="M5 12.5 10 17.5 19.5 7"/></svg></div>
    <h2 class="done__title">Order placed</h2>
    <p class="done__text">Ready in about ${wait} minutes at ${order.point}. Show this code at the counter.</p>
    <div class="done__code">${code}</div>
    <div><button class="btn btn--ghost btn--center done__btn" type="button" id="again">Back to menu</button></div>
  </div>`;
  if (inTelegram) {
    tg.MainButton.hide();
    tg.BackButton.hide();
    tg.disableClosingConfirmation?.();
  }
  haptic.success();
  $('again').addEventListener('click', () => {
    $('done').hidden = true;
    renderGrid();
    renderCartBar();
  });
}

/* ------------------------------------------------------------------ */
/* Small things                                                        */
/* ------------------------------------------------------------------ */
let toastTimer;
function toast(message) {
  const el = $('toast');
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 1800);
}

function greet() {
  const hour = new Date().getHours();
  const part = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const name = tg?.initDataUnsafe?.user?.first_name;
  $('greeting').textContent = name ? `${part}, ${name}` : part;
}

$('tabs').addEventListener('click', (event) => {
  const tab = event.target.closest('[data-cat]');
  if (!tab) return;
  state.category = tab.dataset.cat;
  haptic.select();
  renderTabs();
  renderGrid();
});

$('grid').addEventListener('click', (event) => {
  const card = event.target.closest('[data-id]');
  if (card) openSheet(byId.get(card.dataset.id));
});

$('search').addEventListener('input', (event) => {
  state.query = event.target.value;
  renderGrid();
});

$('pickup').addEventListener('click', () => {
  state.pickupPoint = (state.pickupPoint + 1) % PICKUP_POINTS.length;
  $('pickupLabel').textContent = PICKUP_POINTS[state.pickupPoint];
  haptic.select();
});

$('cartbar').addEventListener('click', openCheckout);
$('scrim').addEventListener('click', closeSheet);
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && draft) closeSheet(); });

if (inTelegram) {
  tg.BackButton.onClick(closeCheckout);
  tg.MainButton.onClick(submitOrder);
}

greet();
renderTabs();
renderGrid();
renderCartBar();
