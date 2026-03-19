const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const reactionsPath = path.join(__dirname, '../data/reactions.json');

function load() {
  return JSON.parse(fs.readFileSync(reactionsPath));
}

function save(data) {
  fs.writeFileSync(reactionsPath, JSON.stringify(data, null, 2));
}

router.get('/', (req, res) => {
  res.json(load());
});

router.post('/:postKey/react', (req, res) => {
  const { type } = req.body;
  const key = req.params.postKey;
  const data = load();
  if (!data[key]) data[key] = { up: 0, down: 0, comments: [] };
  if (type === 'up') data[key].up++;
  else if (type === 'down') data[key].down++;
  save(data);
  res.json(data[key]);
});

router.post('/:postKey/comment', (req, res) => {
  const { username, text } = req.body;
  const key = req.params.postKey;
  if (!username || !text) return res.status(400).json({ error: 'Username and text required.' });
  const data = load();
  if (!data[key]) data[key] = { up: 0, down: 0, comments: [] };
  data[key].comments.push({
    username: username.replace('@', ''),
    text,
    date: new Date().toISOString().split('T')[0]
  });
  save(data);
  res.json(data[key]);
});

module.exports = router;