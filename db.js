const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "data", "marketing.json");
const SEED_FILE = path.join(__dirname, "data", "seed.json");

const CHANNELS = {
  mailchimp: "campaigns",
  meta: "ads",
};

function ensureDataFile() {
  if (!fs.existsSync(DATA_FILE)) {
    const seed = fs.existsSync(SEED_FILE)
      ? fs.readFileSync(SEED_FILE, "utf8")
      : JSON.stringify({ mailchimp: {}, meta: {} }, null, 2);
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, seed);
  }
}

function readAll() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, "utf8");
  const data = JSON.parse(raw || "{}");
  if (!data.mailchimp) data.mailchimp = {};
  if (!data.meta) data.meta = {};
  if (!data.guests) data.guests = {};
  return data;
}

function writeAll(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function itemKey(channel) {
  return CHANNELS[channel];
}

function getMonths(channel) {
  const data = readAll();
  return data[channel] || {};
}

function getMonth(channel, month) {
  const data = readAll();
  return (data[channel] && data[channel][month]) || null;
}

function setMonth(channel, month, monthData) {
  const data = readAll();
  if (!data[channel]) data[channel] = {};
  data[channel][month] = monthData;
  writeAll(data);
  return data[channel][month];
}

function deleteMonth(channel, month) {
  const data = readAll();
  if (data[channel]) delete data[channel][month];
  writeAll(data);
}

function addItem(channel, month, item) {
  const data = readAll();
  const key = itemKey(channel);
  if (!data[channel]) data[channel] = {};
  if (!data[channel][month]) data[channel][month] = { [key]: [] };
  if (!data[channel][month][key]) data[channel][month][key] = [];
  data[channel][month][key].push(item);
  writeAll(data);
  return item;
}

function updateItem(channel, month, index, item) {
  const data = readAll();
  const key = itemKey(channel);
  if (!data[channel] || !data[channel][month] || !data[channel][month][key]) return null;
  data[channel][month][key][index] = item;
  writeAll(data);
  return item;
}

function deleteItem(channel, month, index) {
  const data = readAll();
  const key = itemKey(channel);
  if (!data[channel] || !data[channel][month] || !data[channel][month][key]) return;
  data[channel][month][key].splice(index, 1);
  writeAll(data);
}

function setInvoice(channel, month, amount) {
  const data = readAll();
  const key = itemKey(channel);
  if (!data[channel]) data[channel] = {};
  if (!data[channel][month]) data[channel][month] = { [key]: [] };
  data[channel][month].invoice = Number(amount) || 0;
  writeAll(data);
  return data[channel][month];
}

function getGuests() {
  const data = readAll();
  return data.guests || {};
}

function setGuests(month, count) {
  const data = readAll();
  if (!data.guests) data.guests = {};
  data.guests[month] = Number(count) || 0;
  writeAll(data);
  return data.guests[month];
}

module.exports = {
  CHANNELS,
  ensureDataFile,
  readAll,
  getMonths,
  getMonth,
  setMonth,
  deleteMonth,
  addItem,
  updateItem,
  deleteItem,
  setInvoice,
  getGuests,
  setGuests,
};
