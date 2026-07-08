const CandidateInfo = require('../models/CandidateInfo');
const Election = require('../models/Election');
const { sendSuccess, sendError, asyncHandler } = require('../utils/api');

/**
 * @route   GET /api/candidates/:electionId
 * @desc    Get all approved candidates for a specific election
 * @access  Public
 */
const getCandidatesByElection = asyncHandler(async (req, res) => {
  const { electionId } = req.params;

  // Verify election exists
  const election = await Election.findById(electionId);
  if (!election) {
    return sendError(res, 'Election not found', 404);
  }

  // Only return approved candidates
  const candidates = await CandidateInfo.find({
    electionId,
    isApproved: true,
  }).select('-__v');

  sendSuccess(res, {
    election: {
      id: election._id,
      title: election.title,
      phase: election.phase,
    },
    candidates,
  });
});

/**
 * @route   GET /api/candidates/detail/:id
 * @desc    Get a single candidate's details
 * @access  Public
 */
const getCandidateById = asyncHandler(async (req, res) => {
  const candidate = await CandidateInfo.findById(req.params.id).populate(
    'electionId',
    'title phase'
  );

  if (!candidate) {
    return sendError(res, 'Candidate not found', 404);
  }

  // Only return if approved (admins can see via admin routes)
  if (!candidate.isApproved) {
    return sendError(res, 'Candidate not found', 404);
  }

  sendSuccess(res, { candidate });
});

module.exports = {
  getCandidatesByElection,
  getCandidateById,
};
