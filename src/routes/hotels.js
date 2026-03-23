const express = require('express');
const router = express.Router();
const Hotel = require('../models/Hotel');
const User = require('../models/User');
const { uploadHotel } = require('../cloudinary');
const { normalizeMeal } = require('../mealNormalizer');

router.get('/', async (req, res) => {
  try {
    const hotels = await Hotel.find();
    res.json(hotels);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/search', async (req, res) => {
  try {
    const raw = req.query.meal;
    const normalized = normalizeMeal(raw);
    const hotels = await Hotel.find();
    const results = hotels.filter(h => {
      const meals = h.meals.toLowerCase();
      return meals.includes(normalized.toLowerCase()) || meals.includes(raw.toLowerCase());
    });
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', uploadHotel.fields([
  { name: 'exterior', maxCount: 1 },
  { name: 'interior', maxCount: 1 },
  { name: 'other', maxCount: 1 },
  { name: 'menu', maxCount: 1 }
]), async (req, res) => {
  try {
    const photos = [];
    const labels = { exterior: 'Exterior', interior: 'Interior', other: 'Other', menu: 'Menu' };
    for (const [field, label] of Object.entries(labels)) {
      if (req.files && req.files[field]) {
        photos.push({
          filename: req.files[field][0].filename || '',
          url: req.files[field][0].path,
          label,
          uploadedBy: 'admin',
          date: new Date().toISOString().split('T')[0]
        });
      }
    }
    const hotel = new Hotel({
      name: req.body.name,
      location: req.body.location,
      meals: req.body.meals,
      ratings: [],
      photos,
      speeds: [],
      quickvotes: []
    });
    await hotel.save();
    res.json(hotel);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/rate', async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ error: 'Hotel not found' });
    const rating = {
      meal: normalizeMeal(req.body.meal),
      score: req.body.score,
      comment: req.body.comment,
      username: req.body.username || null,
      mood: req.body.mood || null,
      aroma: req.body.aroma || null,
      specs: req.body.specs || {},
      date: new Date().toISOString().split('T')[0]
    };
    hotel.ratings.push(rating);
    await hotel.save();

    if (req.body.username) {
      const user = await User.findOne({ username: req.body.username });
      if (user) {
        user.reviews += 1;
        const ranks = ['Spoon Rookie', 'Fork Regular', 'Knife Elite', 'Comrade Chef'];
        const thresholds = [0, 3, 10, 30];
        for (let i = thresholds.length - 1; i >= 0; i--) {
          if (user.reviews >= thresholds[i]) {
            user.rank = ranks[i];
            user.rankBadge = ['🥄', '🍴', '🔪', '👨‍🍳'][i];
            break;
          }
        }
        await user.save();
        return res.json({ rating, rank: user.rank, rankBadge: user.rankBadge, reviews: user.reviews });
      }
    }
    res.json({ rating });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/photo', uploadHotel.single('photo'), async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ error: 'Hotel not found' });
    const photo = {
      filename: req.file.filename || '',
      url: req.file.path,
      label: req.body.label || 'Other',
      uploadedBy: req.body.username || 'anonymous',
      date: new Date().toISOString().split('T')[0]
    };
    hotel.photos.push(photo);
    await hotel.save();
    res.json(photo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/speed', async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ error: 'Hotel not found' });
    hotel.speeds.push({ waitSeconds: req.body.waitSeconds, date: req.body.date });
    await hotel.save();
    res.json({ message: 'Speed saved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/quickvote', async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ error: 'Hotel not found' });
    hotel.quickvotes.push({
      vote: req.body.vote,
      username: req.body.username || 'anonymous',
      date: new Date().toISOString().split('T')[0]
    });
    await hotel.save();
    const upvotes = hotel.quickvotes.filter(v => v.vote === 'up').length;
    const downvotes = hotel.quickvotes.filter(v => v.vote === 'down').length;
    res.json({ message: 'Vote recorded', upvotes, downvotes, total: hotel.quickvotes.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/delete', async (req, res) => {
  try {
    await Hotel.findByIdAndDelete(req.params.id);
    res.json({ message: 'Hotel deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id/rating/:index', async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ error: 'Hotel not found.' });
    hotel.ratings.splice(parseInt(req.params.index), 1);
    await hotel.save();
    res.json({ message: 'Rating removed.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;