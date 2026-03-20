const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema({
  hotelId: { type: mongoose.Schema.Types.Mixed, required: true },
  questionId: { type: Number, required: true },
  yes: { type: Number, default: 0 },
  no: { type: Number, default: 0 }
});

module.exports = mongoose.model('Poll', pollSchema);