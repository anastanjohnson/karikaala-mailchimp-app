const express = require("express");
const session = require("express-session");
const path = require("path");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "changeme";
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret-change-in-production";

app.use(express.json());
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
          httpOnly: true,
          maxAge: 1000 * 60 * 60 * 8, // 8 hours
          secure: process.env.NODE_ENV === "production",
    },
}));

function requireAuth(req, res, next) {
    if (req.session && req.session.loggedIn) return next();
    return res.status(401).json({ error: "Not authenticated" });
}

// ---------- Auth ----------
app.post("/api/login", (req, res) => {
    const { password } = req.body || {};
    if (password && password === ADMIN_PASSWORD) {
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

// ---------- Public read API ----------
app.get("/api/months", (req, res) => {
    res.json(db.readAll());
});

app.get("/api/months/:month", (req, res) => {
    const data = db.getMonth(req.params.month);
    if (!data) return res.status(404).json({ error: "Month not found" });
    res.json(data);
});

// ---------- Admin write API (all require login) ----------
app.put("/api/months/:month", requireAuth, (req, res) => {
    const monthData = req.body;
    if (!monthData || !Array.isArray(monthData.campaigns)) {
          return res.status(400).json({ error: "Body must be { campaigns: [...] }" });
    }
    res.json(db.setMonth(req.params.month, monthData));
});

app.delete("/api/months/:month", requireAuth, (req, res) => {
    db.deleteMonth(req.params.month);
    res.json({ ok: true });
});

app.post("/api/months/:month/campaigns", requireAuth, (req, res) => {
    const campaign = req.body;
    if (!campaign || !campaign.name) return res.status(400).json({ error: "Campaign needs at least a name" });
    const normalized = normalizeCampaign(campaign);
    res.json(db.addCampaign(req.params.month, normalized));
});

app.put("/api/months/:month/campaigns/:index", requireAuth, (req, res) => {
    const index = parseInt(req.params.index, 10);
    const campaign = normalizeCampaign(req.body);
    const result = db.updateCampaign(req.params.month, index, campaign);
    if (!result) return res.status(404).json({ error: "Campaign not found" });
    res.json(result);
});

app.delete("/api/months/:month/campaigns/:index", requireAuth, (req, res) => {
    const index = parseInt(req.params.index, 10);
    const result = db.deleteCampaign(req.params.month, index);
    if (!result) return res.status(404).json({ error: "Campaign not found" });
    res.json(result);
});

function normalizeCampaign(c) {
    return {
          date: String(c.date || ""),
          name: String(c.name || ""),
          status: String(c.status || "sent"),
          opens: Number(c.opens) || 0,
          clicks: Number(c.clicks) || 0,
          unsubscribes: Number(c.unsubscribes) || 0,
          revenue: Number(c.revenue) || 0,
    };
}

// ---------- Static frontend ----------
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/admin", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.listen(PORT, () => {
    console.log(`KARIKAALA Mailchimp dashboard running on port ${PORT}`);
    if (ADMIN_PASSWORD === "changeme") {
          console.warn("WARNING: using default admin password — set ADMIN_PASSWORD env var before going live.");
    }
});
