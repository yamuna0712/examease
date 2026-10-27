const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
  },
  options: {
    type: [String],
    validate: {
      validator: function (v) {
        return Array.isArray(v) && v.length >= 2;
      },
      message: 'Question must have at least 2 options',
    },
    required: true,
  },
  correctOptionIndex: {
    type: Number,
    required: [true, 'Correct option index is required'],
    min: 0,
  },
  marks: {
    type: Number,
    required: true,
    default: 1,
    min: 1,
  },
  explanation: {
    type: String,
    trim: true,
    default: '',
  },
});

const examSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Exam title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    durationMinutes: {
      type: Number,
      required: [true, 'Duration in minutes is required'],
      min: [1, 'Duration must be at least 1 minute'],
      max: [600, 'Duration cannot exceed 600 minutes'],
    },
    passPercentage: {
      type: Number,
      default: 40,
      min: 0,
      max: 100,
    },
    startTime: {
      type: Date,
      default: null,
    },
    endTime: {
      type: Date,
      default: null,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    allowMultipleAttempts: {
      type: Boolean,
      default: false,
    },
    showResultsImmediately: {
      type: Boolean,
      default: true,
    },
    questions: [questionSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for total marks
examSchema.virtual('totalMarks').get(function () {
  if (!this.questions || !this.questions.length) return 0;
  return this.questions.reduce((sum, q) => sum + (q.marks || 1), 0);
});

// Virtual for question count
examSchema.virtual('questionCount').get(function () {
  return this.questions ? this.questions.length : 0;
});

module.exports = mongoose.model('Exam', examSchema);
