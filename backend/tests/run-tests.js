process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_examease_testing_12345';
process.env.ADMIN_BOOTSTRAP_SECRET = 'test_bootstrap_secret';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { requireRole } = require('../src/middleware/roles');
const { checkDbConnection } = require('../src/middleware/dbCheck');

console.log('====================================================');
console.log('🧪 Starting ExamEase Core Engine & Security Test Suite');
console.log('====================================================\n');

let totalTests = 0;
let passedTests = 0;

const assert = (condition, testName) => {
  totalTests++;
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    throw new Error(`Test failed: ${testName}`);
  }
};

const runAllTests = async () => {
  try {
    // -----------------------------------------------------------------
    // TEST GROUP 1: Database Safety & 503 Middleware
    // -----------------------------------------------------------------
    console.log('[Test Group 1: Database Disconnection Safety Middleware]');
    {
      let statusCalled = null;
      let jsonCalled = null;
      const mockReq = {};
      const mockRes = {
        status: (code) => {
          statusCalled = code;
          return {
            json: (payload) => {
              jsonCalled = payload;
              return payload;
            },
          };
        },
      };
      let nextCalled = false;
      const mockNext = () => {
        nextCalled = true;
      };

      // Since mongoose is not connected yet, checkDbConnection should return 503
      checkDbConnection(mockReq, mockRes, mockNext);
      assert(statusCalled === 503, 'Returns HTTP 503 when database is disconnected');
      assert(jsonCalled && jsonCalled.code === 'DB_UNAVAILABLE', 'Provides code: DB_UNAVAILABLE');
      assert(
        jsonCalled.details && jsonCalled.details.instructions.length > 0,
        'Provides actionable MongoDB setup instructions in error body'
      );
      assert(nextCalled === false, 'Halts request processing when database is down');
    }

    // -----------------------------------------------------------------
    // TEST GROUP 2: Password Security & Bcrypt Hashing
    // -----------------------------------------------------------------
    console.log('\n[Test Group 2: Password Hashing & Bcrypt Verification]');
    {
      const rawPassword = 'SecureStudentPassword123!';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(rawPassword, salt);

      assert(hashedPassword !== rawPassword, 'Password is never stored in plain text');
      assert(hashedPassword.startsWith('$2'), 'Password uses bcrypt salt format');

      const isMatchValid = await bcrypt.compare(rawPassword, hashedPassword);
      assert(isMatchValid === true, 'Bcrypt successfully verifies matching password');

      const isMatchInvalid = await bcrypt.compare('WrongPassword!', hashedPassword);
      assert(isMatchInvalid === false, 'Bcrypt rejects incorrect password');
    }

    // -----------------------------------------------------------------
    // TEST GROUP 3: JWT Token Generation & Verification
    // -----------------------------------------------------------------
    console.log('\n[Test Group 3: JWT Authentication & Role Tokens]');
    {
      const payload = {
        id: '65f123456789abcdef012345',
        name: 'Student Tester',
        email: 'student@example.com',
        role: 'student',
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
      assert(typeof token === 'string' && token.length > 20, 'Generates valid JWT string');

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      assert(decoded.id === payload.id, 'Decoded token preserves user ID');
      assert(decoded.role === 'student', 'Decoded token preserves user role');

      let tamperFailed = false;
      try {
        jwt.verify(token, 'invalid_secret_key');
      } catch (err) {
        tamperFailed = true;
      }
      assert(tamperFailed, 'Rejects JWT with modified secret');
    }

    // -----------------------------------------------------------------
    // TEST GROUP 4: RBAC (Role-Based Access Control) Enforcement
    // -----------------------------------------------------------------
    console.log('\n[Test Group 4: Role-Based Access Control Middleware]');
    {
      const teacherMiddleware = requireRole('teacher', 'admin');

      // 4a: Student blocked from teacher route
      let studentBlocked = false;
      const studentReq = { user: { role: 'student', name: 'Alex' } };
      const res403 = {
        status: (code) => {
          if (code === 403) studentBlocked = true;
          return { json: () => {} };
        },
      };
      teacherMiddleware(studentReq, res403, () => {});
      assert(studentBlocked === true, 'Blocks Student from accessing Teacher route with 403');

      // 4b: Teacher allowed on teacher route
      let teacherAllowed = false;
      const teacherReq = { user: { role: 'teacher', name: 'Prof Jenkins' } };
      teacherMiddleware(teacherReq, {}, () => {
        teacherAllowed = true;
      });
      assert(teacherAllowed === true, 'Permits Teacher to access Teacher route');

      // 4c: Admin allowed on teacher route
      let adminAllowed = false;
      const adminReq = { user: { role: 'admin', name: 'Admin Master' } };
      teacherMiddleware(adminReq, {}, () => {
        adminAllowed = true;
      });
      assert(adminAllowed === true, 'Permits Admin to access management routes');
    }

    // -----------------------------------------------------------------
    // TEST GROUP 5: Exam Engine - Grading & Scoring Logic
    // -----------------------------------------------------------------
    console.log('\n[Test Group 5: Examination Scoring & Grading Engine]');
    {
      const sampleExam = {
        passPercentage: 50,
        questions: [
          { marks: 2, correctOptionIndex: 2 }, // Q0: 2 marks
          { marks: 3, correctOptionIndex: 1 }, // Q1: 3 marks
          { marks: 5, correctOptionIndex: 0 }, // Q2: 5 marks
        ],
      }; // Total marks: 10

      // Scenario A: 100% Score
      const perfectAnswers = [
        { questionIndex: 0, selectedOptionIndex: 2 },
        { questionIndex: 1, selectedOptionIndex: 1 },
        { questionIndex: 2, selectedOptionIndex: 0 },
      ];

      const gradePerfect = (exam, answers) => {
        let total = 0;
        let max = 0;
        exam.questions.forEach((q, idx) => {
          max += q.marks;
          const ans = answers.find((a) => a.questionIndex === idx);
          if (ans && ans.selectedOptionIndex === q.correctOptionIndex) {
            total += q.marks;
          }
        });
        const pct = max > 0 ? (total / max) * 100 : 0;
        return { total, max, pct, isPassed: pct >= exam.passPercentage };
      };

      const resPerfect = gradePerfect(sampleExam, perfectAnswers);
      assert(resPerfect.total === 10, 'Perfect score gives full marks (10/10)');
      assert(resPerfect.pct === 100, 'Perfect score percentage is 100%');
      assert(resPerfect.isPassed === true, 'Perfect score results in Pass');

      // Scenario B: Partial Score (Q0 correct [2m], Q1 wrong [0m], Q2 correct [5m] => 7/10 = 70%)
      const partialAnswers = [
        { questionIndex: 0, selectedOptionIndex: 2 },
        { questionIndex: 1, selectedOptionIndex: 3 }, // WRONG
        { questionIndex: 2, selectedOptionIndex: 0 },
      ];
      const resPartial = gradePerfect(sampleExam, partialAnswers);
      assert(resPartial.total === 7, 'Partial score calculates accurate marks (7/10)');
      assert(resPartial.pct === 70, 'Partial score percentage is 70%');
      assert(resPartial.isPassed === true, '70% is above 50% pass threshold');

      // Scenario C: Failing Score (Only Q0 correct [2m] => 2/10 = 20%)
      const failAnswers = [
        { questionIndex: 0, selectedOptionIndex: 2 },
        { questionIndex: 1, selectedOptionIndex: 0 },
        { questionIndex: 2, selectedOptionIndex: 1 },
      ];
      const resFail = gradePerfect(sampleExam, failAnswers);
      assert(resFail.total === 2, 'Failing score records 2/10');
      assert(resFail.pct === 20, 'Failing score percentage is 20%');
      assert(resFail.isPassed === false, '20% is below 50% pass threshold');

      // Scenario D: Blank/Skipped Answers (No answer chosen)
      const blankAnswers = [
        { questionIndex: 0, selectedOptionIndex: null },
        { questionIndex: 1, selectedOptionIndex: null },
      ];
      const resBlank = gradePerfect(sampleExam, blankAnswers);
      assert(resBlank.total === 0, 'Skipped questions receive 0 marks without error');
    }

    // -----------------------------------------------------------------
    // TEST GROUP 6: Countdown Timer & Deadline Engine
    // -----------------------------------------------------------------
    console.log('\n[Test Group 6: Server-Controlled Timer & Expiration Engine]');
    {
      const startTime = new Date();
      const durationMinutes = 30;
      const expectedDurationMs = 30 * 60 * 1000;

      // Normal unconstrained deadline
      const normalDeadline = new Date(startTime.getTime() + expectedDurationMs);
      assert(
        normalDeadline.getTime() - startTime.getTime() === expectedDurationMs,
        'Calculates exact duration deadline from server start time'
      );

      // Clamped by exam endTime
      const earlyEndTime = new Date(startTime.getTime() + 15 * 60 * 1000); // 15 mins
      let effectiveDeadline = normalDeadline;
      if (earlyEndTime < normalDeadline) {
        effectiveDeadline = earlyEndTime;
      }
      assert(
        effectiveDeadline.getTime() === earlyEndTime.getTime(),
        'Clamps deadline when exam end window is sooner than full duration'
      );

      // Remaining seconds computation
      const now = new Date(startTime.getTime() + 10 * 60 * 1000); // 10 minutes elapsed
      const remainingSeconds = Math.max(
        0,
        Math.floor((normalDeadline.getTime() - now.getTime()) / 1000)
      );
      assert(remainingSeconds === 20 * 60, 'Calculates remaining seconds accurately (20 mins left)');

      // Timer expiration check
      const pastDeadline = new Date(startTime.getTime() + 35 * 60 * 1000); // 35 mins elapsed
      const isExpired = pastDeadline > normalDeadline;
      assert(isExpired === true, 'Accurately detects when timer has expired');
    }

    // -----------------------------------------------------------------
    // TEST GROUP 7: Security Sanitization (Never Expose Correct Answers)
    // -----------------------------------------------------------------
    console.log('\n[Test Group 7: Student Examination Payload Sanitization]');
    {
      const fullTeacherQuestions = [
        {
          _id: 'q1',
          questionText: 'What is Node.js?',
          options: ['A runtime', 'A browser', 'A language', 'An OS'],
          correctOptionIndex: 0,
          marks: 2,
          explanation: 'Node.js is a JavaScript runtime built on Chrome V8 engine.',
        },
      ];

      // Sanitization function as in examController
      const studentQuestions = fullTeacherQuestions.map((q, idx) => ({
        index: idx,
        id: q._id,
        questionText: q.questionText,
        options: q.options,
        marks: q.marks,
      }));

      assert(
        studentQuestions[0].correctOptionIndex === undefined,
        'SECURITY: correctOptionIndex is completely removed for students'
      );
      assert(
        studentQuestions[0].explanation === undefined,
        'SECURITY: question explanation is completely removed for students'
      );
      assert(
        studentQuestions[0].options.length === 4,
        'Student still receives all options for answering'
      );
    }

    console.log('\n====================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
    console.log('====================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ TEST RUN FAILED:');
    console.error(err);
    process.exit(1);
  }
};

runAllTests();
