const mongoose = require('mongoose');

const mealPhotoSchema = new mongoose.Schema({
  mealId: { type: Number, required: true },
  mealName: String,
  hotelId: { type: mongoose.Schema.Types.Mixed, default: null },
  url: String,
  date: String
});

module.exports = mongoose.model('MealPhoto', mealPhotoSchema);