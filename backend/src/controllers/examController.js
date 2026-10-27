const Exam = require('../models/Exam');
const ExamAttempt = require('../models/ExamAttempt');

// Create a new exam (Teacher only)
const createExam = async (req, res) => {
  try {
    const {
      title,
      description,
      durationMinutes,
      passPercentage,
      startTime,
      endTime,
      isPublished,
      allowMultipleAttempts,
      showResultsImmediately,
      questions,
    } = req.body;

    if (!title || !durationMinutes) {
      return res.status(400).json({
        success: false,
        error: 'Title and duration in minutes are required.',
      });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'An exam must contain at least one question.',
      });
    }

    // Validate each question
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText || !q.questionText.trim()) {
        return res.status(400).json({
          success: false,
          error: `Question ${i + 1} must have question text.`,
        });
      }
      if (!Array.isArray(q.options) || q.options.length < 2) {
        return res.status(400).json({
          success: false,
          error: `Question ${i + 1} must have at least 2 options.`,
        });
      }
      if (
        typeof q.correctOptionIndex !== 'number' ||
        q.correctOptionIndex < 0 ||
        q.correctOptionIndex >= q.options.length
      ) {
        return res.status(400).json({
          success: false,
          error: `Question ${i + 1} has an invalid correct option index.`,
        });
      }
    }

    const exam = await Exam.create({
      title: title.trim(),
      description: (description || '').trim(),
      teacherId: req.user._id,
      durationMinutes: Number(durationMinutes),
      passPercentage: Number(passPercentage) || 40,
      startTime: startTime ? new Date(startTime) : null,
      endTime: endTime ? new Date(endTime) : null,
      isPublished: Boolean(isPublished),
      allowMultipleAttempts: Boolean(allowMultipleAttempts),
      showResultsImmediately: showResultsImmediately !== undefined ? Boolean(showResultsImmediately) : true,
      questions,
    });

    return res.status(201).json({
      success: true,
      message: 'Exam created successfully.',
      exam,
    });
  } catch (error) {
    console.error('[Create Exam Error]:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create exam.',
    });
  }
};

// Update exam (Owner teacher or admin only)
const updateExam = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findById(id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        error: 'Exam not found.',
      });
    }

    // Security check: only creator teacher or admin can modify
    if (
      req.user.role !== 'admin' &&
      exam.teacherId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You do not have permission to modify this exam.',
      });
    }

    const {
      title,
      description,
      durationMinutes,
      passPercentage,
      startTime,
      endTime,
      isPublished,
      allowMultipleAttempts,
      showResultsImmediately,
      questions,
    } = req.body;

    if (title) exam.title = title.trim();
    if (description !== undefined) exam.description = description.trim();
    if (durationMinutes) exam.durationMinutes = Number(durationMinutes);
    if (passPercentage !== undefined) exam.passPercentage = Number(passPercentage);
    if (startTime !== undefined) exam.startTime = startTime ? new Date(startTime) : null;
    if (endTime !== undefined) exam.endTime = endTime ? new Date(endTime) : null;
    if (isPublished !== undefined) exam.isPublished = Boolean(isPublished);
    if (allowMultipleAttempts !== undefined)
      exam.allowMultipleAttempts = Boolean(allowMultipleAttempts);
    if (showResultsImmediately !== undefined)
      exam.showResultsImmediately = Boolean(showResultsImmediately);

    if (Array.isArray(questions)) {
      if (questions.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'An exam must contain at least one question.',
        });
      }
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.questionText || !q.questionText.trim()) {
          return res.status(400).json({
            success: false,
            error: `Question ${i + 1} must have question text.`,
          });
        }
        if (!Array.isArray(q.options) || q.options.length < 2) {
          return res.status(400).json({
            success: false,
            error: `Question ${i + 1} must have at least 2 options.`,
          });
        }
        if (
          typeof q.correctOptionIndex !== 'number' ||
          q.correctOptionIndex < 0 ||
          q.correctOptionIndex >= q.options.length
        ) {
          return res.status(400).json({
            success: false,
            error: `Question ${i + 1} has an invalid correct option index.`,
          });
        }
      }
      exam.questions = questions;
    }

    await exam.save();

    return res.status(200).json({
      success: true,
      message: 'Exam updated successfully.',
      exam,
    });
  } catch (error) {
    console.error('[Update Exam Error]:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update exam.',
    });
  }
};

// Delete exam
const deleteExam = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findById(id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        error: 'Exam not found.',
      });
    }

    if (
      req.user.role !== 'admin' &&
      exam.teacherId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You do not have permission to delete this exam.',
      });
    }

    await Exam.findByIdAndDelete(id);
    // Also cleanup attempts
    await ExamAttempt.deleteMany({ examId: id });

    return res.status(200).json({
      success: true,
      message: 'Exam and associated attempts deleted successfully.',
    });
  } catch (error) {
    console.error('[Delete Exam Error]:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete exam.',
    });
  }
};

