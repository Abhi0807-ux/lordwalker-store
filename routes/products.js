const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/products — list all active products
router.get('/', (req, res) => {
  const products = db.getProducts().filter(p => p.status === 'active');
  res.json(products);
});

// GET /api/products/:id — single product
router.get('/:id', (req, res) => {
  const product = db.getProduct(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

module.exports = router;
