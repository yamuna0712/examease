const { isDbConnected } = require('../config/db');

const checkDbConnection = (req, res, next) => {
  if (!isDbConnected()) {
    return res.status(503).json({
      success: false,
      code: 'DB_UNAVAILABLE',
      error:
        'MongoDB is not connected. The database is currently unavailable.',
      details: {
        message:
          'Please ensure MongoDB is running locally or verify the MONGODB_URI connection string in backend/.env.',
        instructions: [
          'Windows Service: Open CMD as Administrator and run: net start MongoDB',
          'Manual binary: Run: mongod --dbpath "C:\\data\\db"',
          'Cloud database: Provide a MongoDB Atlas connection string in backend/.env',
        ],
      },
    });
  }
  next();
};

module.exports = {
  checkDbConnection,
};
