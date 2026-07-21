// Lightweight JSON-file database.
// Good for getting live quickly; swap for Postgres/MySQL once order volume grows
// (the function signatures below are written so that swap only touches this file).

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');

const DEFAULT_CATEGORIES = [
  { id: 'office-corporate', title: 'Office & Corporate', link: '#shop', glyph: '💼' },
  { id: 'everyday', title: 'Everyday', link: '#shop', glyph: '🚶' },
  { id: 'sports-active', title: 'Sports & Active', link: '#shop', glyph: '🏃' },
  { id: 'wellness', title: 'Wellness', link: '#shop', glyph: '🌿' },
  { id: 'gifting', title: 'Gifting', link: '#gifting', glyph: '🎁' },
];

function ensureData() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
  if (!fs.existsSync(PRODUCTS_FILE)) {
    const seed = require('./products.seed.json');
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(seed, null, 2));
  }
  if (!fs.existsSync(ORDERS_FILE)) {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(CATEGORIES_FILE)) {
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(DEFAULT_CATEGORIES, null, 2));
  }
}
ensureData();

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

const db = {
  getProducts() {
    return readJSON(PRODUCTS_FILE);
  },
  getProduct(id) {
    return this.getProducts().find(p => p.id === id);
  },
  reduceStock(id, qty) {
    const products = this.getProducts();
    const p = products.find(x => x.id === id);
    if (!p) throw new Error('Product not found: ' + id);
    if (p.stock < qty) throw new Error('Insufficient stock for ' + id);
    p.stock -= qty;
    writeJSON(PRODUCTS_FILE, products);
  },
  updateProduct(id, updates) {
    const products = this.getProducts();
    const idx = products.findIndex(x => x.id === id);
    if (idx === -1) throw new Error('Product not found: ' + id);
    products[idx] = { ...products[idx], ...updates };
    writeJSON(PRODUCTS_FILE, products);
    return products[idx];
  },
  addProduct(product) {
    const products = this.getProducts();
    if (products.some(p => p.id === product.id)) {
      throw new Error('A product with this code already exists: ' + product.id);
    }
    products.push(product);
    writeJSON(PRODUCTS_FILE, products);
    return product;
  },
  deleteProduct(id) {
    const products = this.getProducts();
    const idx = products.findIndex(x => x.id === id);
    if (idx === -1) throw new Error('Product not found: ' + id);
    const [removed] = products.splice(idx, 1);
    writeJSON(PRODUCTS_FILE, products);
    return removed;
  },
  createOrder(order) {
    const orders = readJSON(ORDERS_FILE);
    orders.push(order);
    writeJSON(ORDERS_FILE, orders);
    return order;
  },
  updateOrder(orderId, updates) {
    const orders = readJSON(ORDERS_FILE);
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx === -1) throw new Error('Order not found: ' + orderId);
    orders[idx] = { ...orders[idx], ...updates };
    writeJSON(ORDERS_FILE, orders);
    return orders[idx];
  },
  getOrder(orderId) {
    return readJSON(ORDERS_FILE).find(o => o.id === orderId);
  },
  getAllOrders() {
    return readJSON(ORDERS_FILE);
  },
  getCategories() {
    return readJSON(CATEGORIES_FILE);
  },
  addCategory(category) {
    const categories = this.getCategories();
    if (categories.some(c => c.id === category.id)) {
      throw new Error('A category with this ID already exists: ' + category.id);
    }
    categories.push(category);
    writeJSON(CATEGORIES_FILE, categories);
    return category;
  },
  updateCategory(id, updates) {
    const categories = this.getCategories();
    const idx = categories.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Category not found: ' + id);
    categories[idx] = { ...categories[idx], ...updates };
    writeJSON(CATEGORIES_FILE, categories);
    return categories[idx];
  },
  deleteCategory(id) {
    const categories = this.getCategories();
    const idx = categories.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Category not found: ' + id);
    const [removed] = categories.splice(idx, 1);
    writeJSON(CATEGORIES_FILE, categories);
    return removed;
  }
};

module.exports = db;
