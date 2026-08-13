# KARIKAALA Mailchimp Campaigns Dashboard

A small Node.js/Express app: a public monthly Mailchimp dashboard (`/`) plus a
password-protected admin page (`/admin`) where you can add, edit, and delete
months and individual campaigns without touching code.

Built as a companion to the `karikaala-ads-app` (Meta Ads) dashboard, using
the same architecture, so the two run and deploy the same way.

## How it's built

- `server.js` — Express app: serves the frontend and a small JSON API.
- - `db.js` — storage layer. Currently backed by a JSON file
  -   (`data/campaigns.json`, auto-created from `data/seed.json` on first run).
  -     All reads/writes go through this one module, so swapping in a real
  -   database later (e.g. Postgres) only means editing `db.js`.
  -   - `public/index.html` — the public dashboard (fetches `/api/months`).
      - - `public/admin.html` — the admin editor (login, then add/edit/delete).
       
        - Seeded with real 2026 Mailchimp campaign data (21 campaigns, Jan–Aug, pulled
        - live from the connected Mailchimp account). Note: Mailchimp doesn't expose a
        - per-campaign cost/expense the way ad platforms do — it's a flat subscription
        - fee — so "Revenue" is tracked instead of "Spend"; all current values are
        - $0.00 because Mailchimp reported no attributed revenue for these campaigns.
       
        - ## Running locally
       
        - ```bash
          npm install
          ADMIN_PASSWORD=yourpassword SESSION_SECRET=some-random-string npm start
          ```

          Visit `http://localhost:3000` for the dashboard and
          `http://localhost:3000/admin` for the editor.

          ## Deploying to your own domain

          This needs a host that runs a persistent Node process (not a static host) —
          Netlify/Vercel's free tiers are serverless and won't keep the JSON file
          between requests. **Render** or **Railway** are the simplest fits and both
          have free/cheap tiers that work well for a small internal tool.

          ### Option A — Render (recommended)

          1. Push this folder to a GitHub repository.
          2. 2. On [render.com](https://render.com), click **New → Web Service**, connect
             3.    the repo.
             4.3. Settings:
                  - Build command: `npm install`
                  - Start command: `npm start`
               4. Add environment variables (Render dashboard → Environment):
               5.    - `ADMIN_PASSWORD` — pick a real password
                     -    - `SESSION_SECRET` — any long random string
                          -    - `NODE_ENV` = `production`
                               - 5. Add a **persistent disk** (Render dashboard → Disks) mounted at
                                 6.    `/opt/render/project/src/data` so `campaigns.json` survives deploys/restarts.
                                 7.6. Once deployed, go to **Settings → Custom Domain**, add your domain (e.g.
                                      `mailchimp.yourdomain.com`), and create the CNAME record Render gives you
                                      at your domain registrar/DNS provider.

                                   ### Option B — Railway

                                 Same idea: connect the GitHub repo, set the same two environment variables,
                                 attach a volume mounted at `/app/data`, then add your custom domain under
                                 the service's **Settings → Networking**.

                                 ### Keeping data safe

                                 Because this starter uses a JSON file, back it up occasionally (Render lets
                                 you shell in and download `data/campaigns.json`, or you can add a scheduled
                                 export later). If this dashboard becomes a serious daily tool, migrating
                                 `db.js` to a real database (Render's managed Postgres is one click away) is
                                 the next natural step — nothing else in the app needs to change.

                                 ## Adding a new month of Mailchimp data

                                 Go to `/admin`, log in, type the new month (e.g. `2026-09`) into "Add month",
                                 then add each campaign's date, name, status, opens, clicks, unsubscribes,
                                 and revenue using the form. Everything saves immediately — the public
                                 dashboard picks it up on next page load.
                                 
