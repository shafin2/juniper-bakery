# Juniper — Bakery & Coffee

A small demo web app for a fictional neighbourhood bakery on Linden Row, Brooklyn. It has a home page with the menu, and an **Order ahead** form that saves orders and lists today's latest ones.

- Node.js 20+, Express and `pg`. No build step and no frontend framework.
- Orders go to **Postgres** when `DATABASE_URL` is set. Without it they are kept **in memory** and lost on restart. The page shows which one is in use.

## Run it

```bash
npm install
npm start
```

Then open http://localhost:3000.

## Environment variables

| Variable       | Default | Purpose |
| -------------- | ------- | ------- |
| `PORT`         | `3000`  | Port to listen on (binds to `0.0.0.0`). |
| `DATABASE_URL` | unset   | Postgres connection string, e.g. `postgresql://user:pass@host:5432/db`. When set, the `orders` table is created on boot if it doesn't exist. Plain TCP is tried first, then SSL. If the URL has `sslmode=require`, SSL is tried first. |

## Endpoints

| Method | Path          | Returns |
| ------ | ------------- | ------- |
| GET    | `/`           | The site |
| GET    | `/health`     | `200 ok` |
| GET    | `/api/info`   | `{ "version": "v1", "storage": "postgres" \| "memory" }` |
| GET    | `/api/orders` | The latest 8 orders and today's count |
| POST   | `/api/orders` | Creates an order from `{ "name", "item", "pickupTime" }` |

The app version lives in `const VERSION` at the top of `server.js`.
