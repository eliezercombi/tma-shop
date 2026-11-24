// Menu data and the small SVG illustrations used instead of photos.
// Prices are in cents so totals never touch floating point.

export const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'coffee', label: 'Coffee' },
  { id: 'cold', label: 'Cold' },
  { id: 'tea', label: 'Tea' },
  { id: 'bakery', label: 'Bakery' },
];

const SIZES = [
  { id: 's', label: 'Small', hint: '250 ml', add: 0 },
  { id: 'm', label: 'Medium', hint: '350 ml', add: 60 },
  { id: 'l', label: 'Large', hint: '450 ml', add: 110 },
];

const MILKS = [
  { id: 'whole', label: 'Whole', add: 0 },
  { id: 'oat', label: 'Oat', add: 50 },
  { id: 'almond', label: 'Almond', add: 50 },
  { id: 'none', label: 'No milk', add: 0 },
];

const EXTRAS = [
  { id: 'shot', label: 'Extra shot', add: 80 },
  { id: 'vanilla', label: 'Vanilla', add: 40 },
  { id: 'caramel', label: 'Caramel', add: 40 },
  { id: 'cinnamon', label: 'Cinnamon', add: 0 },
];

const WARM = [{ id: 'warm', label: 'Warmed', add: 0 }, { id: 'asis', label: 'As is', add: 0 }];

export const MENU = [
  { id: 'flat-white', cat: 'coffee', name: 'Flat White', note: 'Double ristretto, silky milk', price: 390, kcal: 120, mins: 3, badge: 'Popular',
    desc: 'Two ristretto shots under a thin layer of microfoam. Stronger than a latte, softer than a cortado.',
    art: 'cup', tone: ['#f4d9bd', '#e2b58a'], ink: '#6b3a1c', groups: ['size', 'milk', 'extras'] },
  { id: 'cappuccino', cat: 'coffee', name: 'Cappuccino', note: 'Espresso, thick foam', price: 370, kcal: 110, mins: 3,
    desc: 'Equal parts espresso, steamed milk and foam, finished with a dusting of cocoa.',
    art: 'cup', tone: ['#f1e2cf', '#d9bd9c'], ink: '#7a4a26', groups: ['size', 'milk', 'extras'] },
  { id: 'filter', cat: 'coffee', name: 'Batch Filter', note: 'Ethiopia Guji, washed', price: 290, kcal: 5, mins: 1, badge: 'New',
    desc: 'Brewed every thirty minutes. Jasmine, apricot and a long sweet finish.',
    art: 'cup', tone: ['#e6d3c3', '#c9a78a'], ink: '#3d2413', groups: ['size', 'extras'] },
  { id: 'mocha', cat: 'coffee', name: 'Dark Mocha', note: '70% chocolate, espresso', price: 430, kcal: 240, mins: 4,
    desc: 'Melted dark chocolate stirred into espresso and topped with steamed milk.',
    art: 'cup', tone: ['#e0c4b4', '#b98c76'], ink: '#3a1e14', groups: ['size', 'milk', 'extras'] },
  { id: 'iced-latte', cat: 'cold', name: 'Iced Latte', note: 'Espresso over cold milk', price: 410, kcal: 130, mins: 2, badge: 'Popular',
    desc: 'A double shot poured over ice and cold milk. Clean, sweet and not watered down.',
    art: 'glass', tone: ['#d6e6ef', '#a9cbdb'], ink: '#8a5a36', groups: ['size', 'milk', 'extras'] },
  { id: 'cold-brew', cat: 'cold', name: 'Cold Brew', note: 'Steeped for 16 hours', price: 380, kcal: 5, mins: 1,
    desc: 'Slow-steeped overnight for a heavy body with notes of cocoa and dried cherry.',
    art: 'glass', tone: ['#d9dfe9', '#aab6cc'], ink: '#2e1c14', groups: ['size', 'extras'] },
  { id: 'espresso-tonic', cat: 'cold', name: 'Espresso Tonic', note: 'Tonic, orange peel', price: 420, kcal: 70, mins: 2,
    desc: 'Bright espresso floated on tonic water with a twist of orange. Bitter, fizzy, addictive.',
    art: 'glass', tone: ['#f6e3c5', '#efc48a'], ink: '#b3541e', groups: ['size'] },
  { id: 'matcha', cat: 'tea', name: 'Matcha Latte', note: 'Ceremonial grade', price: 450, kcal: 140, mins: 3,
    desc: 'Stone-ground Uji matcha whisked to order and topped with steamed milk.',
    art: 'cup', tone: ['#dcebd3', '#b5d3a4'], ink: '#5c8a3a', groups: ['size', 'milk'] },
  { id: 'earl-grey', cat: 'tea', name: 'Earl Grey', note: 'Bergamot, loose leaf', price: 280, kcal: 0, mins: 4,
    desc: 'Ceylon black tea scented with cold-pressed bergamot. Served in a pot.',
    art: 'cup', tone: ['#ece2d6', '#d3c0a8'], ink: '#a8622c', groups: ['size'] },
  { id: 'croissant', cat: 'bakery', name: 'Butter Croissant', note: 'Baked this morning', price: 320, kcal: 310, mins: 1, badge: 'Fresh',
    desc: 'Laminated over three days with cultured butter. Shatters properly.',
    art: 'croissant', tone: ['#f7e6c4', '#eccf96'], ink: '#c98a3a', groups: ['warm'] },
  { id: 'cookie', cat: 'bakery', name: 'Rye Chocolate Cookie', note: 'Sea salt, dark chocolate', price: 270, kcal: 280, mins: 1,
    desc: 'Rye flour, brown butter and big puddles of dark chocolate with flaky salt.',
    art: 'cookie', tone: ['#efd9c8', '#dcb89c'], ink: '#8a5630', groups: ['warm'] },
  { id: 'banana-bread', cat: 'bakery', name: 'Banana Bread', note: 'Walnuts, brown sugar', price: 340, kcal: 330, mins: 1,
    desc: 'A thick slice, toasted on request, with salted butter on the side.',
    art: 'loaf', tone: ['#f3e2c9', '#e3c79c'], ink: '#a8713a', groups: ['warm'] },
];

