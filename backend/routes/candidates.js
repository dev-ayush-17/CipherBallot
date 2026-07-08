const express = require('express');
const router = express.Router();
const {
  getCandidatesByElection,
  getCandidateById,
} = require('../controllers/candidateController');

// ─── Public Candidate Routes ────────────────────────────────────────────────
// These routes are public — no auth required

// Get all approved candidates for an election
router.get('/:electionId', getCandidatesByElection);

// Get a single candidate's details
router.get('/detail/:id', getCandidateById);

module.exports = router;
