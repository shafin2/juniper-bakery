'use strict';

// The menu is the single source of truth: the server renders the cards and
// the order form from it, and validates every order against it.
//
// Each `art` is the inner markup of a 160x120 SVG, drawn by hand — no images.

const SHADOW = (rx) =>
  `<ellipse cx="80" cy="104" rx="${rx}" ry="6" fill="#1E1D1A" opacity=".09"/>`;

const ART = {
  sourdough: `
    ${SHADOW(56)}
    <path d="M22 80c0-28 26-48 58-48s58 20 58 48c0 14-24 22-58 22S22 94 22 80z" fill="#B0602C"/>
    <path d="M28 76c3-24 26-40 52-40s49 16 52 40c-14-9-32-13-52-13s-38 4-52 13z" fill="#C97C3E"/>
    <path d="M42 68c14-20 52-28 78-12-26-6-56-2-78 12z" fill="#F0D3A4"/>
    <g fill="#FAF3E6" opacity=".85">
      <circle cx="58" cy="50" r="1.4"/><circle cx="70" cy="44" r="1.1"/><circle cx="96" cy="46" r="1.3"/>
      <circle cx="108" cy="54" r="1"/><circle cx="84" cy="40" r="1.2"/><circle cx="50" cy="60" r="1"/>
    </g>`,

  croissant: `
    ${SHADOW(58)}
    <path d="M22 92c-4-8 2-18 12-22l8 14c-6 4-14 8-20 8z" fill="#B0622A"/>
    <path d="M138 92c4-8-2-18-12-22l-8 14c6 4 14 8 20 8z" fill="#B0622A"/>
    <path d="M30 72c4-14 16-22 28-22l6 34c-10 6-24 6-34-12z" fill="#CC8442"/>
    <path d="M130 72c-4-14-16-22-28-22l-6 34c10 6 24 6 34-12z" fill="#CC8442"/>
    <path d="M52 56c4-14 16-20 28-20s24 6 28 20l-4 30c-8 6-40 6-48 0z" fill="#E2A35E"/>
    <path d="M66 40c-6 14-6 32-2 48M94 40c6 14 6 32 2 48" stroke="#A85E25" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".55"/>
    <path d="M44 56c-2 10 0 22 6 30M116 56c2 10 0 22-6 30" stroke="#A0571F" stroke-width="2" fill="none" stroke-linecap="round" opacity=".5"/>
    <path d="M72 46c4-3 12-3 16 0" stroke="#F6D29A" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`,

  knot: `
    ${SHADOW(46)}
    <circle cx="80" cy="64" r="38" fill="#B9712F"/>
    <path d="M80 60a4 4 0 0 1 4 4a10 10 0 0 1-10 10a16 16 0 0 1-16-16a22 22 0 0 1 22-22a28 28 0 0 1 28 28" stroke="#DFA35F" stroke-width="8" fill="none" stroke-linecap="round"/>
    <g fill="#FFFDF8">
      <circle cx="66" cy="44" r="2.4"/><circle cx="98" cy="48" r="2.2"/><circle cx="58" cy="78" r="2.6"/>
      <circle cx="100" cy="80" r="2.3"/><circle cx="82" cy="90" r="2.1"/><circle cx="110" cy="62" r="2"/>
      <circle cx="52" cy="60" r="2"/><circle cx="88" cy="56" r="1.8"/>
    </g>
    <g fill="#3A2A20" opacity=".55">
      <circle cx="74" cy="52" r="1"/><circle cx="92" cy="70" r="1"/><circle cx="64" cy="66" r="1"/><circle cx="96" cy="88" r="1"/>
    </g>`,

  focaccia: `
    ${SHADOW(62)}
    <rect x="20" y="46" width="120" height="52" rx="14" fill="#C88A3C"/>
    <rect x="20" y="40" width="120" height="50" rx="14" fill="#E9BC6E"/>
    <g fill="#C98C3C" opacity=".75">
      <ellipse cx="38" cy="54" rx="3.4" ry="2.4"/><ellipse cx="62" cy="50" rx="3.4" ry="2.4"/><ellipse cx="88" cy="56" rx="3.4" ry="2.4"/>
      <ellipse cx="114" cy="50" rx="3.4" ry="2.4"/><ellipse cx="48" cy="74" rx="3.4" ry="2.4"/><ellipse cx="74" cy="70" rx="3.4" ry="2.4"/>
      <ellipse cx="100" cy="76" rx="3.4" ry="2.4"/><ellipse cx="124" cy="70" rx="3.4" ry="2.4"/>
    </g>
    <g stroke="#2F5B3E" stroke-width="2" stroke-linecap="round" fill="none">
      <path d="M44 66l20-14"/><path d="M50 62l-3-6M55 58l-2-6M60 55l-1-6M50 62l6 2M55 58l6 1M60 55l6 0"/>
      <path d="M96 64l22-10"/><path d="M102 61l-2-6M108 58l-1-6M113 56l0-6M102 61l5 3M108 58l6 2M113 56l6 1"/>
    </g>
    <g fill="#FFFDF8"><rect x="70" y="58" width="2.4" height="2.4" transform="rotate(20 71 59)"/><rect x="84" y="46" width="2.2" height="2.2"/><rect x="30" y="64" width="2.2" height="2.2"/><rect x="128" y="58" width="2.2" height="2.2"/></g>`,

  rye: `
    ${SHADOW(56)}
    <path d="M28 54q0-14 14-14h76q14 0 14 14v44H28z" fill="#5E3B29"/>
    <path d="M28 54q0-14 14-14h76q14 0 14 14v4H28z" fill="#74492F"/>
    <g fill="#E8D3A6">
      <ellipse cx="44" cy="66" rx="3" ry="1.5" transform="rotate(30 44 66)"/><ellipse cx="60" cy="80" rx="3" ry="1.5" transform="rotate(-20 60 80)"/>
      <ellipse cx="76" cy="64" rx="3" ry="1.5" transform="rotate(10 76 64)"/><ellipse cx="92" cy="84" rx="3" ry="1.5" transform="rotate(40 92 84)"/>
      <ellipse cx="106" cy="68" rx="3" ry="1.5" transform="rotate(-30 106 68)"/><ellipse cx="120" cy="86" rx="3" ry="1.5" transform="rotate(15 120 86)"/>
      <ellipse cx="50" cy="90" rx="3" ry="1.5" transform="rotate(-40 50 90)"/><ellipse cx="84" cy="48" rx="3" ry="1.5" transform="rotate(5 84 48)"/>
    </g>
    <g fill="#B79A63">
      <ellipse cx="54" cy="52" rx="2.4" ry="1.2" transform="rotate(-10 54 52)"/><ellipse cx="68" cy="94" rx="2.4" ry="1.2"/>
      <ellipse cx="100" cy="52" rx="2.4" ry="1.2" transform="rotate(25 100 52)"/><ellipse cx="114" cy="76" rx="2.4" ry="1.2"/>
      <ellipse cx="38" cy="80" rx="2.4" ry="1.2" transform="rotate(60 38 80)"/>
    </g>`,

  cookie: `
    ${SHADOW(44)}
    <circle cx="80" cy="64" r="38" fill="#C2844A"/>
    <circle cx="80" cy="62" r="31" fill="#D29A5E" opacity=".55"/>
    <g fill="#33241C">
      <path d="M60 46l9-3 5 7-7 6-7-3z"/><path d="M92 40l8 1 2 7-7 3-5-5z"/><path d="M98 66l9-1 3 8-7 5-6-4z"/>
      <path d="M66 76l8-2 4 7-6 5-7-3z"/><path d="M80 58l6 0 2 5-5 4-4-3z"/><path d="M50 64l5-1 2 5-4 3-4-2z"/>
    </g>
    <g fill="#FFFDF8"><rect x="72" y="48" width="3" height="3" transform="rotate(25 73 49)"/><rect x="88" y="78" width="3" height="3" transform="rotate(-15 89 79)"/><rect x="58" y="88" width="2.6" height="2.6"/><rect x="108" y="56" width="2.6" height="2.6" transform="rotate(40 109 57)"/></g>`,

  latte: `
    <ellipse cx="80" cy="100" rx="52" ry="10" fill="#FFFDF8"/>
    <ellipse cx="80" cy="98" rx="36" ry="6" fill="#E3D3BA"/>
    <path d="M112 60q18-1 16 13t-18 12" stroke="#FFFDF8" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M45 52h70l-6 34q-2 11-15 11H66q-13 0-15-11z" fill="#FFFDF8"/>
    <path d="M47 64h66" stroke="#1F3A2D" stroke-width="3"/>
    <ellipse cx="80" cy="52" rx="35" ry="9" fill="#FFFDF8"/>
    <ellipse cx="80" cy="52" rx="30.5" ry="7" fill="#A86B37"/>
    <path d="M80 56.5c-7-3-11-5.5-11-8.5s3-4 6-3c2 .6 3.4 2 5 3.6 1.6-1.6 3-3 5-3.6 3-1 6 0 6 3s-4 5.5-11 8.5z" fill="#F4E4CB"/>
    <g stroke="#A2471F" stroke-width="2" fill="none" stroke-linecap="round" opacity=".35">
      <path d="M70 38q-5-6 0-12t0-12"/><path d="M84 36q-5-6 0-12t0-12"/>
    </g>`,

  pourover: `
    ${SHADOW(40)}
    <path d="M52 70h56q6 0 6 8v14q0 10-10 10H56q-10 0-10-10V78q0-8 6-8z" fill="#FFFDF8" opacity=".85"/>
    <path d="M47 86h66v6q0 10-10 10H57q-10 0-10-10z" fill="#4E3022"/>
    <path d="M44 32h72l-22 34H66z" fill="#B4532A"/>
    <rect x="40" y="28" width="80" height="7" rx="3.5" fill="#94401C"/>
    <path d="M60 40l8 22M80 40v24M100 40l-8 22" stroke="#D27A4F" stroke-width="1.6" opacity=".7"/>
    <rect x="62" y="64" width="36" height="6" rx="2" fill="#94401C"/>
    <path d="M80 72v9" stroke="#4E3022" stroke-width="2.4" stroke-linecap="round"/>`,
};

