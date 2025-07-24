const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const crypto = require('crypto');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // 👈 serve HTML

const MERCHANT_ID = '6i964974';
const PAYMENT_KEY = 'df7b68bcdc634d92a6541736fceab799';
const API_BASE = 'https://apis.xdpay168.com/client';

function generateSignature(params, key) {
  const filtered = Object.entries(params)
    .filter(([k, v]) => k !== 'sign' && v !== '' && v !== null && v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  const stringToSign = `${filtered}&key=${key}`;
  return crypto.createHash('md5').update(stringToSign).digest('hex').toLowerCase();
}

app.post('/collection', async (req, res) => {
  const data = {
    merchant: MERCHANT_ID,
    payCode: '38101',
    ...req.body
  };
  data.sign = generateSignature(data, PAYMENT_KEY);
  try {
    const response = await axios.post(`${API_BASE}/collect/create`, data);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create collection order', detail: err.message });
  }
});

app.post('/payment', async (req, res) => {
  const data = {
    merchant: MERCHANT_ID,
    payCode: '101',
    ...req.body
  };
  data.sign = generateSignature(data, PAYMENT_KEY);
  try {
    const response = await axios.post(`${API_BASE}/pay/create`, data);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create payment order', detail: err.message });
  }
});

app.post('/query', async (req, res) => {
  const data = {
    merchant: MERCHANT_ID,
    orderId: req.body.orderId
  };
  data.sign = generateSignature(data, PAYMENT_KEY);
  try {
    const response = await axios.post(`${API_BASE}/order/query`, data);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to query order', detail: err.message });
  }
});

app.post('/balance', async (req, res) => {
  const data = { merchant: MERCHANT_ID };
  data.sign = generateSignature(data, PAYMENT_KEY);
  try {
    const response = await axios.post(`${API_BASE}/order/balance`, data);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to check balance', detail: err.message });
  }
});

app.post('/callback', (req, res) => {
  const data = req.body;
  const validSign = generateSignature(data, PAYMENT_KEY);
  if (data.sign === validSign) {
    console.log('✅ Valid callback received:', data);
    res.send('success');
  } else {
    console.warn('❌ Invalid callback signature');
    res.status(400).send('invalid signature');
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Payment API running at http://localhost:${PORT}`);
});
