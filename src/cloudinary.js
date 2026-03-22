const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dtuu54hha',
  api_key: process.env.CLOUDINARY_API_KEY || '992868223984857',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'iWMphr6pNUpP-JDPdhgEMoEaLSU'
});

const hotelStorage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'dinecheck/hotels', allowed_formats: ['jpg','jpeg','png','webp'] }
});

const mealStorage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'dinecheck/meals', allowed_formats: ['jpg','jpeg','png','webp'] }
});

const uploadHotel = multer({ storage: hotelStorage });
const uploadMeal = multer({ storage: mealStorage });

module.exports = { cloudinary, uploadHotel, uploadMeal };