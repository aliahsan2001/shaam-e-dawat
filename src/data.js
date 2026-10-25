/* Shaam-e-Dawat Catering — site data. Menus, prices per head, events and the estimator rules
   live here. Prices, people and contact details are placeholders for this concept. */

export const img = (id, w = 800) => `/img/p/${id}-${w > 700 ? 1280 : 640}.webp`;

export const CONFIG = {
  name: 'Shaam-e-Dawat',
  whatsappNumber: '',
  phoneDisplay: '+92 21 3486 0000',
  email: 'events@shaamedawat.example',
  kitchen: 'Plot 7, Korangi Creek Road, DHA Phase 8, Karachi',
  hours: 'Tasting room: Tue – Sun, 1 pm – 9 pm',
  minGuests: 50, maxGuests: 1000,
};

/* three menu tiers; price is per head, before event-type adjustments */
export const TIERS = [
  {
    id: 'classic', name: 'Dastarkhwan', label: 'Classic', price: 1650, photo: '1589302168068-964664d93dc0',
    line: 'The everyday feast, done properly.',
    dish: ['#c7782a', '#8a4a1e', '#e9d9a8'], // what's on the tables in 3D: rice, curry, raita
    courses: [
      ['Starters', ['Chicken pakora', 'Aloo samosa with imli chutney']],
      ['Mains', ['Chicken karahi', 'Daal mash']],
      ['Rice', ['Chicken biryani']],
      ['Bread', ['Tandoori naan', 'Roti']],
      ['Dessert', ['Kheer']],
      ['Drinks', ['Mineral water', 'Soft drinks']],
    ],
  },
  {
    id: 'royal', name: 'Nawabi', label: 'Royal', price: 2450, photo: '1555939594-58d7cb561ad1', popular: true,
    line: 'Live grills, two curries and a proper dessert table.',
    dish: ['#d08a2e', '#6a2c18', '#c94a2a'],
    courses: [
      ['Starters', ['Chicken tikka', 'Seekh kebab', 'Dahi bhallay']],
      ['Mains', ['Mutton korma', 'Chicken handi', 'Palak paneer']],
      ['Rice', ['Mutton biryani', 'Matar pulao']],
      ['Bread', ['Garlic naan', 'Roghni naan']],
      ['Dessert', ['Gulab jamun', 'Gajar halwa']],
      ['Drinks', ['Mint margarita', 'Kashmiri chai']],
    ],
  },
  {
    id: 'shahi', name: 'Shahi Dawat', label: 'Shahi', price: 3450, photo: '1672477179695-7276b0602fa9',
    line: 'The full royal spread, from live stations to a mithai bar.',
    dish: ['#e0a03a', '#5a2414', '#f2e6c8'],
    courses: [
      ['Starters', ['Lamb chops', 'Malai boti', 'Fish tikka', 'Chaat counter']],
      ['Mains', ['Mutton nihari', 'Chicken white karahi', 'Beef haleem', 'Paneer makhani']],
      ['Rice', ['Sindhi mutton biryani', 'Kabuli pulao']],
      ['Bread', ['Taftan', 'Sheermal', 'Live naan counter']],
      ['Dessert', ['Shahi tukray', 'Kulfi falooda', 'Mithai bar']],
      ['Drinks', ['Fresh juices', 'Doodh patti chai', 'Kahwa']],
    ],
  },
];

/* event types: price multiplier and what changes in the 3D hall */
export const EVENTS = [
  { id: 'wedding', name: 'Baraat or walima', mult: 1.0, setup: 'wedding' },
  { id: 'mehndi', name: 'Mehndi or dholki', mult: 0.95, setup: 'wedding' },
  { id: 'corporate', name: 'Corporate dinner', mult: 1.08, setup: 'corporate' },
  { id: 'private', name: 'Birthday or private', mult: 0.92, setup: 'birthday' },
];

export const ADDONS = [
  { id: 'bbq', name: 'Live BBQ station', perHead: 350 },
  { id: 'chai', name: 'Chai & kulfi cart', perHead: 180 },
  { id: 'decor', name: 'Marquee décor & fairy lights', flat: 185000 },
  { id: 'staff', name: 'Extra waiters (1 per 15 guests)', perHead: 120 },
];

// rough estimate: per head × guests, adjusted by event, plus add-ons; a range of ±7%
export function estimate({ guests, tier, event, addons }) {
  const t = TIERS.find((x) => x.id === tier) || TIERS[0];
  const e = EVENTS.find((x) => x.id === event) || EVENTS[0];
  let perHead = t.price * e.mult;
  ADDONS.forEach((a) => { if (addons.includes(a.id) && a.perHead) perHead += a.perHead; });
  let total = perHead * guests;
  ADDONS.forEach((a) => { if (addons.includes(a.id) && a.flat) total += a.flat; });
  if (guests >= 500) total *= 0.95; // a little off for big weddings
  return { perHead: Math.round(perHead), low: Math.round((total * 0.93) / 1000) * 1000, high: Math.round((total * 1.07) / 1000) * 1000, total };
}

export const VENUES = [
  { id: 'wedding', name: 'The wedding', line: 'A floral stage, round tables for families, and fairy lights from pole to pole.', photo: '1745573673583-a51f665ae48e', guests: '300 – 1,000', tiers: 'Nawabi or Shahi' },
  { id: 'corporate', name: 'The corporate dinner', line: 'Long tables, low candlelight, a podium for the speeches and service that keeps to time.', photo: '1768508950719-4d76978fdf44', guests: '80 – 400', tiers: 'Dastarkhwan or Nawabi' },
  { id: 'birthday', name: 'The birthday', line: 'A balloon arch, a cake table, and a menu the children will actually eat.', photo: '1741969494307-55394e3e4071', guests: '50 – 200', tiers: 'Dastarkhwan' },
];

export const GALLERY = [
  ['1745573673583-a51f665ae48e', 'Wedding', 'A floral stage for a Clifton walima'],
  ['1589302168068-964664d93dc0', 'Food', 'Chicken biryani, out of the deg'],
  ['1587271636175-90d58cdad458', 'Wedding', 'Under the mandap'],
  ['1555939594-58d7cb561ad1', 'Food', 'The live grill'],
  ['1562050344-f7ad946cee35', 'Corporate', 'A long table for a bank dinner'],
  ['1758910536889-43ce7b3199fd', 'Food', 'The mithai bar'],
  ['1744805624954-a6686543c3ff', 'Mehndi', 'A mehndi stage in marigold'],
  ['1694579740719-0e601c5d2437', 'Food', 'Karahi, finished at the table'],
  ['1767070806017-a15f5bd21130', 'Birthday', 'Fifteen, in lights'],
  ['1779308936221-89739e035a53', 'Wedding', 'An archway for the entrance'],
  ['1682862279256-b2a9e4f3d22c', 'Food', 'The Shahi spread'],
  ['1768508950719-4d76978fdf44', 'Corporate', 'Annual dinner, 220 guests'],
  ['1607861884586-c7cfaed16290', 'Wedding', 'The lit walkway'],
  ['1593701461250-d7b22dfd3a77', 'Food', 'Gulab jamun, still warm'],
  ['1736155983520-a0f7d5949d39', 'Wedding', 'A banquet set for 600'],
  ['1741969494307-55394e3e4071', 'Birthday', 'Balloons and a cake table'],
];

export const rs = (n) => 'Rs ' + Math.round(n).toLocaleString('en-PK');
export const lakh = (n) => (n >= 1e5 ? `Rs ${(n / 1e5).toFixed(n >= 1e6 ? 1 : 2).replace(/\.?0+$/, '')} lakh` : rs(n));
