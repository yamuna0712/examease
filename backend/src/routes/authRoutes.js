const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  bootstrapAdmin,
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { checkDbConnection } = require('../middleware/dbCheck');

// All auth routes require DB connection
router.use(checkDbConnection);

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.post('/bootstrap-admin', bootstrapAdmin);

module.exports = router;
