const Exam = require('../models/Exam');
const ExamAttempt = require('../models/ExamAttempt');

// Helper to calculate score and grade attempt
const gradeAttempt = (exam, userAnswers) => {
  let totalMarksObtained = 0;
  let maxPossibleMarks = 0;

  const gradedAnswers = exam.questions.map((question, index) => {
    const qMarks = question.marks || 1;
    maxPossibleMarks += qMarks;

    const answerRecord = userAnswers.find((a) => a.questionIndex === index);
    const selectedOptionIndex =
      answerRecord && typeof answerRecord.selectedOptionIndex === 'number'
        ? answerRecord.selectedOptionIndex
        : null;

    const isCorrect =
      selectedOptionIndex !== null &&
      selectedOptionIndex === question.correctOptionIndex;

    const marksObtained = isCorrect ? qMarks : 0;
    totalMarksObtained += marksObtained;

    return {
      questionIndex: index,
      selectedOptionIndex,
      isCorrect,
      marksObtained,
    };
  });

  const percentage =
    maxPossibleMarks > 0
      ? Math.round((totalMarksObtained / maxPossibleMarks) * 1000) / 10
      : 0;
  const isPassed = percentage >= (exam.passPercentage || 40);

  return {
    gradedAnswers,
    totalMarksObtained,
    maxPossibleMarks,
    percentage,
    isPassed,
  };
};

// Start an exam attempt (or resume existing active attempt)
const startAttempt = async (req, res) => {
  try {
    const { examId } = req.body;
    if (!examId) {
      return res.status(400).json({
        success: false,
        error: 'Exam ID is required.',
      });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        error: 'Exam not found.',
      });
    }

    if (!exam.isPublished) {
      return res.status(403).json({
        success: false,
        error: 'Cannot start attempt: This exam is not published.',
      });
    }

    const now = new Date();

    // Verify time window
    if (exam.startTime && now < exam.startTime) {
      return res.status(403).json({
        success: false,
        error: `This exam has not started yet. Starts at ${exam.startTime.toLocaleString()}.`,
      });
    }
    if (exam.endTime && now > exam.endTime) {
      return res.status(403).json({
        success: false,
        error: `This exam has concluded at ${exam.endTime.toLocaleString()}.`,
      });
    }

    // Check for an active in-progress attempt
    const activeAttempt = await ExamAttempt.findOne({
      examId: exam._id,
      studentId: req.user._id,
      status: 'in-progress',
    });

    if (activeAttempt) {
      // Check if deadline has already passed while away
      if (now > activeAttempt.deadline) {
        // Auto-grade and finalize expired attempt
        const grade = gradeAttempt(exam, activeAttempt.answers);
        activeAttempt.status = 'expired';
        activeAttempt.submittedAutomatically = true;
        activeAttempt.submitTime = activeAttempt.deadline;
        activeAttempt.answers = grade.gradedAnswers;
        activeAttempt.totalMarksObtained = grade.totalMarksObtained;
        activeAttempt.maxPossibleMarks = grade.maxPossibleMarks;
        activeAttempt.percentage = grade.percentage;
        activeAttempt.isPassed = grade.isPassed;
        await activeAttempt.save();

        return res.status(400).json({
          success: false,
          error: 'Your examination timer has already expired.',
          attempt: activeAttempt,
        });
      }

      // Resume active attempt
      const remainingSeconds = Math.max(
        0,
        Math.floor((activeAttempt.deadline.getTime() - now.getTime()) / 1000)
      );

      return res.status(200).json({
        success: true,
        message: 'Resuming in-progress exam attempt.',
        attempt: activeAttempt,
        remainingSeconds,
      });
    }

    // Check if multiple attempts are allowed
    const priorAttempts = await ExamAttempt.countDocuments({
      examId: exam._id,
      studentId: req.user._id,
      status: { $in: ['submitted', 'expired'] },
    });

    if (priorAttempts > 0 && !exam.allowMultipleAttempts) {
      return res.status(403).json({
        success: false,
        error: 'You have already completed this examination. Multiple attempts are not permitted.',
      });
    }

    // Calculate deadline = min(startTime + duration, exam.endTime)
    const durationMs = exam.durationMinutes * 60 * 1000;
    let deadline = new Date(now.getTime() + durationMs);
    if (exam.endTime && exam.endTime < deadline) {
      deadline = new Date(exam.endTime);
    }

    const initialAnswers = exam.questions.map((_, idx) => ({
      questionIndex: idx,
      selectedOptionIndex: null,
      isCorrect: false,
      marksObtained: 0,
    }));

    const attempt = await ExamAttempt.create({
      examId: exam._id,
      studentId: req.user._id,
      startTime: now,
      deadline,
      status: 'in-progress',
      answers: initialAnswers,
    });

    const remainingSeconds = Math.max(
      0,
      Math.floor((deadline.getTime() - now.getTime()) / 1000)
    );

    return res.status(201).json({
      success: true,
      message: 'Exam attempt started.',
      attempt,
      remainingSeconds,
    });
  } catch (error) {
    console.error('[Start Attempt Error]:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to start exam attempt.',
    });
  }
};

