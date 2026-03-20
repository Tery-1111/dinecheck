const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  regNumber: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  fullName: String,
  faculty: String,
  year: String,
  username: { type: String, required: true, unique: true },
  rank: { type: String, default: 'Spoon Rookie' },
  rankBadge: { type: String, default: '🥄' },
  premium: { type: Boolean, default: true },
  trialExpiry: String,
  joinDate: String,
  reviews: { type: Number, default: 0 },
  suspended: { type: Boolean, default: false },
  suspendReason: String,
  premiumExpiry: String
});

module.exports = mongoose.model('User', userSchema);