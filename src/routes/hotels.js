const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const hotelsPath = path.join(__dirname, '../data/hotels.json');

router.get('/', (req, res) => {
  const hotels = JSON.parse(fs.readFileSync(hotelsPath));
  res.json(hotels);
});

router.get('/search', (req, res) => {
  const query = req.query.meal.toLowerCase();
  const hotels = JSON.parse(fs.readFileSync(hotelsPath));
  const results = hotels.filter(h => h.meals.toLowerCase().includes(query));
  res.json(results);
});

router.post('/', (req, res) => {
  const hotels = JSON.parse(fs.readFileSync(hotelsPath));
  const newHotel = {
    id: hotels.length + 1,
    name: req.body.name,
    location: req.body.location,
    meals: req.body.meals,
    ratings: [],
    photos: [],
    speeds: [],
    quickvotes: []
  };
  hotels.push(newHotel);
  fs.writeFileSync(hotelsPath, JSON.stringify(hotels, null, 2));
  res.json(newHotel);
});

router.post('/:id/rate', (req, res) => {
  const hotels = JSON.parse(fs.readFileSync(hotelsPath));
  const hotel = hotels.find(h => h.id === parseInt(req.params.id));
  if (!hotel) return res.status(404).json({ error: 'Hotel not found' });
  const rating = {
    meal: req.body.meal,
    score: req.body.score,
    comment: req.body.comment,
    username: req.body.username || null,
    mood: req.body.mood || null,
    aroma: req.body.aroma || null,
    specs: req.body.specs || {},
    date: new Date().toISOString().split('T')[0]
  };
  hotel.ratings.push(rating);
  fs.writeFileSync(hotelsPath, JSON.stringify(hotels, null, 2));

  if (req.body.username) {
    const usersPath = path.join(__dirname, '../data/users.json');
    const users = JSON.parse(fs.readFileSync(usersPath));
    const user = users.find(u => u.username === req.body.username);
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
      fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
      return res.json({ rating, rank: user.rank, rankBadge: user.rankBadge, reviews: user.reviews });
    }
  }
  res.json({ rating });
});

router.post('/:id/photo', upload.single('photo'), (req, res) => {
  const hotels = JSON.parse(fs.readFileSync(hotelsPath));
  const hotel = hotels.find(h => h.id === parseInt(req.params.id));
  if (!hotel) return res.status(404).json({ error: 'Hotel not found' });
  if (!hotel.photos) hotel.photos = [];
  const photo = {
    filename: req.file.filename,
    url: '/uploads/' + req.file.filename,
    uploadedBy: req.body.username || 'anonymous',
    date: new Date().toISOString().split('T')[0]
  };
  hotel.photos.push(photo);
  fs.writeFileSync(hotelsPath, JSON.stringify(hotels, null, 2));
  res.json(photo);
});

router.post('/:id/speed', (req, res) => {
  const hotels = JSON.parse(fs.readFileSync(hotelsPath));
  const hotel = hotels.find(h => h.id === parseInt(req.params.id));
  if (!hotel) return res.status(404).json({ error: 'Hotel not found' });
  if (!hotel.speeds) hotel.speeds = [];
  hotel.speeds.push({ waitSeconds: req.body.waitSeconds, date: req.body.date });
  fs.writeFileSync(hotelsPath, JSON.stringify(hotels, null, 2));
  res.json({ message: 'Speed saved' });
});

router.post('/:id/quickvote', (req, res) => {
  const hotels = JSON.parse(fs.readFileSync(hotelsPath));
  const hotel = hotels.find(h => h.id === parseInt(req.params.id));
  if (!hotel) return res.status(404).json({ error: 'Hotel not found' });
  if (!hotel.quickvotes) hotel.quickvotes = [];
  hotel.quickvotes.push({
    vote: req.body.vote,
    username: req.body.username || 'anonymous',
    date: new Date().toISOString().split('T')[0]
  });
  fs.writeFileSync(hotelsPath, JSON.stringify(hotels, null, 2));

  const fullAvg = hotel.ratings.length > 0
    ? hotel.ratings.reduce((s, r) => s + r.score, 0) / hotel.ratings.length
    : null;
  const upvotes = hotel.quickvotes.filter(v => v.vote === 'up').length;
  const downvotes = hotel.quickvotes.filter(v => v.vote === 'down').length;
  const quickScore = hotel.quickvotes.length > 0
    ? (upvotes / hotel.quickvotes.length) * 10
    : null;

  let combinedScore = null;
  if (fullAvg !== null && quickScore !== null) {
    const fullWeight = hotel.ratings.length;
    const quickWeight = hotel.quickvotes.length * 0.5;
    combinedScore = ((fullAvg * fullWeight) + (quickScore * quickWeight)) / (fullWeight + quickWeight);
  } else if (fullAvg !== null) {
    combinedScore = fullAvg;
  } else if (quickScore !== null) {
    combinedScore = quickScore;
  }

  res.json({
    message: 'Vote recorded',
    combinedScore: combinedScore ? combinedScore.toFixed(1) : null,
    upvotes,
    downvotes,
    total: hotel.quickvotes.length
  });
});

router.post('/:id/delete', (req, res) => {
  let hotels = JSON.parse(fs.readFileSync(hotelsPath));
  hotels = hotels.filter(h => h.id !== parseInt(req.params.id));
  fs.writeFileSync(hotelsPath, JSON.stringify(hotels, null, 2));
  res.json({ message: 'Hotel deleted.' });
});

router.delete('/:id/rating/:index', (req, res) => {
  const hotels = JSON.parse(fs.readFileSync(hotelsPath));
  const hotel = hotels.find(h => h.id === parseInt(req.params.id));
  if (!hotel) return res.status(404).json({ error: 'Hotel not found.' });
  hotel.ratings.splice(parseInt(req.params.index), 1);
  fs.writeFileSync(hotelsPath, JSON.stringify(hotels, null, 2));
  res.json({ message: 'Rating removed.' });
});
module.exports = router;