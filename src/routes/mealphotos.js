const express = require('express');
const router = express.Router();
const MealPhoto = require('../models/MealPhoto');
const { uploadMeal } = require('../cloudinary');

router.get('/', async (req, res) => {
  try {
    const photos = await MealPhoto.find();
    res.json(photos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/upload', uploadMeal.single('photo'), async (req, res) => {
  const { mealId, mealName, hotelId } = req.body;
  try {
    const query = { mealId: parseInt(mealId), hotelId: hotelId ? hotelId : null };
    let photo = await MealPhoto.findOne(query);
    if (photo) {
      photo.url = req.file.path;
      photo.date = new Date().toISOString().split('T')[0];
    } else {
      photo = new MealPhoto({
        mealId: parseInt(mealId),
        mealName,
        hotelId: hotelId ? hotelId : null,
        url: req.file.path,
        date: new Date().toISOString().split('T')[0]
      });
    }
    await photo.save();
    res.json(photo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/meal/:mealId', async (req, res) => {
  const mealId = parseInt(req.params.mealId);
  const hotelId = req.query.hotelId ? req.query.hotelId : null;
  try {
    let photo = null;
    if (hotelId) {
      photo = await MealPhoto.findOne({ mealId, hotelId });
    }
    if (!photo) {
      photo = await MealPhoto.findOne({ mealId, hotelId: null });
    }
    res.json(photo || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;