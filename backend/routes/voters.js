const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticateJWT, requireStudent } = require('../middleware/auth');
const {
  getProfile,
  updateProfile,
  getActiveElections,
  getVoterStatus,
} = require('../controllers/voterController');

// All voter routes require student authentication
router.use(authenticateJWT, requireStudent);

// ─── Profile ────────────────────────────────────────────────────────────────
router.get('/profile', getProfile);

router.put(
  '/profile',
  validate([
    body('rollNumber')
      .optional()
      .isString()
      .withMessage('Roll number must be a string'),
    body('cgpa')
      .optional()
      .isFloat({ min: 0, max: 10 })
      .withMessage('CGPA must be between 0 and 10'),
    body('hasActiveBacklogs')
      .optional()
      .isBoolean()
      .withMessage('hasActiveBacklogs must be a boolean'),
  ]),
  updateProfile
);

// ─── Elections ──────────────────────────────────────────────────────────────
router.get('/elections', getActiveElections);
router.get('/status/:electionId', getVoterStatus);

module.exports = router;