export const GROUPS = {
  size: { label: 'Size', pick: 'one', options: SIZES, initial: 'm' },
  milk: { label: 'Milk', pick: 'one', options: MILKS, initial: 'whole' },
  extras: { label: 'Extras', pick: 'many', options: EXTRAS },
  warm: { label: 'Serve', pick: 'one', options: WARM, initial: 'warm' },
};

export const PICKUP_POINTS = ['Old Town', 'Riverside', 'Station Hall'];

const steam = '<path d="M38 20c-4-5 4-8 0-13M52 20c-4-5 4-8 0-13" fill="none" stroke="rgba(255,255,255,.75)" stroke-width="3" stroke-linecap="round"/>';

const ART = {
  cup: (ink) => `<svg viewBox="0 0 96 96" aria-hidden="true">${steam}
    <path d="M18 34h54v20c0 15-12 27-27 27S18 69 18 54z" fill="#fff"/>
    <path d="M72 40h6a10 10 0 0 1 0 20h-8" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/>
    <ellipse cx="45" cy="34" rx="27" ry="7" fill="${ink}"/>
    <path d="M36 34c3-3 6-3 9 0 3-3 6-3 9 0-3 3-6 4-9 4s-6-1-9-4z" fill="rgba(255,255,255,.7)"/>
    <ellipse cx="45" cy="86" rx="30" ry="4" fill="rgba(0,0,0,.08)"/></svg>`,
  glass: (ink) => `<svg viewBox="0 0 96 96" aria-hidden="true">
    <path d="M56 6 46 30" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
    <path d="M24 26h48l-6 58a6 6 0 0 1-6 5H36a6 6 0 0 1-6-5z" fill="rgba(255,255,255,.55)"/>
    <path d="M27 48h42l-4 36a5 5 0 0 1-5 4H36a5 5 0 0 1-5-4z" fill="${ink}"/>
    <path d="M26 40h44l-1 8H27z" fill="rgba(255,255,255,.85)"/>
    <rect x="34" y="52" width="13" height="13" rx="3" fill="rgba(255,255,255,.35)" transform="rotate(-12 40 58)"/>
    <rect x="50" y="62" width="12" height="12" rx="3" fill="rgba(255,255,255,.28)" transform="rotate(14 56 68)"/></svg>`,
  croissant: (ink) => `<svg viewBox="0 0 96 96" aria-hidden="true">
    <ellipse cx="48" cy="80" rx="34" ry="5" fill="rgba(0,0,0,.08)"/>
    <path d="M10 58c2-22 20-36 38-36s36 14 38 36c-8 2-14-2-17-8-4 8-12 12-21 12s-17-4-21-12c-3 6-9 10-17 8z" fill="${ink}"/>
    <path d="M31 30c-3 10-3 20 0 28M48 24v38M65 30c3 10 3 20 0 28" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="4" stroke-linecap="round"/></svg>`,
  cookie: (ink) => `<svg viewBox="0 0 96 96" aria-hidden="true">
    <ellipse cx="48" cy="84" rx="30" ry="4" fill="rgba(0,0,0,.08)"/>
    <circle cx="48" cy="48" r="32" fill="${ink}"/>
    <g fill="#3a2015"><circle cx="36" cy="38" r="6"/><circle cx="58" cy="34" r="4.5"/><circle cx="62" cy="54" r="6.5"/><circle cx="42" cy="60" r="5"/><circle cx="50" cy="46" r="3"/></g>
    <g fill="rgba(255,255,255,.8)"><rect x="29" y="50" width="3" height="3" rx="1"/><rect x="54" y="66" width="3" height="3" rx="1"/><rect x="66" y="42" width="3" height="3" rx="1"/></g></svg>`,
  loaf: (ink) => `<svg viewBox="0 0 96 96" aria-hidden="true">
    <ellipse cx="48" cy="82" rx="34" ry="4" fill="rgba(0,0,0,.08)"/>
    <path d="M14 46c0-14 12-22 34-22s34 8 34 22v24a6 6 0 0 1-6 6H20a6 6 0 0 1-6-6z" fill="${ink}"/>
    <path d="M22 48c0-9 9-15 26-15s26 6 26 15v18a3 3 0 0 1-3 3H25a3 3 0 0 1-3-3z" fill="rgba(255,255,255,.42)"/>
    <g fill="${ink}"><circle cx="38" cy="50" r="3"/><circle cx="56" cy="46" r="2.5"/><circle cx="50" cy="60" r="3"/><circle cx="64" cy="58" r="2"/></g></svg>`,
};

export const artFor = (item) => ART[item.art](item.ink);
export const toneFor = (item) => `linear-gradient(150deg, ${item.tone[0]}, ${item.tone[1]})`;
