const express = require('express');
const router = express.Router();
const Hotel = require('../models/Hotel');

function generateAlerts(hotels) {
  const alerts = [];
  hotels.forEach(hotel => {
    if (!hotel.ratings.length) return;
    const recent = hotel.ratings.filter(r => {
      const rDate = new Date(r.date);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return rDate >= weekAgo;
    });
    if (!recent.length) return;
    const avgScore = recent.reduce((sum, r) => sum + r.score, 0) / recent.length;
    const id = hotel._id.toString();
    if (avgScore >= 8 && recent.length >= 2) {
      alerts.push({ type: 'rising', icon: '🔥', hotel: hotel.name, hotelId: id, message: hotel.name + ' is rising! ' + recent.length + ' recent ratings averaging ' + avgScore.toFixed(1) + '/10.', date: new Date().toISOString().split('T')[0] });
    }
    if (avgScore <= 4 && recent.length >= 2) {
      alerts.push({ type: 'warning', icon: '⚠️', hotel: hotel.name, hotelId: id, message: 'Warning: ' + hotel.name + ' has low recent scores (' + avgScore.toFixed(1) + '/10). Check before visiting.', date: new Date().toISOString().split('T')[0] });
    }
    if (avgScore >= 7 && recent.length >= 3) {
      alerts.push({ type: 'trending', icon: '📈', hotel: hotel.name, hotelId: id, message: hotel.name + ' is trending with ' + recent.length + ' ratings this week!', date: new Date().toISOString().split('T')[0] });
    }
  });
  return alerts;
}

router.get('/', async (req, res) => {
  try {
    const hotels = await Hotel.find();
    res.json(generateAlerts(hotels));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/hygiene', async (req, res) => {
  try {
    const hotels = await Hotel.find();
    res.json(generateAlerts(hotels).filter(a => a.type === 'warning'));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/rising', async (req, res) => {
  try {
    const hotels = await Hotel.find();
    res.json(generateAlerts(hotels).filter(a => a.type === 'rising'));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;