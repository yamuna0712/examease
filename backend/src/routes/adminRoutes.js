
const express = require('express');
const router = express.Router();

const {
  getSystemStats,
  getUsers,
  createUser,
  toggleUserStatus,
  deleteUser,
  getAllExams,
  getAllResults,
} = require('../controllers/adminController');

const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { checkDbConnection } = require('../middleware/dbCheck');

router.use(checkDbConnection);
router.use(authenticate);
router.use(requireRole('admin'));

router.get('/stats', getSystemStats);

// User management
router.get('/users', getUsers);
router.post('/users', createUser);
router.patch('/users/:id/toggle-status', toggleUserStatus);
router.delete('/users/:id', deleteUser);

// Exam management
router.get('/exams', getAllExams);
router.get('/results', getAllResults);

module.exports = router;
