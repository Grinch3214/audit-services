# Auto Service Pricing — Frontend

Private, mobile-first web app for auditing an auto service's catalog: which services are actually offered, which prices are correct, and what is missing. The output is a verified price list used for the new website, Google Business profile and ads.

## Features

- **Catalog** — categories → services → price items, with inline editing, reordering and moving between categories
- **Service status** — not checked / offered / not offered, plus confirmed flags on prices
- **Progress** — overall audit completion summary
- **Search** — across categories, services and prices
- **History & journal** — per-record change timeline and a global audit log
- **Trash** — soft-deleted records with restore
- **Export** — download the full catalog as JSON
- **Conflict handling** — optimistic locking; `409` responses surface the current server version

## Stack

Vue 3 (`<script setup>`, TypeScript) · Vite · Vue Router · Pinia · Tailwind CSS 4 · shadcn-vue (Reka UI) · VueUse · vue-sonner

## Getting started

Requires Node `^22.18` or `>=24.12`.

```sh
cp .env.example .env   # set API_URL
npm install
npm run dev
```

| Variable  | Description                                                    |
| --------- | -------------------------------------------------------------- |
| `API_URL` | Backend origin, without `/api` and without a trailing slash. Required. |

Local overrides go in `.env.local` (git-ignored).

## Scripts

| Command              | Description                          |
| -------------------- | ------------------------------------ |
| `npm run dev`        | Dev server with `/api` proxy         |
| `npm run build`      | Type-check and production build      |
| `npm run preview`    | Serve the production build locally   |
| `npm run lint`       | oxlint + ESLint (with `--fix`)       |
| `npm run format`     | Prettier on `src/`                   |

## How the API is wired

The app always calls relative `/api/*` with cookie-based session auth (same origin).

- **Dev** — Vite proxies `/api` to `API_URL` (`vite.config.ts → server.proxy`).
- **Build** — a Vite plugin emits `dist/_redirects` with the `/api` proxy rule and the SPA fallback.

## Deployment (Netlify)

1. Build command `npm run build`, publish directory `dist` (already in `netlify.toml`).
2. Set `API_URL` under **Site settings → Environment variables**.

All responses are sent with `X-Robots-Tag: noindex, nofollow` — the site must not be indexed.

## Project structure

```
src/
├── api/          HTTP client, typed endpoints, error types
├── components/   Feature components; ui/ holds shadcn-vue primitives
├── composables/  Shared composition functions
├── lib/          Formatting, status metadata, change helpers
├── router/       Routes and auth guard
├── stores/       Pinia stores (auth, catalog, category)
└── views/        Pages: Login, Categories, Category, Journal, Trash
```
