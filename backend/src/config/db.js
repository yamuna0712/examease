const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/examease';

  mongoose.connection.on('connected', () => {
    isConnected = true;
    console.log(`[ExamEase DB] Connected successfully to MongoDB at ${uri}`);
  });

  mongoose.connection.on('error', (err) => {
    isConnected = false;
    console.error(`[ExamEase DB] Connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.warn('[ExamEase DB] Disconnected from MongoDB.');
  });

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    return true;
  } catch (error) {
    isConnected = false;
    console.error('\n======================================================');
    console.error('⚠️  MONGODB CONNECTION FAILED');
    console.error(`Target URI: ${uri}`);
    console.error(`Error details: ${error.message}`);
    console.error('Please ensure MongoDB is running or configure MONGODB_URI in backend/.env');
    console.error('Quick fix on Windows:');
    console.error('  1. Run CMD as Administrator: net start MongoDB');
    console.error('  2. Or run mongod directly: mongod --dbpath "C:\\data\\db"');
    console.error('  3. Or use MongoDB Atlas cloud URI in .env');
    console.error('======================================================\n');
    return false;
  }
};

const isDbConnected = () => {
  return mongoose.connection.readyState === 1;
};

module.exports = {
  connectDB,
  isDbConnected,
  mongoose
};
