const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  username: String,
  text: String,
  date: String
});

const reactionSchema = new mongoose.Schema({
  postKey: { type: String, required: true, unique: true },
  up: { type: Number, default: 0 },
  down: { type: Number, default: 0 },
  comments: [commentSchema]
});

module.exports = mongoose.model('Reaction', reactionSchema);