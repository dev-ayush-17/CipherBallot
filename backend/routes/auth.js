const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticateJWT, requireAdmin, requireStudent } = require('../middleware/auth');
const {
  googleAuth,
  googleCallback,
  linkWallet,
  adminLogin,
  adminRegister,
  getMe,
} = require('../controllers/authController');

// ─── Google OAuth (Student SSO) ─────────────────────────────────────────────
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);

// ─── Mock SSO Login (For testing without Google OAuth) ──────────────────────
router.post('/login', require('../controllers/authController').mockStudentLogin);


// ─── Wallet Linking ─────────────────────────────────────────────────────────
router.post(
  '/link-wallet',
  authenticateJWT,
  requireStudent,
  validate([
    body('walletAddress').notEmpty().withMessage('Wallet address is required'),
    body('signature').notEmpty().withMessage('Signature is required'),
    body('message').notEmpty().withMessage('Signed message is required'),
  ]),
  linkWallet
);

// ─── Admin Auth ─────────────────────────────────────────────────────────────
router.post(
  '/admin/login',
  validate([
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  adminLogin
);

router.post(
  '/admin/register',
  authenticateJWT,
  requireAdmin,
  validate([
    body('username')
      .isLength({ min: 3 })
      .withMessage('Username must be at least 3 characters'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ]),
  adminRegister
);

// ─── Current User ───────────────────────────────────────────────────────────
router.get('/me', authenticateJWT, getMe);

module.exports = router;
