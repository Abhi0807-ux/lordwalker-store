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

// PUT /api/admin/products/:id — update stock, price, status, and/or image
// body: { stock?, price?, status?, image? }
router.put('/products/:id', requireAdmin, (req, res) => {
  try {
    const { stock, price, status, image } = req.body;
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
    if (image !== undefined) {
      updates.image = image; // base64 data URL, or '' to clear it
    }
    const updated = db.updateProduct(req.params.id, updates);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/admin/products — create a new product
// body: { id, name, price, stock, status?, image? }
router.post('/products', requireAdmin, (req, res) => {
  try {
    const { id, name, price, stock, status, image } = req.body;
    if (!id || !String(id).trim()) throw new Error('Product code is required');
    if (!name || !String(name).trim()) throw new Error('Product name is required');
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum <= 0) throw new Error('Price must be a positive number');
    const stockNum = Number(stock);
    if (!Number.isFinite(stockNum) || stockNum < 0) throw new Error('Stock must be a non-negative number');

    const product = {
      id: String(id).trim(),
      name: String(name).trim(),
      price: priceNum,
      stock: stockNum,
      status: status === 'inactive' ? 'inactive' : 'active',
    };
    if (image) product.image = image;

    const created = db.addProduct(product);
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/admin/products/:id — remove a product entirely
router.delete('/products/:id', requireAdmin, (req, res) => {
  try {
    const removed = db.deleteProduct(req.params.id);
    res.json({ success: true, removed });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ---------- Category management (homepage "Shop by Purpose" cards) ----------

// GET /api/admin/categories — list all categories
router.get('/categories', requireAdmin, (req, res) => {
  res.json(db.getCategories());
});

// POST /api/admin/categories — create a new category card
// body: { id, title, link, glyph?, image? }
router.post('/categories', requireAdmin, (req, res) => {
  try {
    const { id, title, link, glyph, image } = req.body;
    if (!id || !String(id).trim()) throw new Error('Category ID (slug) is required');
    if (!title || !String(title).trim()) throw new Error('Title is required');
    if (!link || !String(link).trim()) throw new Error('Link is required (e.g. #shop)');

    const category = {
      id: String(id).trim(),
      title: String(title).trim(),
      link: String(link).trim(),
      glyph: glyph ? String(glyph).trim() : '🧦',
    };
    if (image) category.image = image;

    const created = db.addCategory(category);
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/admin/categories/:id — update a category card
// body: { title?, link?, glyph?, image? }
router.put('/categories/:id', requireAdmin, (req, res) => {
  try {
    const { title, link, glyph, image } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = String(title).trim();
    if (link !== undefined) updates.link = String(link).trim();
    if (glyph !== undefined) updates.glyph = String(glyph).trim();
    if (image !== undefined) updates.image = image; // '' clears it
    const updated = db.updateCategory(req.params.id, updates);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/admin/categories/:id — remove a category card
router.delete('/categories/:id', requireAdmin, (req, res) => {
  try {
    const removed = db.deleteCategory(req.params.id);
    res.json({ success: true, removed });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
