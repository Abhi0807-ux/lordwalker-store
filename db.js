// Lightweight JSON-file database.
// Good for getting live quickly; swap for Postgres/MySQL once order volume grows
// (the function signatures below are written so that swap only touches this file).

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

function ensureData() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
  if (!fs.existsSync(PRODUCTS_FILE)) {
    const seed = require('./products.seed.json');
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(seed, null, 2));
  }
  if (!fs.existsSync(ORDERS_FILE)) {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2));
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
  }
};

module.exports = db;
