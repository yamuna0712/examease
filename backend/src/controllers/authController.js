const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'examease_jwt_secret_token_dev_994827361548';
  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
  return jwt.sign(
    {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    secret,
    { expiresIn }
  );
};

// Register new user (student or teacher only)
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email, and password.',
      });
    }

    if (role === 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Security restriction: Admin accounts cannot be created via public registration.',
      });
    }

    const assignedRole = role === 'teacher' ? 'teacher' : 'student';

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists.',
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: assignedRole,
      isActive: true,
    });

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'Registration successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('[Register Error]:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Registration failed due to a server error.',
    });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please enter both email and password.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'This account has been deactivated. Contact an administrator.',
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('[Login Error]:', error);
    return res.status(500).json({
      success: false,
      error: 'Login failed due to a server error.',
    });
  }
};

// Get current profile
const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      isActive: req.user.isActive,
      createdAt: req.user.createdAt,
    },
  });
};

// Secure Bootstrap First Administrator
const bootstrapAdmin = async (req, res) => {
  try {
    const { name, email, password, bootstrapSecret } = req.body;

    const configuredSecret =
      process.env.ADMIN_BOOTSTRAP_SECRET || 'examease_admin_bootstrap_key_2026';

    if (!bootstrapSecret || bootstrapSecret !== configuredSecret) {
      return res.status(403).json({
        success: false,
        error: 'Invalid bootstrap secret key.',
      });
    }

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and password are required.',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email already exists.',
      });
    }

    const adminUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'admin',
      isActive: true,
    });

    const token = generateToken(adminUser);

    return res.status(201).json({
      success: true,
      message: 'Initial administrator account created successfully.',
      token,
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
      },
    });
  } catch (error) {
    console.error('[Bootstrap Admin Error]:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to bootstrap administrator account.',
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  bootstrapAdmin,
};
