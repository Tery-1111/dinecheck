const express = require('express');
const router = express.Router();
const Poll = require('../models/Poll');

const POLL_QUESTIONS = [
  { id: 1, question: '🧼 Good Hygiene?' },
  { id: 2, question: '💰 Value for Money?' },
  { id: 3, question: '🍽️ Generous Portions?' },
  { id: 4, question: '🥬 Fresh Ingredients?' },
  { id: 5, question: '😊 Friendly Staff?' }
];

router.get('/questions', (req, res) => {
  res.json(POLL_QUESTIONS);
});

router.get('/:hotelId', async (req, res) => {
  try {
    const polls = await Poll.find({ hotelId: req.params.hotelId });
    res.json(polls);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/vote', async (req, res) => {
  const { hotelId, questionId, vote } = req.body;
  try {
    let poll = await Poll.findOne({ hotelId, questionId });
    if (!poll) {
      poll = new Poll({ hotelId, questionId, yes: 0, no: 0 });
    }
    if (vote === 'yes') poll.yes++;
    else poll.no++;
    await poll.save();
    res.json(poll);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/adjust', async (req, res) => {
  const { hotelId, questionId, yes, no } = req.body;
  try {
    let poll = await Poll.findOne({ hotelId, questionId });
    if (!poll) {
      poll = new Poll({ hotelId, questionId });
    }
    poll.yes = yes;
    poll.no = no;
    await poll.save();
    res.json({ message: '✅ Poll adjusted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;