// Save / update answer for a question
const saveAnswer = async (req, res) => {
  try {
    const { id } = req.params;
    const { questionIndex, selectedOptionIndex } = req.body;

    const attempt = await ExamAttempt.findById(id);
    if (!attempt) {
      return res.status(404).json({
        success: false,
        error: 'Attempt not found.',
      });
    }

    if (attempt.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You do not own this attempt.',
      });
    }

    if (attempt.status !== 'in-progress') {
      return res.status(400).json({
        success: false,
        error: `Cannot update answer: Attempt is already ${attempt.status}.`,
      });
    }

    const now = new Date();
    // Allow small 5-second grace period for network latency
    if (now > new Date(attempt.deadline.getTime() + 5000)) {
      // Time expired - auto submit
      const exam = await Exam.findById(attempt.examId);
      const grade = gradeAttempt(exam, attempt.answers);
      attempt.status = 'expired';
      attempt.submittedAutomatically = true;
      attempt.submitTime = attempt.deadline;
      attempt.answers = grade.gradedAnswers;
      attempt.totalMarksObtained = grade.totalMarksObtained;
      attempt.maxPossibleMarks = grade.maxPossibleMarks;
      attempt.percentage = grade.percentage;
      attempt.isPassed = grade.isPassed;
      await attempt.save();

      return res.status(400).json({
        success: false,
        code: 'TIMER_EXPIRED',
        error: 'Exam time has expired. Your attempt has been automatically submitted.',
        attempt,
      });
    }

    // Update answer array
    const ansIndex = attempt.answers.findIndex(
      (a) => a.questionIndex === Number(questionIndex)
    );

    const validOption =
      selectedOptionIndex === null || typeof selectedOptionIndex === 'number'
        ? selectedOptionIndex
        : null;

    if (ansIndex >= 0) {
      attempt.answers[ansIndex].selectedOptionIndex = validOption;
    } else {
      attempt.answers.push({
        questionIndex: Number(questionIndex),
        selectedOptionIndex: validOption,
        isCorrect: false,
        marksObtained: 0,
      });
    }

    await attempt.save();

    return res.status(200).json({
      success: true,
      message: 'Answer recorded.',
      answers: attempt.answers,
    });
  } catch (error) {
    console.error('[Save Answer Error]:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save answer.',
    });
  }
};

