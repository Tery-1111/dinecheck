const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const paymentsPath = path.join(__dirname, '../data/payments.json');
const usersPath = path.join(__dirname, '../data/users.json');

router.post('/submit', (req, res) => {
  const { username, transactionCode } = req.body;

  if (!username || !transactionCode) {
    return res.status(400).json({ error: 'Username and transaction code are required.' });
  }

  const users = JSON.parse(fs.readFileSync(usersPath));
  const user = users.find(u => u.username === username);

  if (!user) {
    return res.status(404).json({ error: 'Comrade not found.' });
  }

  const payments = JSON.parse(fs.readFileSync(paymentsPath));

  if (payments.find(p => p.transactionCode === transactionCode)) {
    return res.status(400).json({ error: 'Transaction code already used.' });
  }

  const payment = {
    id: payments.length + 1,
    username,
    transactionCode,
    amount: 10,
    status: 'pending',
    submittedDate: new Date().toISOString().split('T')[0]
  };

  payments.push(payment);
  fs.writeFileSync(paymentsPath, JSON.stringify(payments, null, 2));

  res.json({
    message: 'Payment submitted! The developer will confirm within 24hrs and your Premium will activate.',
    payment
  });
});

router.post('/confirm', (req, res) => {
  const { transactionCode } = req.body;

  const payments = JSON.parse(fs.readFileSync(paymentsPath));
  const payment = payments.find(p => p.transactionCode === transactionCode);

  if (!payment) {
    return res.status(404).json({ error: 'Transaction code not found.' });
  }

  payment.status = 'confirmed';
  payment.confirmedDate = new Date().toISOString().split('T')[0];

  const users = JSON.parse(fs.readFileSync(usersPath));
  const user = users.find(u => u.username === payment.username);

  if (user) {
    user.premium = true;
    user.premiumExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
  }

  fs.writeFileSync(paymentsPath, JSON.stringify(payments, null, 2));

  res.json({ message: 'Payment confirmed. Premium activated for ' + payment.username + ' until ' + user.premiumExpiry });
});

router.get('/pending', (req, res) => {
  const payments = JSON.parse(fs.readFileSync(paymentsPath));
  res.json(payments.filter(p => p.status === 'pending'));
});

module.exports = router;