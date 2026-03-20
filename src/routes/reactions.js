const express = require('express');
const router = express.Router();
const Reaction = require('../models/Reaction');

router.get('/', async (req, res) => {
  try {
    const reactions = await Reaction.find();
    const result = {};
    reactions.forEach(r => { result[r.postKey] = { up: r.up, down: r.down, comments: r.comments }; });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:postKey/react', async (req, res) => {
  const { type } = req.body;
  const key = req.params.postKey;
  try {
    let reaction = await Reaction.findOne({ postKey: key });
    if (!reaction) reaction = new Reaction({ postKey: key, up: 0, down: 0, comments: [] });
    if (type === 'up') reaction.up++;
    else if (type === 'down') reaction.down++;
    await reaction.save();
    res.json({ up: reaction.up, down: reaction.down, comments: reaction.comments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:postKey/comment', async (req, res) => {
  const { username, text } = req.body;
  const key = req.params.postKey;
  if (!username || !text) return res.status(400).json({ error: 'Username and text required.' });
  try {
    let reaction = await Reaction.findOne({ postKey: key });
    if (!reaction) reaction = new Reaction({ postKey: key, up: 0, down: 0, comments: [] });
    reaction.comments.push({ username: username.replace('@', ''), text, date: new Date().toISOString().split('T')[0] });
    await reaction.save();
    res.json({ up: reaction.up, down: reaction.down, comments: reaction.comments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;