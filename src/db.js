const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://obochwilliamsl_db_user:Dinecheck2026@cluster0.w6ju3gn.mongodb.net/dinecheck?appName=Cluster0';

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

module.exports = mongoose;