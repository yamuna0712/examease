const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionIndex: {
    type: Number,
    required: true,
  },
  selectedOptionIndex: {
    type: Number,
    default: null,
  },
  isCorrect: {
    type: Boolean,
    default: false,
  },
  marksObtained: {
    type: Number,
    default: 0,
  },
});

const examAttemptSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    deadline: {
      type: Date,
      required: true,
    },
    submitTime: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['in-progress', 'submitted', 'expired'],
      default: 'in-progress',
    },
    submittedAutomatically: {
      type: Boolean,
      default: false,
    },
    answers: [answerSchema],
    totalMarksObtained: {
      type: Number,
      default: 0,
    },
    maxPossibleMarks: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    isPassed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

examAttemptSchema.index({ examId: 1, studentId: 1 });

module.exports = mongoose.model('ExamAttempt', examAttemptSchema);
