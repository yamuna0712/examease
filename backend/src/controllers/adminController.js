
const User = require('../models/User');
const Exam = require('../models/Exam');
const ExamAttempt = require('../models/ExamAttempt');

// System statistics
const getSystemStats = async (req, res) => {
  try {
    const [
      totalUsers,
      studentCount,
      teacherCount,
      adminCount,
      activeUsers,
      totalExams,
      publishedExams,
      totalAttempts,
      completedAttempts,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'teacher' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ isActive: true }),
      Exam.countDocuments(),
      Exam.countDocuments({ isPublished: true }),
      ExamAttempt.countDocuments(),
      ExamAttempt.countDocuments({ status: { $in: ['submitted', 'expired'] } }),
    ]);

    const avgScoreAgg = await ExamAttempt.aggregate([
      { $match: { status: { $in: ['submitted', 'expired'] } } },
      { $group: { _id: null, avgPercentage: { $avg: '$percentage' } } },
    ]);

    const overallAveragePercentage =
      avgScoreAgg.length > 0
        ? Math.round((avgScoreAgg[0].avgPercentage || 0) * 10) / 10
        : 0;

    const passedAttemptsCount = await ExamAttempt.countDocuments({
      isPassed: true,
      status: { $in: ['submitted', 'expired'] },
    });

    const overallPassRate =
      completedAttempts > 0
        ? Math.round((passedAttemptsCount / completedAttempts) * 100)
        : 0;

    return res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          students: studentCount,
          teachers: teacherCount,
          admins: adminCount,
          active: activeUsers,
          inactive: totalUsers - activeUsers,
        },
        exams: {
          total: totalExams,
          published: publishedExams,
          draft: totalExams - publishedExams,
        },
        attempts: {
          total: totalAttempts,
          completed: completedAttempts,
          inProgress: totalAttempts - completedAttempts,
          passedCount: passedAttemptsCount,
          passRate: overallPassRate,
          averageScorePercentage: overallAveragePercentage,
        },
      },
    });
  } catch (error) {
    console.error('[Admin Stats Error]:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve system statistics.',
    });
  }
};

// List all users
const getUsers = async (req, res) => {
  try {
    const { role, status, search } = req.query;
    const query = {};

    if (role && ['student', 'teacher', 'admin'].includes(role)) {
      query.role = role;
    }

    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error('[Admin Get Users Error]:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch users.',
    });
  }
};

// Create a new student or teacher (Admin only)
const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (
      typeof name !== 'string' ||
      !name.trim() ||
      typeof email !== 'string' ||
      !email.trim() ||
      typeof password !== 'string' ||
      !password ||
      !role
    ) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, password, and role are required.',
      });
    }

    if (!['student', 'teacher'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Only student and teacher accounts can be created here.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must contain at least 6 characters.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email already exists.',
      });
    }

    // User.js automatically hashes the password before saving.
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role,
    });

    return res.status(201).json({
      success: true,
      message: `${role === 'teacher' ? 'Teacher' : 'Student'} account created successfully.`,
      user,
    });
  } catch (error) {
    console.error('[Admin Create User Error]:', error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email already exists.',
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to create user.',
    });
  }
};

// Toggle user activation status
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user._id.toString() === id) {
      return res.status(400).json({
        success: false,
        error: 'You cannot deactivate your own administrative account.',
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found.',
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User ${user.name} has been ${user.isActive ? 'activated' : 'deactivated'}.`,
      user,
    });
  } catch (error) {
    console.error('[Admin Toggle User Status Error]:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update user status.',
    });
  }
};

// Delete user account
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user._id.toString() === id) {
      return res.status(400).json({
        success: false,
        error: 'You cannot delete your own account.',
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found.',
      });
    }

    await User.findByIdAndDelete(id);

    // Remove this user's exam attempts.
    await ExamAttempt.deleteMany({ studentId: id });

    return res.status(200).json({
      success: true,
      message: `User ${user.name} and related records deleted successfully.`,
    });
  } catch (error) {
    console.error('[Admin Delete User Error]:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete user.',
    });
  }
};

// Get all examinations in the system
const getAllExams = async (req, res) => {
  try {
    const exams = await Exam.find()
      .populate('teacherId', 'name email')
      .sort({ createdAt: -1 });

    const examIds = exams.map((exam) => exam._id);

    const attemptStats = await ExamAttempt.aggregate([
      { $match: { examId: { $in: examIds } } },
      {
        $group: {
          _id: '$examId',
          totalAttempts: { $sum: 1 },
          completedAttempts: {
            $sum: {
              $cond: [{ $ne: ['$status', 'in-progress'] }, 1, 0],
            },
          },
          avgScore: { $avg: '$percentage' },
        },
      },
    ]);

    const statMap = {};

    attemptStats.forEach((stats) => {
      statMap[stats._id.toString()] = {
        totalAttempts: stats.totalAttempts,
        completedAttempts: stats.completedAttempts,
        averagePercentage: Math.round((stats.avgScore || 0) * 10) / 10,
      };
    });

    const examsWithMetrics = exams.map((exam) => ({
      ...exam.toJSON(),
      stats: statMap[exam._id.toString()] || {
        totalAttempts: 0,
        completedAttempts: 0,
        averagePercentage: 0,
      },
    }));

    return res.status(200).json({
      success: true,
      count: examsWithMetrics.length,
      exams: examsWithMetrics,
    });
  } catch (error) {
    console.error('[Admin Get All Exams Error]:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve exams.',
    });
  }
};

// Get all exam results across the platform
const getAllResults = async (req, res) => {
  try {
    const attempts = await ExamAttempt.find()
      .populate('studentId', 'name email')
      .populate('examId', 'title durationMinutes passPercentage')
      .sort({ createdAt: -1 })
      .limit(200);

    return res.status(200).json({
      success: true,
      count: attempts.length,
      attempts,
    });
  } catch (error) {
    console.error('[Admin Get All Results Error]:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve examination results.',
    });
  }
};

module.exports = {
  getSystemStats,
  getUsers,
  createUser,
  toggleUserStatus,
  deleteUser,
  getAllExams,
  getAllResults,
};
