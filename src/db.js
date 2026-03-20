const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://obochwilliamsl_db_user:Dinecheck123@cluster0.w6ju3gn.mongodb.net/dinecheck?appName=Cluster0';

console.log('Attempting MongoDB connection...');
console.log('URI starts with:', MONGO_URI.substring(0, 30));

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB successfully'))
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('Full error:', JSON.stringify(err, null, 2));
  });

module.exports = mongoose;