const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const router = express.Router();
const db = require('../db');
const pricing = require('../pricing');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Shared helper: turn [{id,qty}] into resolved {product, qty} lines,
// validating existence + stock. Throws on any problem.
function resolveLines(items) {
  if (!items || !items.length) throw new Error('Cart is empty');
  return items.map((item) => {
    const product = db.getProduct(item.id);
    if (!product) throw new Error(`Unknown product: ${item.id}`);
    if (product.stock < item.qty) throw new Error(`Not enough stock for ${product.name}`);
    return { product, qty: item.qty };
  });
}

// POST /api/orders/quote
// body: { items: [{ id, qty }] }
// Read-only price preview for the frontend cart drawer — same pricing.js
// logic used at checkout, so the number shown never drifts from what's charged.
router.post('/quote', (req, res) => {
  try {
    const lines = resolveLines(req.body.items || []);
    const q = pricing.quote(lines);
    res.json(q);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/orders/create
// body: { items: [{ id, qty }], customer: { name, phone, email, address } }
// Server recalculates the price itself from the DB — never trust prices sent from the browser.
router.post('/create', async (req, res) => {
  try {
    const { items, customer } = req.body;
    const lines = resolveLines(items);
    const { subtotal, bundleDiscount, shipping, total, freeUnits } = pricing.quote(lines);

    const lineItems = lines.map((l) => ({
      id: l.product.id, name: l.product.name, price: l.product.price, qty: l.qty,
    }));

    const localOrderId = 'LW-' + Date.now();
    const razorpayOrder = await razorpay.orders.create({
      amount: total * 100, // paise
      currency: 'INR',
      receipt: localOrderId,
    });

    db.createOrder({
      id: localOrderId,
      razorpay_order_id: razorpayOrder.id,
      items: lineItems,
      subtotal,
      bundleDiscount,
      freeUnits,
      shipping,
      amount: total,
      customer,
      status: 'created',
      created_at: new Date().toISOString(),
    });

    res.json({
      orderId: localOrderId,
      razorpayOrderId: razorpayOrder.id,
      subtotal,
      bundleDiscount,
      shipping,
      amount: total,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || 'Could not create order' });
  }
});

// POST /api/orders/verify
// body: { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature }
router.post('/verify', (req, res) => {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      db.updateOrder(orderId, { status: 'payment_failed' });
      return res.status(400).json({ error: 'Signature mismatch — payment not verified' });
    }

    const order = db.getOrder(orderId);
    for (const item of order.items) {
      db.reduceStock(item.id, item.qty);
    }

    db.updateOrder(orderId, {
      status: 'paid',
      razorpay_payment_id,
      paid_at: new Date().toISOString(),
    });

    res.json({ success: true, orderId, amount: order.amount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// GET /api/orders/:id — check order status
router.get('/:id', (req, res) => {
  const order = db.getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

module.exports = router;
