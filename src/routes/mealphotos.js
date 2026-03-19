const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/meals/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const mealPhotosPath = path.join(__dirname, '../data/mealphotos.json');

router.get('/', (req, res) => {
  const photos = JSON.parse(fs.readFileSync(mealPhotosPath));
  res.json(photos);
});

router.post('/upload', upload.single('photo'), (req, res) => {
  const photos = JSON.parse(fs.readFileSync(mealPhotosPath));
  const { mealId, mealName, hotelId } = req.body;

  const existing = photos.findIndex(p =>
    p.mealId === parseInt(mealId) &&
    (hotelId ? p.hotelId === parseInt(hotelId) : !p.hotelId)
  );

  const photo = {
    mealId: parseInt(mealId),
    mealName,
    hotelId: hotelId ? parseInt(hotelId) : null,
    url: '/uploads/meals/' + req.file.filename,
    date: new Date().toISOString().split('T')[0]
  };

  if (existing >= 0) {
    photos[existing] = photo;
  } else {
    photos.push(photo);
  }

  fs.writeFileSync(mealPhotosPath, JSON.stringify(photos, null, 2));
  res.json(photo);
});

router.get('/meal/:mealId', (req, res) => {
  const photos = JSON.parse(fs.readFileSync(mealPhotosPath));
  const mealId = parseInt(req.params.mealId);
  const hotelId = req.query.hotelId ? parseInt(req.query.hotelId) : null;

  let photo = null;
  if (hotelId) {
    photo = photos.find(p => p.mealId === mealId && p.hotelId === hotelId);
  }
  if (!photo) {
    photo = photos.find(p => p.mealId === mealId && !p.hotelId);
  }

  res.json(photo || null);
});

module.exports = router;