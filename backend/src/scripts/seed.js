const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Exam = require('../models/Exam');
const ExamAttempt = require('../models/ExamAttempt');

dotenv.config();

const sampleQuestions = [
  {
    questionText: 'Which HTTP status code signifies that a requested resource was not found on the server?',
    options: ['200 OK', '403 Forbidden', '404 Not Found', '500 Internal Server Error'],
    correctOptionIndex: 2,
    marks: 2,
    explanation: 'HTTP 404 indicates that the server cannot find the requested resource.',
  },
  {
    questionText: 'What is the average time complexity of searching for an element in a balanced Binary Search Tree (BST)?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctOptionIndex: 1,
    marks: 2,
    explanation: 'In a balanced BST, each comparison halves the search space, giving O(log n) time complexity.',
  },
  {
    questionText: 'Which CSS property is used to create a flexbox layout container?',
    options: ['display: flex;', 'position: absolute;', 'float: left;', 'grid-template-columns: 1fr;'],
    correctOptionIndex: 0,
    marks: 2,
    explanation: 'Setting "display: flex;" defines a flex container and enables flex context for all its direct children.',
  },
  {
    questionText: 'In React, which hook is primarily used to perform side effects such as data fetching or subscriptions?',
    options: ['useState', 'useEffect', 'useMemo', 'useReducer'],
    correctOptionIndex: 1,
    marks: 2,
    explanation: 'useEffect serves the purpose of executing side effects in functional React components.',
  },
  {
    questionText: 'In MongoDB, what type of structure is used to store individual records inside collections?',
    options: ['Relational Tables', 'BSON Documents', 'XML Trees', 'Plain Text CSV'],
    correctOptionIndex: 1,
    marks: 2,
    explanation: 'MongoDB stores data records as BSON (Binary JSON) documents.',
  },
];

const seedData = async () => {
  console.log('[ExamEase Seed] Starting database initialization...');
  const connected = await connectDB();

  if (!connected) {
    console.error('[ExamEase Seed] Aborted: Could not connect to MongoDB.');
    console.error('Please verify that MongoDB is running and MONGODB_URI in backend/.env is reachable.');
    process.exit(1);
  }

  try {
    // Clean up existing seeded accounts and sample exams
    await User.deleteMany({
      email: {
        $in: [
          'admin@examease.com',
          'teacher@examease.com',
          'student@examease.com',
        ],
      },
    });

    console.log('[ExamEase Seed] Creating default users...');

    // 1. Admin
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@examease.com',
      password: 'AdminPassword123!',
      role: 'admin',
      isActive: true,
    });
    console.log('   ✓ Admin user created: admin@examease.com / AdminPassword123!');

    // 2. Teacher
    const teacher = await User.create({
      name: 'Prof. Sarah Jenkins',
      email: 'teacher@examease.com',
      password: 'TeacherPassword123!',
      role: 'teacher',
      isActive: true,
    });
    console.log('   ✓ Teacher user created: teacher@examease.com / TeacherPassword123!');

    // 3. Student
    const student = await User.create({
      name: 'Alex Rivera',
      email: 'student@examease.com',
      password: 'StudentPassword123!',
      role: 'student',
      isActive: true,
    });
    console.log('   ✓ Student user created: student@examease.com / StudentPassword123!');

    // Clean old sample exams by this teacher
    await Exam.deleteMany({ teacherId: teacher._id });

    // 4. Sample Exam
    const exam = await Exam.create({
      title: 'Web Technologies & Computer Science Fundamentals',
      description:
        'A comprehensive 5-question multiple choice test covering HTTP protocols, algorithms, React hooks, CSS flexbox, and NoSQL databases.',
      teacherId: teacher._id,
      durationMinutes: 15,
      passPercentage: 50,
      isPublished: true,
      allowMultipleAttempts: true,
      showResultsImmediately: true,
      questions: sampleQuestions,
    });

    console.log(`   ✓ Sample exam created: "${exam.title}" (5 Questions, Total Marks: ${exam.totalMarks})`);

    console.log('\n======================================================');
    console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
    console.log('Sample Accounts for Testing:');
    console.log('------------------------------------------------------');
    console.log('  Admin:   admin@examease.com    / AdminPassword123!');
    console.log('  Teacher: teacher@examease.com  / TeacherPassword123!');
    console.log('  Student: student@examease.com  / StudentPassword123!');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('[ExamEase Seed Error]:', error);
    process.exit(1);
  }
};

seedData();
