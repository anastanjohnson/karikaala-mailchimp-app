// Simple JSON-file "database". No native compiled dependencies, so it runs
// on any Node host without a build step. For heavier concurrent write loads,
// swap this module out for a real database (e.g. Render Postgres) — every
// other file talks to storage only through the functions exported here, so
// that swap doesn't touch server.js or the frontend.
const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "data", "campaigns.json");
const SEED_FILE = path.join(__dirname, "data", "seed.json");

function ensureDataFile() {
    if (!fs.existsSync(DATA_FILE)) {
          const seed = fs.readFileSync(SEED_FILE, "utf-8");
          fs.writeFileSync(DATA_FILE, seed);
    }
}

function readAll() {
    ensureDataFile();
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw);
}

function writeAll(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function getMonths() {
    const data = readAll();
    return Object.keys(data).sort();
}

function getMonth(month) {
    const data = readAll();
    return data[month] || null;
}

function setMonth(month, monthData) {
    const data = readAll();
    data[month] = monthData;
    writeAll(data);
    return data[month];
}

function deleteMonth(month) {
    const data = readAll();
    delete data[month];
    writeAll(data);
}

function addCampaign(month, campaign) {
    const data = readAll();
    if (!data[month]) data[month] = { campaigns: [] };
    data[month].campaigns.push(campaign);
    writeAll(data);
    return data[month];
}

function updateCampaign(month, index, campaign) {
    const data = readAll();
    if (!data[month] || !data[month].campaigns[index]) return null;
    data[month].campaigns[index] = campaign;
    writeAll(data);
    return data[month];
}

function deleteCampaign(month, index) {
    const data = readAll();
    if (!data[month] || !data[month].campaigns[index]) return null;
    data[month].campaigns.splice(index, 1);
    writeAll(data);
    return data[month];
}

module.exports = {
    readAll, writeAll, getMonths, getMonth, setMonth, deleteMonth,
    addCampaign, updateCampaign, deleteCampaign,
};
