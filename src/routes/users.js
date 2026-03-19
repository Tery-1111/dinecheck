const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const usersPath = path.join(__dirname, '../data/users.json');

function validateEgertonReg(reg) {
  return /^(EN|BN|EL|EM|ES|ET)\d{3}\/\d{4,6}\/\d{4}$/i.test(reg);
}

function validateEgertonEmail(email) {
  return email.endsWith('@student.egerton.ac.ke');
}

function getRank(reviews) {
  if (reviews >= 30) return 'Comrade Chef';
  if (reviews >= 10) return 'Knife Elite';
  if (reviews >= 3) return 'Fork Regular';
  return 'Spoon Rookie';
}

function getRankBadge(rank) {
  const badges = {
    'Spoon Rookie': '🥄',
    'Fork Regular': '🍴',
    'Knife Elite': '🔪',
    'Comrade Chef': '👨‍🍳'
  };
  return badges[rank] || '🥄';
}

router.post('/register', (req, res) => {
  const { regNumber, email, fullName, faculty, year, username } = req.body;

  if (!validateEgertonReg(regNumber)) {
    return res.status(400).json({ error: 'Invalid Egerton registration number format.' });
  }

  if (!validateEgertonEmail(email)) {
    return res.status(400).json({ error: 'Must use a valid @student.egerton.ac.ke email.' });
  }

  const users = JSON.parse(fs.readFileSync(usersPath));

  if (users.find(u => u.regNumber === regNumber)) {
    return res.status(400).json({ error: 'Registration number already registered.' });
  }

  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'Username already taken.' });
  }

  const newUser = {
    id: users.length + 1,
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
  };

  users.push(newUser);
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

  res.json({
    message: `Welcome, ${username}! You are now a Spoon Rookie 🥄. Your 7-day Premium trial is active.`,
    user: newUser
  });
});

router.post('/:username/review', (req, res) => {
  const users = JSON.parse(fs.readFileSync(usersPath));
  const user = users.find(u => u.username === req.params.username);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  user.reviews += 1;
  const newRank = getRank(user.reviews);
  const rankChanged = newRank !== user.rank;
  user.rank = newRank;
  user.rankBadge = getRankBadge(newRank);

  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

  res.json({
    reviews: user.reviews,
    rank: user.rank,
    rankBadge: user.rankBadge,
    rankChanged,
    message: rankChanged ? `🎉 Rank up! You are now a ${user.rankBadge} ${user.rank}!` : null
  });
});

router.get('/', (req, res) => {
  const users = JSON.parse(fs.readFileSync(usersPath));
  const safe = users
    .map(u => ({
      id: u.id, username: u.username, rank: u.rank, rankBadge: u.rankBadge,
      faculty: u.faculty, year: u.year, reviews: u.reviews,
      premium: u.premium, joinDate: u.joinDate
    }))
    .sort((a, b) => b.reviews - a.reviews);
  res.json(safe);
});

router.post('/suspend', (req, res) => {
  const { username, reason } = req.body;
  const users = JSON.parse(fs.readFileSync(usersPath));
  const user = users.find(u => u.username === username);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  user.suspended = true;
  user.suspendReason = reason || 'Violation of community guidelines';
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
  res.json({ message: user.username + ' has been suspended.' });
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