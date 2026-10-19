'use strict';

const VERSION = 'v2';

const fs = require('fs');
const path = require('path');
const express = require('express');
const { MENU, ART, PICKUP_SLOTS } = require('./menu');

const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';
const DATABASE_URL = process.env.DATABASE_URL;

const MENU_BY_ID = new Map(MENU.map((item) => [item.id, item]));
const SLOT_SET = new Set(PICKUP_SLOTS);

/* ------------------------------------------------------------------ */
/* Storage: Postgres when DATABASE_URL is set, otherwise in memory.    */
/* ------------------------------------------------------------------ */

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function memoryStore() {
  const orders = [];
  let nextId = 1;
  return {
    kind: 'memory',
    async add({ name, item, pickupTime }) {
      const order = { id: nextId++, name, item, pickupTime, createdAt: new Date().toISOString() };
      orders.push(order);
      if (orders.length > 5000) orders.shift();
      return order;
    },
    async latest(limit) {
      return orders.slice(-limit).reverse();
    },
    async countToday() {
      const start = startOfToday();
      return orders.filter((o) => new Date(o.createdAt) >= start).length;
    },
    async close() {},
  };
}

const CREATE_TABLE = `
  CREATE TABLE IF NOT EXISTS orders (
    id            SERIAL PRIMARY KEY,
    customer_name TEXT        NOT NULL,
    item          TEXT        NOT NULL,
    pickup_time   TEXT        NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;

const ROW = `id, customer_name AS name, item, pickup_time AS "pickupTime", created_at AS "createdAt"`;

// Internal-network databases usually speak plain TCP, so try that first and
// fall back to SSL (without CA verification). If the URL asks for SSL
// explicitly, try SSL first. `sslmode` is stripped so we control it here.
function connectionCandidates(url) {
  let sslmode = null;
  let connectionString = url;
  try {
    const u = new URL(url);
    sslmode = u.searchParams.get('sslmode');
    u.searchParams.delete('sslmode');
    u.searchParams.delete('ssl');
    connectionString = u.toString();
  } catch {
    /* not parseable as a URL — hand it to pg untouched */
  }
  const plain = { connectionString, ssl: false };
  const tls = { connectionString, ssl: { rejectUnauthorized: false } };
  if (sslmode === 'disable') return [plain];
  if (sslmode && sslmode !== 'prefer' && sslmode !== 'allow') return [tls, plain];
  return [plain, tls];
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function postgresStore(url) {
  const { Pool } = require('pg');
  const candidates = connectionCandidates(url);
  const attempts = 15;
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    for (const config of candidates) {
      const pool = new Pool({ ...config, max: 5, connectionTimeoutMillis: 5000 });
      try {
        await pool.query(CREATE_TABLE);
        pool.on('error', (err) => console.error('[db] idle client error:', err.message));
        console.log(`[db] connected to Postgres (${config.ssl ? 'ssl' : 'no ssl'}), table "orders" ready`);
        return {
          kind: 'postgres',
          async add({ name, item, pickupTime }) {
            const { rows } = await pool.query(
              `INSERT INTO orders (customer_name, item, pickup_time) VALUES ($1, $2, $3) RETURNING ${ROW}`,
              [name, item, pickupTime],
            );
            return rows[0];
          },
          async latest(limit) {
            const { rows } = await pool.query(
              `SELECT ${ROW} FROM orders ORDER BY created_at DESC, id DESC LIMIT $1`,
              [limit],
            );
            return rows;
          },
          async countToday() {
            const { rows } = await pool.query(
              `SELECT count(*)::int AS n FROM orders WHERE created_at >= date_trunc('day', now())`,
            );
            return rows[0].n;
          },
          close: () => pool.end(),
        };
      } catch (err) {
        lastError = err;
        await pool.end().catch(() => {});
      }
    }
    console.warn(`[db] not reachable yet (attempt ${attempt}/${attempts}): ${lastError.message}`);
    if (attempt < attempts) await sleep(2000);
  }
  throw lastError;
}

/* ------------------------------------------------------------------ */
/* Page rendering                                                      */
/* ------------------------------------------------------------------ */

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const formatPrice = (n) => `$${n.toFixed(2)}`;

function renderMenuCards() {
  return MENU.map(
    (item, i) => `
        <li class="card">
          <div class="card-art tint-${item.tint}">
            <svg viewBox="0 0 160 120" role="img" aria-label="${escapeHtml(item.name)} illustration">${ART[item.art]}</svg>
            <span class="card-no" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
          </div>
          <div class="card-body">
            <div class="card-head">
              <h3>${escapeHtml(item.name)}</h3>
              <span class="price">${formatPrice(item.price)}</span>
            </div>
            <p>${escapeHtml(item.description)}</p>
            ${item.tag ? `<span class="tag">${escapeHtml(item.tag)}</span>` : ''}
          </div>
        </li>`,
  ).join('');
}

function renderPage() {
  const template = fs.readFileSync(path.join(__dirname, 'views', 'index.html'), 'utf8');
  return template
    .replace('{{HERO_SOURDOUGH}}', ART.sourdough)
    .replace('{{HERO_CROISSANT}}', ART.croissant)
    .replace('{{MENU_CARDS}}', renderMenuCards())
    .replace(
      '{{ITEM_OPTIONS}}',
      MENU.map((i) => `<option value="${escapeHtml(i.id)}">${escapeHtml(i.name)} — ${formatPrice(i.price)}</option>`).join(''),
    )
    .replace('{{PICKUP_OPTIONS}}', PICKUP_SLOTS.map((s) => `<option value="${s}">${s}</option>`).join(''));
}

/* ------------------------------------------------------------------ */
/* App                                                                 */
/* ------------------------------------------------------------------ */

function validateOrder(body) {
  const errors = {};
  const name = typeof body?.name === 'string' ? body.name.trim().replace(/\s+/g, ' ') : '';
  if (!name) errors.name = 'Please tell us your name.';
  else if (name.length > 40) errors.name = 'Keep your name under 40 characters.';
  // eslint-disable-next-line no-control-regex
  else if (/[\u0000-\u001f\u007f]/.test(name)) errors.name = 'That name has characters we can’t print.';

  const item = MENU_BY_ID.get(typeof body?.item === 'string' ? body.item : '');
  if (!item) errors.item = 'Please pick something from the menu.';

  const pickupTime = typeof body?.pickupTime === 'string' ? body.pickupTime : '';
  if (!SLOT_SET.has(pickupTime)) errors.pickupTime = 'Pick a time between 07:00 and 18:00.';

  return Object.keys(errors).length ? { errors } : { order: { name, item: item.name, pickupTime } };
}

function createApp(store) {
  const app = express();
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });
  app.use(express.json({ limit: '10kb' }));

  const page = renderPage();
  app.get('/', (req, res) => {
    res.set('Cache-Control', 'no-cache');
    res.type('html').send(page);
  });
  app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1h' }));

  app.get('/health', (req, res) => res.type('text').send('ok'));

  app.get('/api/info', (req, res) => res.json({ version: VERSION, storage: store.kind }));

  app.get('/api/orders', async (req, res, next) => {
    try {
      const [orders, todayCount] = await Promise.all([store.latest(8), store.countToday()]);
      res.set('Cache-Control', 'no-store');
      res.json({ orders, todayCount, storage: store.kind });
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/orders', async (req, res, next) => {
    const { order, errors } = validateOrder(req.body);
    if (errors) return res.status(400).json({ error: 'Please check the highlighted fields.', fields: errors });
    try {
      const saved = await store.add(order);
      res.status(201).json({ order: saved });
    } catch (err) {
      next(err);
    }
  });

  app.use((req, res) => res.status(404).json({ error: 'Not found' }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body.' });
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request too large.' });
    console.error('[app] error:', err);
    res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
  });

  return app;
}

async function main() {
  const store = DATABASE_URL ? await postgresStore(DATABASE_URL) : memoryStore();
  if (store.kind === 'memory') console.log('[db] DATABASE_URL not set — keeping orders in memory');

  const server = createApp(store).listen(PORT, HOST, () => {
    console.log(`Juniper ${VERSION} listening on http://${HOST}:${PORT} (storage: ${store.kind})`);
  });

  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down`);
    server.close(() => Promise.resolve(store.close()).finally(() => process.exit(0)));
    setTimeout(() => process.exit(0), 5000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('[boot] failed to start:', err.message);
  process.exit(1);
});
