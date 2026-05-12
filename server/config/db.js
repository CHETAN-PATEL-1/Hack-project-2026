const mongoose = require('mongoose');
const colors = require('colors');

const DEFAULT_URI = 'mongodb://127.0.0.1:27017/farm2consumer';

const connectDB = async () => {
  const uri = process.env.MONGO_URI || DEFAULT_URI;
  if (!process.env.MONGO_URI) {
    console.warn('MONGO_URI not set — using local default:', DEFAULT_URI);
  }

  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
