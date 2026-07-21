require('dotenv').config();
const express = require('express');
const cors = require('cors');

const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const categoryRoutes = require('./routes/categories');

const app = express();
app.use(cors());
app.use(express.json({ limit: '8mb' })); // raised so product image uploads (base64) fit

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Lord Walker backend running on port ${PORT}`));
