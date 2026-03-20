const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const User = require('../models/User');

router.post('/submit', async (req, res) => {
  const { username, transactionCode } = req.body;
  if (!username || !transactionCode) {
    return res.status(400).json({ error: 'Username and transaction code are required.' });
  }
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'Comrade not found.' });

    const existing = await Payment.findOne({ transactionCode });
    if (existing) return res.status(400).json({ error: 'Transaction code already used.' });

    const payment = new Payment({
      username,
      transactionCode,
      amount: 10,
      status: 'pending',
      submittedDate: new Date().toISOString().split('T')[0]
    });
    await payment.save();
    res.json({
      message: 'Payment submitted! The developer will confirm within 24hrs and your Premium will activate.',
      payment
    });
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