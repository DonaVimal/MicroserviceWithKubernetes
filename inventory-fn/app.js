const express = require('express');
const app = express();
const PORT = process.env.PORT || 3002;
const DELAY_MS = Number(process.env.DELAY_MS || 0);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

app.use(express.json({ limit: '50kb' }));

const crypto = require('crypto');
function getReqId(req) { return req.header('X-Request-Id') || crypto.randomUUID(); }
app.use((req, res, next) => {
  const rid = getReqId(req);
  req.requestId = rid;
  res.setHeader('X-Request-Id', rid);
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: "info", rid, method: req.method, path: req.path, service: "inventory-fn" }));
  next();
});

// Intentionally tiny and in-memory for teaching purposes
const inventory = {
  1: { inStock: true },
  2: { inStock: true },
  3: { inStock: false },
};

app.get('/health', (req, res) => res.json({ ok: true }));

app.get('/stock/:sku', async (req, res) => {
  if (DELAY_MS > 0) await sleep(DELAY_MS);

  const sku = Number(req.params.sku);
  if (!Number.isInteger(sku)) {
    return res.status(400).json({ error: 'sku must be an integer' });
  }
  const item = inventory[sku];
  if (!item) return res.status(404).json({ error: 'unknown sku' });
  return res.json({ sku, inStock: item.inStock });
});

app.listen(PORT, () => console.log(`inventory-fn on ${PORT}`));
