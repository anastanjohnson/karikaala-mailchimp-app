const express = require("express");
const session = require("express-session");
const path = require("path");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "changeme";
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret-change-in-production";

db.ensureDataFile();

app.use(express.json());
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 },
  })
);
app.use(express.static(path.join(__dirname, "public")));

function requireAuth(req, res, next) {
  if (req.session && req.session.loggedIn) return next();
  return res.status(401).json({ error: "Not authenticated" });
}

function validChannel(req, res, next) {
  const { channel } = req.params;
  if (!db.CHANNELS[channel]) {
    return res.status(400).json({ error: "Unknown channel. Use 'mailchimp' or 'meta'." });
  }
  next();
}

// --- Auth ---
app.post("/api/login", (req, res) => {
  const { password } = req.body || {};
  if (password === ADMIN_PASSWORD) {
    req.session.loggedIn = true;
    return res.json({ ok: true });
  }
  return res.status(401).json({ error: "Wrong password" });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get("/api/session", (req, res) => {
  res.json({ loggedIn: !!(req.session && req.session.loggedIn) });
});

// --- Data (multi-channel) ---
app.get("/api/:channel/months", validChannel, (req, res) => {
  res.json(db.getMonths(req.params.channel));
});

app.get("/api/:channel/months/:month", validChannel, (req, res) => {
  const monthData = db.getMonth(req.params.channel, req.params.month);
  if (!monthData) return res.status(404).json({ error: "Month not found" });
  res.json(monthData);
});

app.put("/api/:channel/months/:month", validChannel, requireAuth, (req, res) => {
  const key = db.CHANNELS[req.params.channel];
  const existing = db.getMonth(req.params.channel, req.params.month);
  const body = req.body && req.body[key] ? req.body : { [key]: [] };
  if (existing && existing.invoice !== undefined && body.invoice === undefined) {
    body.invoice = existing.invoice;
  }
  const saved = db.setMonth(req.params.channel, req.params.month, body);
  res.json(saved);
});

// Monthly invoice / plan cost (mailchimp is a flat subscription, billed monthly, not per campaign)
app.put("/api/:channel/months/:month/invoice", validChannel, requireAuth, (req, res) => {
  const amount = Number((req.body || {}).invoice);
  const saved = db.setInvoice(req.params.channel, req.params.month, isNaN(amount) ? 0 : amount);
  res.json(saved);
});

// Monthly guest visit counts (restaurant-wide, not tied to a marketing channel)
app.get("/api/guests/months", (req, res) => {
  res.json(db.getGuests());
});

app.put("/api/guests/months/:month", requireAuth, (req, res) => {
  const amount = Number((req.body || {}).guests);
  const saved = db.setGuests(req.params.month, isNaN(amount) ? 0 : amount);
  res.json({ month: req.params.month, guests: saved });
});

app.delete("/api/:channel/months/:month", validChannel, requireAuth, (req, res) => {
  db.deleteMonth(req.params.channel, req.params.month);
  res.json({ ok: true });
});

// item = campaign (mailchimp) or ad (meta)
function normalizeItem(channel, raw) {
  if (channel === "mailchimp") {
    return {
      date: String(raw.date || ""),
      name: String(raw.name || ""),
      status: String(raw.status || "sent"),
      opens: Number(raw.opens) || 0,
      clicks: Number(raw.clicks) || 0,
      unsubscribes: Number(raw.unsubscribes) || 0,
      revenue: Number(raw.revenue) || 0,
    };
  }
  return {
    date: String(raw.date || ""),
    name: String(raw.name || ""),
    status: String(raw.status || "completed"),
    resultType: String(raw.resultType || ""),
    results: Number(raw.results) || 0,
    views: Number(raw.views) || 0,
    viewers: Number(raw.viewers) || 0,
    spend: Number(raw.spend) || 0,
  };
}

const itemRoute = (channel) => (db.CHANNELS[channel] === "campaigns" ? "campaigns" : "ads");

app.post("/api/:channel/months/:month/items", validChannel, requireAuth, (req, res) => {
  const item = normalizeItem(req.params.channel, req.body || {});
  const saved = db.addItem(req.params.channel, req.params.month, item);
  res.json(saved);
});

app.put("/api/:channel/months/:month/items/:index", validChannel, requireAuth, (req, res) => {
  const item = normalizeItem(req.params.channel, req.body || {});
  const saved = db.updateItem(req.params.channel, req.params.month, Number(req.params.index), item);
  if (!saved) return res.status(404).json({ error: "Not found" });
  res.json(saved);
});

app.delete("/api/:channel/months/:month/items/:index", validChannel, requireAuth, (req, res) => {
  db.deleteItem(req.params.channel, req.params.month, Number(req.params.index));
  res.json({ ok: true });
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.listen(PORT, () => {
  console.log(`KARIKAALA marketing dashboard listening on port ${PORT}`);
});
