const jwt = require('jsonwebtoken');
const passport = require('passport');
const { ethers } = require('ethers');
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const { sendSuccess, sendError, asyncHandler } = require('../utils/api');

/**
 * Generate JWT token
 * @param {Object} payload - Token payload
 * @returns {string} JWT token
 */
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * @route   GET /api/auth/google
 * @desc    Initiate Google OAuth SSO flow
 * @access  Public
 */
const googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
});

/**
 * @route   GET /api/auth/google/callback
 * @desc    Handle Google OAuth callback
 * @access  Public
 */
const googleCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, student, info) => {
    if (err) {
      console.error('OAuth Error:', err);
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=server_error`
      );
    }

    if (!student) {
      const message = info?.message || 'Authentication failed';
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=${encodeURIComponent(message)}`
      );
    }

    // Generate JWT for the authenticated student
    const token = generateToken({
      id: student._id,
      email: student.email,
      role: 'student',
    });

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  })(req, res, next);
};

/**
 * @route   POST /api/auth/login
 * @desc    Mock SSO Login for students (testing without Google OAuth)
 * @access  Public
 * @body    { email, password }
 */
const mockStudentLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendError(res, 'Email and password are required', 400);
  }

  // Find or create student (mocking SSO behavior)
  let student = await Student.findOne({ email });
  
  if (!student) {
    // For mock testing, just create the student if they don't exist
    // In production, Google OAuth handles this
    const username = email.split('@')[0];
    student = await Student.create({
      username: username,
      email: email,
      rollNumber: `ROLL-${Math.floor(1000 + Math.random() * 9000)}`,
      cgpa: 8.5, // Default for testing
    });
    console.log(`[Mock SSO] Created new student: ${email}`);
  }

  // Generate JWT
  const token = generateToken({
    id: student._id,
    email: student.email,
    role: 'student',
  });

  sendSuccess(
    res,
    {
      token,
      student: {
        id: student._id,
        username: student.username,
        email: student.email,
        rollNumber: student.rollNumber,
        isWalletLinked: student.isWalletLinked,
        walletAddress: student.walletAddress,
      },
    },
    200,
    'Login successful'
  );
});

/**
 * @route   POST /api/auth/link-wallet
 * @desc    Link MetaMask wallet to student account
 * @access  Private (Student)
 * @body    { walletAddress, signature, message }
 */
const linkWallet = asyncHandler(async (req, res) => {
  const { walletAddress, signature, message } = req.body;

  if (!walletAddress || !signature || !message) {
    return sendError(res, 'Wallet address, signature, and message are required', 400);
  }

  // Verify the signature using ethers.js
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return sendError(res, 'Signature verification failed', 401);
    }
  } catch (error) {
    return sendError(res, 'Invalid signature', 400);
  }

  // Check if wallet is already linked to another account
  const existingStudent = await Student.findOne({
    walletAddress: walletAddress.toLowerCase(),
    _id: { $ne: req.user.id },
  });

  if (existingStudent) {
    return sendError(res, 'This wallet is already linked to another account', 409);
  }

  // Link wallet to current student
  const student = await Student.findByIdAndUpdate(
    req.user.id,
    {
      walletAddress: walletAddress.toLowerCase(),
      isWalletLinked: true,
    },
    { new: true }
  );

  if (!student) {
    return sendError(res, 'Student not found', 404);
  }

  console.log(`🔗 Wallet linked: ${student.email} → ${walletAddress}`);
  sendSuccess(res, { student }, 200, 'Wallet linked successfully');
});

/**
 * @route   POST /api/auth/admin/login
 * @desc    Admin login with email and password
 * @access  Public
 * @body    { email, password }
 */
const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendError(res, 'Email and password are required', 400);
  }

  // Find admin and include password field
  const admin = await Admin.findOne({ email }).select('+password');

  if (!admin) {
    return sendError(res, 'Invalid credentials', 401);
  }

  // Compare passwords
  const isMatch = await admin.comparePassword(password);
  if (!isMatch) {
    return sendError(res, 'Invalid credentials', 401);
  }

  // Generate JWT
  const token = generateToken({
    id: admin._id,
    email: admin.email,
    role: admin.role,
  });

  sendSuccess(
    res,
    {
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
    },
    200,
    'Login successful'
  );
});

/**
 * @route   POST /api/auth/admin/register
 * @desc    Register a new admin (superadmin only)
 * @access  Private (Superadmin)
 * @body    { username, email, password, role }
 */
const adminRegister = asyncHandler(async (req, res) => {
  const { username, email, password, role } = req.body;

  // Only superadmin can create new admins
  if (req.user.role !== 'superadmin') {
    return sendError(res, 'Only superadmin can register new admins', 403);
  }

  // Check if admin already exists
  const existingAdmin = await Admin.findOne({
    $or: [{ email }, { username }],
  });

  if (existingAdmin) {
    return sendError(res, 'Admin with this email or username already exists', 409);
  }

  const admin = await Admin.create({
    username,
    email,
    password,
    role: role || 'admin',
  });

  sendSuccess(
    res,
    {
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
    },
    201,
    'Admin registered successfully'
  );
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user profile
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  let user;

  if (req.user.role === 'student') {
    user = await Student.findById(req.user.id);
  } else {
    user = await Admin.findById(req.user.id);
  }

  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  sendSuccess(res, { user, role: req.user.role });
});

module.exports = {
  googleAuth,
  googleCallback,
  mockStudentLogin,
  linkWallet,
  adminLogin,
  adminRegister,
  getMe,
};
