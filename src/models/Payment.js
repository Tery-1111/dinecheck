const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  username: { type: String, required: true },
  transactionCode: { type: String, required: true, unique: true },
  amount: { type: Number, default: 10 },
  status: { type: String, default: 'pending' },
  submittedDate: String,
  confirmedDate: String
});

module.exports = mongoose.model('Payment', paymentSchema);