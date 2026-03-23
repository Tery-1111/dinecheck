const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

require('./db');

app.use(express.json());
app.use(express.static('public'));

const hotelRoutes = require('./routes/hotels');
const mealRoutes = require('./routes/meals');
const userRoutes = require('./routes/users');
const pollRoutes = require('./routes/polls');
const paymentRoutes = require('./routes/payments');
const alertRoutes = require('./routes/alerts');
const mealPhotoRoutes = require('./routes/mealphotos');
const reactionRoutes = require('./routes/reactions');
const mealSuggestionRoutes = require('./routes/mealsuggestions');

app.use('/api/hotels', hotelRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/users', userRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/mealphotos', mealPhotoRoutes);
app.use('/api/reactions', reactionRoutes);
app.use('/api/mealsuggestions', mealSuggestionRoutes);

app.listen(PORT, () => {
  console.log(`DineCheck server running on http://localhost:${PORT}`);
});