// Get exams created by the logged-in teacher
const getTeacherExams = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { teacherId: req.user._id };
    const exams = await Exam.find(filter)
      .populate('teacherId', 'name email')
      .sort({ createdAt: -1 });

    // Include attempt counts for each exam
    const examIds = exams.map((e) => e._id);
    const attemptCounts = await ExamAttempt.aggregate([
      { $match: { examId: { $in: examIds } } },
      { $group: { _id: '$examId', count: { $sum: 1 }, avgScore: { $avg: '$percentage' } } },
    ]);

    const countMap = {};
    attemptCounts.forEach((a) => {
      countMap[a._id.toString()] = {
        attemptCount: a.count,
        averagePercentage: Math.round((a.avgScore || 0) * 10) / 10,
      };
    });

    const examsWithStats = exams.map((exam) => {
      const stats = countMap[exam._id.toString()] || {
        attemptCount: 0,
        averagePercentage: 0,
      };
      return {
        ...exam.toJSON(),
        stats,
      };
    });

    return res.status(200).json({
      success: true,
      count: examsWithStats.length,
      exams: examsWithStats,
    });
  } catch (error) {
    console.error('[Get Teacher Exams Error]:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch exams.',
    });
  }
};

// Get single exam details (Full details with answers for Teacher/Admin)
const getExamById = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findById(id).populate('teacherId', 'name email');

    if (!exam) {
      return res.status(404).json({
        success: false,
        error: 'Exam not found.',
      });
    }

    if (
      req.user.role !== 'admin' &&
      exam.teacherId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You do not have permission to view answer keys.',
      });
    }

    return res.status(200).json({
      success: true,
      exam,
    });
  } catch (error) {
    console.error('[Get Exam By Id Error]:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve exam.',
    });
  }
};

// Student: List published available exams
const getAvailableExamsForStudent = async (req, res) => {
  try {
    const now = new Date();

    const exams = await Exam.find({
      isPublished: true,
      $or: [{ startTime: null }, { startTime: { $lte: now } }],
      $or: [{ endTime: null }, { endTime: { $gte: now } }],
    })
      .select('-questions.correctOptionIndex -questions.explanation')
      .populate('teacherId', 'name')
      .sort({ createdAt: -1 });

    // Fetch existing attempts of the student
    const studentAttempts = await ExamAttempt.find({
      studentId: req.user._id,
    }).select('examId status percentage isPassed submitTime');

    const attemptMap = {};
    studentAttempts.forEach((att) => {
      if (!attemptMap[att.examId.toString()]) {
        attemptMap[att.examId.toString()] = [];
      }
      attemptMap[att.examId.toString()].push(att);
    });

    const examsWithAttemptStatus = exams.map((exam) => {
      const attempts = attemptMap[exam._id.toString()] || [];
      const hasActiveAttempt = attempts.some((a) => a.status === 'in-progress');
      const completedAttempts = attempts.filter((a) => a.status !== 'in-progress');
      const canTake =
        exam.allowMultipleAttempts ||
        (attempts.length === 0) ||
        hasActiveAttempt;

      return {
        _id: exam._id,
        title: exam.title,
        description: exam.description,
        teacher: exam.teacherId ? exam.teacherId.name : 'Unknown Teacher',
        durationMinutes: exam.durationMinutes,
        totalMarks: exam.totalMarks,
        questionCount: exam.questions.length,
        passPercentage: exam.passPercentage,
        startTime: exam.startTime,
        endTime: exam.endTime,
        allowMultipleAttempts: exam.allowMultipleAttempts,
        showResultsImmediately: exam.showResultsImmediately,
        attemptsCount: attempts.length,
        hasActiveAttempt,
        canTake,
        latestAttempt: completedAttempts[completedAttempts.length - 1] || null,
      };
    });

    return res.status(200).json({
      success: true,
      count: examsWithAttemptStatus.length,
      exams: examsWithAttemptStatus,
    });
  } catch (error) {
    console.error('[Get Student Exams Error]:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch available exams.',
    });
  }
};

// Student: Get sanitized exam info & questions for taking an exam
// SECURITY: Strips correctOptionIndex and explanation!
const getExamForStudentTaking = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findById(id).populate('teacherId', 'name');

    if (!exam) {
      return res.status(404).json({
        success: false,
        error: 'Exam not found.',
      });
    }

    if (!exam.isPublished && req.user.role === 'student') {
      return res.status(403).json({
        success: false,
        error: 'This exam is not currently published.',
      });
    }

    // Check time constraints
    const now = new Date();
    if (exam.startTime && now < exam.startTime) {
      return res.status(403).json({
        success: false,
        error: `This exam has not started yet. It begins on ${exam.startTime.toLocaleString()}.`,
      });
    }
    if (exam.endTime && now > exam.endTime) {
      return res.status(403).json({
        success: false,
        error: `This exam has concluded on ${exam.endTime.toLocaleString()}.`,
      });
    }

    // Sanitize questions: NEVER send correct answers to student!
    const sanitizedQuestions = exam.questions.map((q, idx) => ({
      index: idx,
      id: q._id,
      questionText: q.questionText,
      options: q.options,
      marks: q.marks,
    }));

    return res.status(200).json({
      success: true,
      exam: {
        _id: exam._id,
        title: exam.title,
        description: exam.description,
        teacher: exam.teacherId ? exam.teacherId.name : 'Instructor',
        durationMinutes: exam.durationMinutes,
        totalMarks: exam.totalMarks,
        passPercentage: exam.passPercentage,
        questionCount: sanitizedQuestions.length,
        questions: sanitizedQuestions,
        allowMultipleAttempts: exam.allowMultipleAttempts,
        showResultsImmediately: exam.showResultsImmediately,
        endTime: exam.endTime,
      },
    });
  } catch (error) {
    console.error('[Get Exam For Student Error]:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve exam details.',
    });
  }
};

module.exports = {
  createExam,
  updateExam,
  deleteExam,
  getTeacherExams,
  getExamById,
  getAvailableExamsForStudent,
  getExamForStudentTaking,
};
