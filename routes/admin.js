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

// PUT /api/admin/products/:id — update stock, price, status, image(s), category, wearer, etc.
// body: { stock?, price?, originalPrice?, status?, image?, images?, category?, wearer?, description?, careInstructions? }
router.put('/products/:id', requireAdmin, (req, res) => {
  try {
    const { stock, price, originalPrice, status, image, images, category, wearer, description, careInstructions } = req.body;
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
    if (originalPrice !== undefined) {
      if (originalPrice === null || originalPrice === '') {
        updates.originalPrice = null; // clears the "was" price / strikethrough
      } else {
        const n = Number(originalPrice);
        if (!Number.isFinite(n) || n <= 0) throw new Error('Original price must be a positive number');
        updates.originalPrice = n;
      }
    }
    if (status !== undefined) {
      if (!['active', 'inactive'].includes(status)) throw new Error('Status must be active or inactive');
      updates.status = status;
    }
    if (category !== undefined) updates.category = String(category).trim();
    if (wearer !== undefined) updates.wearer = String(wearer).trim();
    if (description !== undefined) updates.description = String(description);
    if (careInstructions !== undefined) updates.careInstructions = String(careInstructions);
    if (image !== undefined) {
      updates.image = image; // base64 data URL, or '' to clear it (legacy single-image field)
    }
    if (images !== undefined) {
      if (!Array.isArray(images)) throw new Error('images must be an array of data URLs');
      updates.images = images; // full gallery — replaces the stored array
      updates.image = images[0] || ''; // keep legacy single-image field in sync for older consumers
    }
    const updated = db.updateProduct(req.params.id, updates);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/admin/products — create a new product
// body: { id, name, price, originalPrice?, stock, status?, image?, images?, category?, wearer?, description?, careInstructions? }
router.post('/products', requireAdmin, (req, res) => {
  try {
    const { id, name, price, originalPrice, stock, status, image, images, category, wearer, description, careInstructions } = req.body;
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
      category: category ? String(category).trim() : '',
      wearer: wearer ? String(wearer).trim() : 'unisex',
      description: description ? String(description) : '',
      careInstructions: careInstructions ? String(careInstructions) : '',
    };
    if (originalPrice !== undefined && originalPrice !== null && originalPrice !== '') {
      const opNum = Number(originalPrice);
      if (Number.isFinite(opNum) && opNum > 0) product.originalPrice = opNum;
    }
    if (Array.isArray(images) && images.length) {
      product.images = images;
      product.image = images[0];
    } else if (image) {
      product.image = image;
    }

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

// GET /api/admin/backup — download everything (products, categories, orders) as one JSON file.
// This is a manual safety net while running on free hosting with no persistent disk —
// download this periodically so a server restart/redeploy never means losing real data.
router.get('/backup', requireAdmin, (req, res) => {
  try {
    const backup = {
      exportedAt: new Date().toISOString(),
      products: db.getProducts(),
      categories: db.getCategories(),
      orders: db.getAllOrders(),
    };
    const filename = `lordwalker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(backup, null, 2));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