// Submit examination attempt (manual or triggered by timer)
const submitAttempt = async (req, res) => {
  try {
    const { id } = req.params;
    const { isAutomatic } = req.body;

    const attempt = await ExamAttempt.findById(id);
    if (!attempt) {
      return res.status(404).json({
        success: false,
        error: 'Attempt not found.',
      });
    }

    if (attempt.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You do not own this attempt.',
      });
    }

    if (attempt.status !== 'in-progress') {
      return res.status(400).json({
        success: false,
        error: `Attempt has already been submitted (status: ${attempt.status}).`,
        attempt,
      });
    }

    const exam = await Exam.findById(attempt.examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        error: 'Associated exam not found.',
      });
    }

    const now = new Date();
    // Grade the answers against the master answer key on server
    const grade = gradeAttempt(exam, attempt.answers);

    const isTimerExpired = now > new Date(attempt.deadline.getTime() + 10000);
    const finalStatus = isTimerExpired ? 'expired' : 'submitted';

    attempt.status = finalStatus;
    attempt.submittedAutomatically = Boolean(isAutomatic || isTimerExpired);
    attempt.submitTime = now;
    attempt.answers = grade.gradedAnswers;
    attempt.totalMarksObtained = grade.totalMarksObtained;
    attempt.maxPossibleMarks = grade.maxPossibleMarks;
    attempt.percentage = grade.percentage;
    attempt.isPassed = grade.isPassed;

    await attempt.save();

    // Prepare response depending on exam result release setting
    const showResults = exam.showResultsImmediately;

    let resultResponse = {
      _id: attempt._id,
      examId: attempt.examId,
      examTitle: exam.title,
      status: attempt.status,
      startTime: attempt.startTime,
      submitTime: attempt.submitTime,
      submittedAutomatically: attempt.submittedAutomatically,
      showResultsImmediately: showResults,
    };

    if (showResults) {
      resultResponse = {
        ...resultResponse,
        totalMarksObtained: attempt.totalMarksObtained,
        maxPossibleMarks: attempt.maxPossibleMarks,
        percentage: attempt.percentage,
        isPassed: attempt.isPassed,
        passPercentage: exam.passPercentage,
        questionsBreakdown: exam.questions.map((q, idx) => {
          const studentAns = attempt.answers.find((a) => a.questionIndex === idx);
          return {
            index: idx,
            questionText: q.questionText,
            options: q.options,
            selectedOptionIndex: studentAns ? studentAns.selectedOptionIndex : null,
            correctOptionIndex: q.correctOptionIndex,
            isCorrect: studentAns ? studentAns.isCorrect : false,
            marksObtained: studentAns ? studentAns.marksObtained : 0,
            maxMarks: q.marks,
            explanation: q.explanation || '',
          };
        }),
      };
    }

    return res.status(200).json({
      success: true,
      message: attempt.submittedAutomatically
        ? 'Exam submitted automatically due to time expiration.'
        : 'Exam submitted successfully.',
      result: resultResponse,
    });
  } catch (error) {
    console.error('[Submit Attempt Error]:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to submit exam attempt.',
    });
  }
};

// Get single attempt result (Student/Teacher/Admin)
const getAttemptResult = async (req, res) => {
  try {
    const { id } = req.params;

    const attempt = await ExamAttempt.findById(id)
      .populate('studentId', 'name email')
      .populate('examId');

    if (!attempt) {
      return res.status(404).json({
        success: false,
        error: 'Attempt not found.',
      });
    }

    const exam = attempt.examId;
    const isOwnerStudent = attempt.studentId._id.toString() === req.user._id.toString();
    const isOwnerTeacher =
      exam &&
      exam.teacherId &&
      exam.teacherId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwnerStudent && !isOwnerTeacher && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You do not have permission to view this result.',
      });
    }

    const canViewFullAnswers =
      isAdmin || isOwnerTeacher || (isOwnerStudent && exam.showResultsImmediately);

    let questionsBreakdown = null;
    if (canViewFullAnswers && exam && Array.isArray(exam.questions)) {
      questionsBreakdown = exam.questions.map((q, idx) => {
        const studentAns = attempt.answers.find((a) => a.questionIndex === idx);
        return {
          index: idx,
          questionText: q.questionText,
          options: q.options,
          selectedOptionIndex: studentAns ? studentAns.selectedOptionIndex : null,
          correctOptionIndex: q.correctOptionIndex,
          isCorrect: studentAns ? studentAns.isCorrect : false,
          marksObtained: studentAns ? studentAns.marksObtained : 0,
          maxMarks: q.marks,
          explanation: q.explanation || '',
        };
      });
    }

    return res.status(200).json({
      success: true,
      attempt: {
        _id: attempt._id,
        examId: exam ? exam._id : null,
        examTitle: exam ? exam.title : 'Examination',
        student: attempt.studentId,
        status: attempt.status,
        startTime: attempt.startTime,
        deadline: attempt.deadline,
        submitTime: attempt.submitTime,
        submittedAutomatically: attempt.submittedAutomatically,
        totalMarksObtained: attempt.totalMarksObtained,
        maxPossibleMarks: attempt.maxPossibleMarks,
        percentage: attempt.percentage,
        isPassed: attempt.isPassed,
        showResultsImmediately: exam ? exam.showResultsImmediately : true,
        questionsBreakdown,
      },
    });
  } catch (error) {
    console.error('[Get Attempt Result Error]:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve attempt result.',
    });
  }
};

