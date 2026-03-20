const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  meal: String,
  score: Number,
  comment: String,
  username: String,
  mood: String,
  aroma: String,
  specs: Object,
  date: String
});

const photoSchema = new mongoose.Schema({
  filename: String,
  url: String,
  uploadedBy: String,
  date: String
});

const speedSchema = new mongoose.Schema({
  waitSeconds: Number,
  date: String
});

const quickvoteSchema = new mongoose.Schema({
  vote: String,
  username: String,
  date: String
});

const hotelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  meals: { type: String, required: true },
  ratings: [ratingSchema],
  photos: [photoSchema],
  speeds: [speedSchema],
  quickvotes: [quickvoteSchema],
  verified: { type: Boolean, default: false },
  verifiedBy: String,
  verifiedDate: String
});

module.exports = mongoose.model('Hotel', hotelSchema);