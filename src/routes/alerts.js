const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const alertsPath = path.join(__dirname, '../data/alerts.json');
const hotelsPath = path.join(__dirname, '../data/hotels.json');

function generateAlerts() {
  const hotels = JSON.parse(fs.readFileSync(hotelsPath));
  const alerts = [];

  hotels.forEach(hotel => {
    if (hotel.ratings.length === 0) return;

    const recent = hotel.ratings.filter(r => {
      const rDate = new Date(r.date);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return rDate >= weekAgo;
    });

    if (recent.length === 0) return;

    const avgScore = recent.reduce((sum, r) => sum + r.score, 0) / recent.length;
    const allAvg = hotel.ratings.reduce((sum, r) => sum + r.score, 0) / hotel.ratings.length;

    if (avgScore >= 8 && recent.length >= 2) {
      alerts.push({
        type: 'rising',
        icon: '🔥',
        hotel: hotel.name,
        hotelId: hotel.id,
        message: hotel.name + ' is rising! ' + recent.length + ' recent ratings averaging ' + avgScore.toFixed(1) + '/10.',
        date: new Date().toISOString().split('T')[0]
      });
    }

    if (avgScore <= 4 && recent.length >= 2) {
      alerts.push({
        type: 'warning',
        icon: '⚠️',
        hotel: hotel.name,
        hotelId: hotel.id,
        message: 'Warning: ' + hotel.name + ' has low recent scores (' + avgScore.toFixed(1) + '/10). Check before visiting.',
        date: new Date().toISOString().split('T')[0]
      });
    }

    if (avgScore >= 7 && recent.length >= 3) {
      alerts.push({
        type: 'trending',
        icon: '📈',
        hotel: hotel.name,
        hotelId: hotel.id,
        message: hotel.name + ' is trending with ' + recent.length + ' ratings this week!',
        date: new Date().toISOString().split('T')[0]
      });
    }
  });

  return alerts;
}

router.get('/', (req, res) => {
  const alerts = generateAlerts();
  res.json(alerts);
});

router.get('/hygiene', (req, res) => {
  const alerts = generateAlerts().filter(a => a.type === 'warning');
  res.json(alerts);
});

router.get('/rising', (req, res) => {
  const alerts = generateAlerts().filter(a => a.type === 'rising');
  res.json(alerts);
});

module.exports = router;