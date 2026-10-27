const express = require('express');
const router = express.Router();
const {
  createExam,
  updateExam,
  deleteExam,
  getTeacherExams,
  getExamById,
  getAvailableExamsForStudent,
  getExamForStudentTaking,
} = require('../controllers/examController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { checkDbConnection } = require('../middleware/dbCheck');

router.use(checkDbConnection);
router.use(authenticate);

// Student accessible routes
router.get('/available', requireRole('student', 'teacher', 'admin'), getAvailableExamsForStudent);
router.get('/:id/take', requireRole('student', 'teacher', 'admin'), getExamForStudentTaking);

// Teacher / Admin management routes
router.get('/my-exams', requireRole('teacher', 'admin'), getTeacherExams);
router.get('/:id', requireRole('teacher', 'admin'), getExamById);
router.post('/', requireRole('teacher', 'admin'), createExam);
router.put('/:id', requireRole('teacher', 'admin'), updateExam);
router.delete('/:id', requireRole('teacher', 'admin'), deleteExam);

module.exports = router;
