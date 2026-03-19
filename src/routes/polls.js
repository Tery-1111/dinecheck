const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const pollsPath = path.join(__dirname, '../data/polls.json');

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

router.get('/:hotelId', (req, res) => {
  const polls = JSON.parse(fs.readFileSync(pollsPath));
  const hotelPolls = polls.filter(p => p.hotelId === parseInt(req.params.hotelId));
  res.json(hotelPolls);
});

router.post('/vote', (req, res) => {
  const { hotelId, questionId, vote } = req.body;
  const polls = JSON.parse(fs.readFileSync(pollsPath));

  let poll = polls.find(p => p.hotelId === hotelId && p.questionId === questionId);

  if (!poll) {
    poll = { hotelId, questionId, yes: 0, no: 0 };
    polls.push(poll);
  }

  if (vote === 'yes') poll.yes++;
  else poll.no++;

  fs.writeFileSync(pollsPath, JSON.stringify(polls, null, 2));
  res.json(poll);
});

router.post('/adjust', (req, res) => {
  const { hotelId, questionId, yes, no } = req.body;
  const polls = JSON.parse(fs.readFileSync(pollsPath));
  let poll = polls.find(p => p.hotelId === hotelId && p.questionId === questionId);
  if (!poll) {
    poll = { hotelId, questionId, yes: 0, no: 0 };
    polls.push(poll);
  }
  poll.yes = yes;
  poll.no = no;
  fs.writeFileSync(pollsPath, JSON.stringify(polls, null, 2));
  res.json({ message: '✅ Poll adjusted successfully.' });
});
module.exports = router;