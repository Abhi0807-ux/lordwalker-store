const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const router = express.Router();
const db = require('../db');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/orders/create
// body: { items: [{ id, qty }], customer: { name, phone, email, address } }
// Server recalculates the price itself from the DB — never trust prices sent from the browser.
router.post('/create', async (req, res) => {
  try {
    const { items, customer } = req.body;
    if (!items || !items.length) return res.status(400).json({ error: 'Cart is empty' });

    let amount = 0;
    const lineItems = [];
    for (const item of items) {
      const product = db.getProduct(item.id);
      if (!product) return res.status(400).json({ error: `Unknown product: ${item.id}` });
      if (product.stock < item.qty) {
        return res.status(400).json({ error: `Not enough stock for ${product.name}` });
      }
      amount += product.price * item.qty;
      lineItems.push({ id: product.id, name: product.name, price: product.price, qty: item.qty });
    }

    const localOrderId = 'LW-' + Date.now();
    const razorpayOrder = await razorpay.orders.create({
      amount: amount * 100, // paise
      currency: 'INR',
      receipt: localOrderId,
    });

    db.createOrder({
      id: localOrderId,
      razorpay_order_id: razorpayOrder.id,
      items: lineItems,
      amount,
      customer,
      status: 'created',
      created_at: new Date().toISOString(),
    });

    res.json({
      orderId: localOrderId,
      razorpayOrderId: razorpayOrder.id,
      amount,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create order' });
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

    res.json({ success: true, orderId });
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