// Get logged in student's attempt history
const getMyAttempts = async (req, res) => {
  try {
    const attempts = await ExamAttempt.find({ studentId: req.user._id })
      .populate('examId', 'title description durationMinutes passPercentage showResultsImmediately')
      .sort({ createdAt: -1 });

    const formatted = attempts.map((att) => ({
      _id: att._id,
      examId: att.examId ? att.examId._id : null,
      examTitle: att.examId ? att.examId.title : 'Deleted Exam',
      status: att.status,
      startTime: att.startTime,
      submitTime: att.submitTime,
      totalMarksObtained: att.totalMarksObtained,
      maxPossibleMarks: att.maxPossibleMarks,
      percentage: att.percentage,
      isPassed: att.isPassed,
      submittedAutomatically: att.submittedAutomatically,
      showResultsImmediately: att.examId ? att.examId.showResultsImmediately : true,
    }));

    return res.status(200).json({
      success: true,
      count: formatted.length,
      attempts: formatted,
    });
  } catch (error) {
    console.error('[Get My Attempts Error]:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve attempt history.',
    });
  }
};

// Get all attempts for a specific exam (Teacher/Admin)
const getExamAttemptsForTeacher = async (req, res) => {
  try {
    const { examId } = req.params;
    const exam = await Exam.findById(examId);

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
        error: 'Forbidden: You do not have permission to view submissions for this exam.',
      });
    }

    const attempts = await ExamAttempt.find({ examId })
      .populate('studentId', 'name email')
      .sort({ createdAt: -1 });

    // Aggregate statistics
    const totalSubmissions = attempts.filter((a) => a.status !== 'in-progress').length;
    const passedSubmissions = attempts.filter((a) => a.isPassed).length;
    const avgScore =
      totalSubmissions > 0
        ? Math.round(
            (attempts
              .filter((a) => a.status !== 'in-progress')
              .reduce((s, a) => s + a.percentage, 0) /
              totalSubmissions) *
              10
          ) / 10
        : 0;

    return res.status(200).json({
      success: true,
      exam: {
        _id: exam._id,
        title: exam.title,
        durationMinutes: exam.durationMinutes,
        totalMarks: exam.totalMarks,
        passPercentage: exam.passPercentage,
      },
      stats: {
        totalAttempts: attempts.length,
        totalCompleted: totalSubmissions,
        passedCount: passedSubmissions,
        passRate:
          totalSubmissions > 0
            ? Math.round((passedSubmissions / totalSubmissions) * 100)
            : 0,
        averagePercentage: avgScore,
      },
      attempts,
    });
  } catch (error) {
    console.error('[Get Exam Attempts Error]:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve exam attempts.',
    });
  }
};

module.exports = {
  startAttempt,
  saveAnswer,
  submitAttempt,
  getAttemptResult,
  getMyAttempts,
  getExamAttemptsForTeacher,
};
