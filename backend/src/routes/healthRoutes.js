const express = require('express');
const router = express.Router();
const { isDbConnected } = require('../config/db');

router.get('/', (req, res) => {
  const dbStatus = isDbConnected();
  return res.status(200).json({
    status: 'online',
    appName: 'ExamEase API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: {
      connected: dbStatus,
      status: dbStatus ? 'connected' : 'disconnected',
      message: dbStatus
        ? 'MongoDB is connected and operational.'
        : 'MongoDB is disconnected. Please check your database server.',
    },
  });
});

module.exports = router;