const MENU = [
  { id: 'country-sourdough', name: 'Country Sourdough', price: 9.0, art: 'sourdough', tint: 'butter', tag: 'Out at 6:40',
    description: 'Three-day ferment, a blistered crust and an open, glossy crumb.' },
  { id: 'butter-croissant', name: 'Butter Croissant', price: 4.5, art: 'croissant', tint: 'blush', tag: 'House favourite',
    description: 'Laminated by hand with cultured butter. Shatters properly.' },
  { id: 'cardamom-knot', name: 'Cardamom Knot', price: 5.0, art: 'knot', tint: 'sage', tag: null,
    description: 'Swedish-style bun with freshly cracked cardamom and pearl sugar.' },
  { id: 'rosemary-focaccia', name: 'Rosemary Focaccia', price: 6.0, art: 'focaccia', tint: 'cream', tag: 'Vegan',
    description: 'Olive oil, flaky salt and rosemary from the back garden.' },
  { id: 'seeded-rye', name: 'Seeded Rye', price: 8.0, art: 'rye', tint: 'sage', tag: 'Vegan',
    description: 'Dense Danish rugbrød, packed with sunflower, flax and rye berries.' },
  { id: 'brown-butter-cookie', name: 'Brown Butter Cookie', price: 3.75, art: 'cookie', tint: 'butter', tag: null,
    description: 'Dark chocolate, sea salt, crisp edges and a chewy middle.' },
  { id: 'juniper-latte', name: 'Juniper Latte', price: 5.25, art: 'latte', tint: 'blush', tag: null,
    description: 'Double ristretto, whole or oat milk, a spoon of wildflower honey.' },
  { id: 'pour-over', name: 'Pour-Over', price: 4.75, art: 'pourover', tint: 'cream', tag: 'Rotates weekly',
    description: 'A single-origin coffee, brewed to order. Ask us what’s on.' },
];

// Pickup slots every 15 minutes, 07:00 – 18:00.
const PICKUP_SLOTS = [];
for (let m = 7 * 60; m <= 18 * 60; m += 15) {
  PICKUP_SLOTS.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
}

module.exports = { MENU, ART, PICKUP_SLOTS };
