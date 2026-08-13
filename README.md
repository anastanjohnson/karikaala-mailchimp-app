# KARIKAALA Marketing Dashboard (Meta Ads + Mailchimp)

A single Node.js/Express app that brings **Meta Ads** and **Mailchimp**
campaign performance into one dashboard, with a month-by-month view per
channel and a combined "Compare channels" view. Includes a
password-protected admin page (`/admin`) for adding, editing, and deleting
months and individual campaigns/ads without touching code.

## How it's built

- `server.js` — Express app: serves the frontend and a small JSON API,
  namespaced per channel (`/api/mailchimp/...` and `/api/meta/...`).
- `db.js` — storage layer. Backed by a JSON file (`data/marketing.json`,
  auto-created from `data/seed.json` on first run) with a top-level split
  between `mailchimp` and `meta`, each keyed by month (`YYYY-MM`).
- `public/index.html` — the public dashboard: tabs for Mailchimp, Meta Ads,
  and a combined Compare view.
- `public/admin.html` — the admin editor (login, pick a channel, then
  add/edit/delete months and items).

Seeded with real 2026 data: Mailchimp campaigns (Jan–Aug) pulled live from
the connected Mailchimp account, and Meta Ads performance (Jan–Jul) from
the KARIKAALA ad account. Mailchimp doesn't expose a per-campaign
cost/expense the way ad platforms do — it's a flat subscription fee — so
"Revenue" is tracked instead of "Spend" for that channel; Meta Ads spend is
real ad spend in EUR.

## Running locally

```bash
npm install
ADMIN_PASSWORD=yourpassword SESSION_SECRET=some-random-string npm start
```

Visit `http://localhost:3000` for the dashboard and
`http://localhost:3000/admin` for the editor.

## Deploying to your own domain

This needs a host that runs a persistent Node process (not a static host).
**Render** or **Railway** are simplest.

### Option A — Render (recommended)

1. Push this folder to a GitHub repository.
2. On [render.com](https://render.com), click **New → Web Service**, connect
   the repo.
3. Settings:
   - Build command: `npm install`
   - Start command: `npm start`
4. Add environment variables:
   - `ADMIN_PASSWORD` — pick a real password
   - `SESSION_SECRET` — any long random string
5. Add a **persistent disk** mounted at the app's `data` directory so
   `marketing.json` survives deploys/restarts (otherwise it resets to the
   seed data on every deploy on the free tier).

### Option B — Railway

Same idea: connect the GitHub repo, set the same two environment variables,
attach a volume mounted at `/app/data`.

## Adding a new month of data

Go to `/admin`, log in, pick the channel (Mailchimp campaigns or Meta Ads),
type the new month (e.g. `2026-09`) into "Add month", then add each
campaign/ad using the form. Everything saves immediately — the public
dashboard picks it up on next page load.
