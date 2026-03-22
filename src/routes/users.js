const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const User = require('../models/User');

function validateEgertonReg(reg) {
  return /^[A-Z]{1,4}\d{0,3}\/\d{4,6}\/\d{2,4}$/i.test(reg);
}

function validateEgertonEmail(email) {
  const lower = email.toLowerCase();
  return lower.endsWith('@student.egerton.ac.ke') || lower.endsWith('@egerton.ac.ke');
}

router.post('/register', async (req, res) => {
  const { regNumber, fullName, faculty, year, username } = req.body;
  const email = req.body.email.toLowerCase();

  if (!validateEgertonReg(regNumber)) {
    return res.status(400).json({ error: 'Invalid Egerton registration number. Use format like EN100/12345/2022 or S17/02920/24' });
  }

  if (!validateEgertonEmail(email)) {
    return res.status(400).json({ error: 'Must use a valid Egerton email e.g. william.0292024@student.egerton.ac.ke' });
  }

  try {
    const existing = await User.findOne({ $or: [{ regNumber }, { username }] });
    if (existing) {
      if (existing.regNumber === regNumber) return res.status(400).json({ error: 'Registration number already registered.' });
      if (existing.username === username) return res.status(400).json({ error: 'Username already taken.' });
    }

    const newUser = new User({
      regNumber,
      email,
      fullName,
      faculty,
      year,
      username,
      rank: 'Spoon Rookie',
      rankBadge: '🥄',
      premium: true,
      trialExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      joinDate: new Date().toISOString().split('T')[0],
      reviews: 0
    });

    await newUser.save();
    res.json({
      message: `Welcome, ${username}! You are now a Spoon Rookie 🥄. Your 7-day Premium trial is active.`,
      user: newUser
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const users = await User.find().sort({ reviews: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/suspend', async (req, res) => {
  const { username, reason } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    user.suspended = true;
    user.suspendReason = reason || 'Violation of community guidelines';
    await user.save();
    res.json({ message: user.username + ' has been suspended.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/password', (req, res) => {
  const adminPath = path.join(__dirname, '../data/admin.json');
  if (fs.existsSync(adminPath)) {
    const admin = JSON.parse(fs.readFileSync(adminPath));
    res.json({ password: admin.password });
  } else {
    res.json({ password: 'dinecheck2026' });
  }
});

router.post('/admin/changepassword', (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const adminPath = path.join(__dirname, '../data/admin.json');
  let admin = { password: 'dinecheck2026' };
  if (fs.existsSync(adminPath)) {
    admin = JSON.parse(fs.readFileSync(adminPath));
  }
  if (currentPassword !== admin.password) {
    return res.status(401).json({ error: 'Current password is incorrect.' });
  }
  admin.password = newPassword;
  fs.writeFileSync(adminPath, JSON.stringify(admin, null, 2));
  res.json({ message: 'Password changed successfully.' });
});

module.exports = router;