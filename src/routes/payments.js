const express = require('express');
const router = express.Router();
const axios = require('axios');
const Payment = require('../models/Payment');
const User = require('../models/User');

const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || '';
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || '';
const SHORTCODE = process.env.MPESA_SHORTCODE || '174379';
const PASSKEY = process.env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
const CALLBACK_URL = process.env.MPESA_CALLBACK_URL || 'https://dinecheck.onrender.com/api/payments/callback';

async function getAccessToken() {
  const auth = Buffer.from(CONSUMER_KEY + ':' + CONSUMER_SECRET).toString('base64');
  const response = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
    headers: { Authorization: 'Basic ' + auth }
  });
  return response.data.access_token;
}

function getTimestamp() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return now.getFullYear() + pad(now.getMonth()+1) + pad(now.getDate()) + pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds());
}

router.post('/stkpush', async (req, res) => {
  const { phone, username } = req.body;
  if (!phone || !username) return res.status(400).json({ error: 'Phone number and username are required.' });

  const user = await User.findOne({ username });
  if (!user) return res.status(404).json({ error: 'Comrade not found.' });

  const cleanPhone = phone.replace(/\D/g, '').replace(/^0/, '254').replace(/^254254/, '254');

  try {
    const token = await getAccessToken();
    const timestamp = getTimestamp();
    const password = Buffer.from(SHORTCODE + PASSKEY + timestamp).toString('base64');

    const response = await axios.post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      BusinessShortCode: SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerBuyGoodsOnline',
      Amount: 10,
      PartyA: cleanPhone,
      PartyB: SHORTCODE,
      PhoneNumber: cleanPhone,
      CallBackURL: CALLBACK_URL,
      AccountReference: 'DineCheck',
      TransactionDesc: 'DineCheck Premium KSh 10'
    }, {
      headers: { Authorization: 'Bearer ' + token }
    });

    const checkoutId = response.data.CheckoutRequestID;
    const payment = new Payment({
      username,
      transactionCode: checkoutId,
      amount: 10,
      status: 'pending',
      submittedDate: new Date().toISOString().split('T')[0]
    });
    await payment.save();

    res.json({ message: '✅ M-Pesa prompt sent to ' + cleanPhone + '. Enter your PIN to complete payment.', checkoutId });
  } catch (err) {
    console.error('STK Push error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to send M-Pesa prompt. Try again.' });
  }
});

router.post('/callback', async (req, res) => {
  try {
    const body = req.body.Body?.stkCallback;
    if (!body) return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });

    const resultCode = body.ResultCode;
    const checkoutId = body.CheckoutRequestID;

    if (resultCode === 0) {
      const payment = await Payment.findOne({ transactionCode: checkoutId });
      if (payment) {
        payment.status = 'confirmed';
        payment.confirmedDate = new Date().toISOString().split('T')[0];
        await payment.save();

        const user = await User.findOne({ username: payment.username });
        if (user) {
          user.premium = true;
          user.premiumExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          await user.save();
        }
      }
    }
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err) {
    console.error('Callback error:', err.message);
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
});

router.post('/submit', async (req, res) => {
  const { username, transactionCode } = req.body;
  if (!username || !transactionCode) return res.status(400).json({ error: 'Username and transaction code are required.' });
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'Comrade not found.' });
    const existing = await Payment.findOne({ transactionCode });
    if (existing) return res.status(400).json({ error: 'Transaction code already used.' });
    const payment = new Payment({
      username, transactionCode, amount: 10, status: 'pending',
      submittedDate: new Date().toISOString().split('T')[0]
    });
    await payment.save();
    res.json({ message: 'Payment submitted! The developer will confirm within 24hrs and your Premium will activate.', payment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/confirm', async (req, res) => {
  const { transactionCode } = req.body;
  try {
    const payment = await Payment.findOne({ transactionCode });
    if (!payment) return res.status(404).json({ error: 'Transaction code not found.' });
    payment.status = 'confirmed';
    payment.confirmedDate = new Date().toISOString().split('T')[0];
    await payment.save();
    const user = await User.findOne({ username: payment.username });
    if (user) {
      user.premium = true;
      user.premiumExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      await user.save();
      return res.json({ message: 'Payment confirmed. Premium activated for ' + payment.username + ' until ' + user.premiumExpiry });
    }
    res.json({ message: 'Payment confirmed.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/pending', async (req, res) => {
  try {
    const payments = await Payment.find({ status: 'pending' });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;