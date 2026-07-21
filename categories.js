const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/categories — list all homepage category cards
router.get('/', (req, res) => {
  res.json(db.getCategories());
});

module.exports = router;
