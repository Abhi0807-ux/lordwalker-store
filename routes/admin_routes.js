const express = require('express');
const router = express.Router();
const db = require('../db');

// Very lightweight password gate — fine for a solo-founder internal tool,
// not meant as enterprise-grade security. Set ADMIN_PASSWORD in your
// environment variables (Render → Environment tab).
function requireAdmin(req, res, next) {
  const provided = req.headers['x-admin-password'];
  if (!process.env.ADMIN_PASSWORD) {
    return res.status(500).json({ error: 'ADMIN_PASSWORD is not set on the server' });
  }
  if (provided !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Incorrect password' });
  }
  next();
}

// GET /api/admin/products — full product list (including inactive items)
router.get('/products', requireAdmin, (req, res) => {
  res.json(db.getProducts());
});

// PUT /api/admin/products/:id — update stock, price, and/or status
// body: { stock?, price?, status? }
router.put('/products/:id', requireAdmin, (req, res) => {
  try {
    const { stock, price, status } = req.body;
    const updates = {};
    if (stock !== undefined) {
      const n = Number(stock);
      if (!Number.isFinite(n) || n < 0) throw new Error('Stock must be a non-negative number');
      updates.stock = n;
    }
    if (price !== undefined) {
      const n = Number(price);
      if (!Number.isFinite(n) || n <= 0) throw new Error('Price must be a positive number');
      updates.price = n;
    }
    if (status !== undefined) {
      if (!['active', 'inactive'].includes(status)) throw new Error('Status must be active or inactive');
      updates.status = status;
    }
    const updated = db.updateProduct(req.params.id, updates);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
