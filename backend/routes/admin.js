const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticateJWT, requireAdmin } = require('../middleware/auth');
const {
  createElection,
  getElections,
  getElectionById,
  updateElection,
  getElectionCandidates,
  registerCandidate,
  approveCandidate,
  getStudents,
  batchWhitelist,
  getDashboardStats,
} = require('../controllers/adminController');

// All admin routes require admin authentication
router.use(authenticateJWT, requireAdmin);

// ─── Dashboard ──────────────────────────────────────────────────────────────
router.get('/dashboard', getDashboardStats);

// ─── Elections ──────────────────────────────────────────────────────────────
router.post(
  '/elections',
  validate([
    body('title').notEmpty().withMessage('Election title is required'),
    body('startTime')
      .isISO8601()
      .withMessage('Valid start time is required (ISO 8601)'),
    body('endTime')
      .isISO8601()
      .withMessage('Valid end time is required (ISO 8601)'),
  ]),
  createElection
);

router.get('/elections', getElections);
router.get('/elections/:id', getElectionById);

router.put(
  '/elections/:id',
  validate([
    body('phase')
      .optional()
      .isIn(['setup', 'active', 'ended'])
      .withMessage('Phase must be setup, active, or ended'),
  ]),
  updateElection
);

router.get('/elections/:id/candidates', getElectionCandidates);

// ─── Candidates ─────────────────────────────────────────────────────────────
router.post(
  '/candidates',
  validate([
    body('name').notEmpty().withMessage('Candidate name is required'),
    body('rollNumber').notEmpty().withMessage('Roll number is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('walletAddress').notEmpty().withMessage('Wallet address is required'),
    body('position').notEmpty().withMessage('Position is required'),
    body('cgpa')
      .isFloat({ min: 0, max: 10 })
      .withMessage('CGPA must be between 0 and 10'),
    body('electionId').notEmpty().withMessage('Election ID is required'),
  ]),
  registerCandidate
);

router.put('/candidates/:id/approve', approveCandidate);

// ─── Students ───────────────────────────────────────────────────────────────
router.get('/students', getStudents);

router.post(
  '/students/whitelist',
  validate([
    body('studentIds')
      .isArray({ min: 1 })
      .withMessage('studentIds must be a non-empty array'),
    body('isWhitelisted')
      .isBoolean()
      .withMessage('isWhitelisted must be a boolean'),
  ]),
  batchWhitelist
);

module.exports = router;
