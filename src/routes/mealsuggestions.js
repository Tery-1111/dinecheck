const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const suggestionsPath = path.join(__dirname, '../data/mealsuggestions.json');

function load() {
  return JSON.parse(fs.readFileSync(suggestionsPath));
}

function save(data) {
  fs.writeFileSync(suggestionsPath, JSON.stringify(data, null, 2));
}

router.get('/', (req, res) => {
  res.json(load());
});

router.post('/suggest', (req, res) => {
  const { mealName, description, username } = req.body;
  if (!mealName) return res.status(400).json({ error: 'Meal name is required.' });
  const suggestions = load();
  const existing = suggestions.find(s => s.mealName.toLowerCase() === mealName.toLowerCase());
  if (existing) return res.status(400).json({ error: 'This meal has already been suggested.' });
  suggestions.push({
    id: Date.now(),
    mealName: mealName.trim(),
    description: description || '',
    username: username || 'anonymous',
    date: new Date().toISOString().split('T')[0],
    status: 'pending',
    votes: 1
  });
  save(suggestions);
  res.json({ message: '✅ Meal suggestion submitted! The admin will review it.' });
});

router.post('/vote', (req, res) => {
  const { id } = req.body;
  const suggestions = load();
  const s = suggestions.find(s => s.id === parseInt(id));
  if (!s) return res.status(404).json({ error: 'Suggestion not found.' });
  s.votes = (s.votes || 1) + 1;
  save(suggestions);
  res.json({ message: 'Vote recorded', votes: s.votes });
});

router.post('/approve', (req, res) => {
  const { id } = req.body;
  const suggestions = load();
  const s = suggestions.find(s => s.id === parseInt(id));
  if (!s) return res.status(404).json({ error: 'Suggestion not found.' });
  s.status = 'approved';
  save(suggestions);

  // Add to meals.json
  const mealsPath = path.join(__dirname, '../data/meals.json');
  const meals = JSON.parse(fs.readFileSync(mealsPath));
  const exists = meals.find(m => m.name.toLowerCase() === s.mealName.toLowerCase());
  if (!exists) {
    const newId = Math.max(...meals.map(m => m.id)) + 1;
    meals.push({ id: newId, name: s.mealName });
    fs.writeFileSync(mealsPath, JSON.stringify(meals, null, 2));
  }
  res.json({ message: '✅ Meal approved and added to the database.' });
});

router.post('/reject', (req, res) => {
  const { id } = req.body;
  const suggestions = load();
  const idx = suggestions.findIndex(s => s.id === parseInt(id));
  if (idx === -1) return res.status(404).json({ error: 'Suggestion not found.' });
  suggestions[idx].status = 'rejected';
  save(suggestions);
  res.json({ message: 'Suggestion rejected.' });
});

module.exports = router;