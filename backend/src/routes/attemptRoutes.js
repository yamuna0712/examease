const express = require('express');
const router = express.Router();
const {
  startAttempt,
  saveAnswer,
  submitAttempt,
  getAttemptResult,
  getMyAttempts,
  getExamAttemptsForTeacher,
} = require('../controllers/attemptController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { checkDbConnection } = require('../middleware/dbCheck');

router.use(checkDbConnection);
router.use(authenticate);

// Student attempt routes
router.post('/start', requireRole('student', 'teacher', 'admin'), startAttempt);
router.post('/:id/answer', requireRole('student', 'teacher', 'admin'), saveAnswer);
router.post('/:id/submit', requireRole('student', 'teacher', 'admin'), submitAttempt);
router.get('/my', requireRole('student', 'teacher', 'admin'), getMyAttempts);
router.get('/:id', getAttemptResult);

// Teacher / Admin route to inspect exam submissions
router.get(
  '/exam/:examId',
  requireRole('teacher', 'admin'),
  getExamAttemptsForTeacher
);

module.exports = router;
