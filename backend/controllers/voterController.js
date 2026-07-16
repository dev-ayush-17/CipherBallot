const Student = require('../models/Student');
const Election = require('../models/Election');
const { sendSuccess, sendError, asyncHandler } = require('../utils/api');

/**
 * @route   GET /api/voters/profile
 * @desc    Get current student's profile
 * @access  Private (Student)
 */
const getProfile = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user.id);

  if (!student) {
    return sendError(res, 'Student not found', 404);
  }

  sendSuccess(res, { student });
});

/**
 * @route   PUT /api/voters/profile
 * @desc    Update student profile (rollNumber, cgpa, etc.)
 * @access  Private (Student)
 * @body    { rollNumber, cgpa, hasActiveBacklogs }
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { rollNumber, cgpa, hasActiveBacklogs } = req.body;

  const updateData = {};
  if (rollNumber !== undefined) updateData.rollNumber = rollNumber;
  if (cgpa !== undefined) updateData.cgpa = cgpa;
  if (hasActiveBacklogs !== undefined) updateData.hasActiveBacklogs = hasActiveBacklogs;

  const student = await Student.findByIdAndUpdate(
    req.user.id,
    updateData,
    { new: true, runValidators: true }
  );

  if (!student) {
    return sendError(res, 'Student not found', 404);
  }

  sendSuccess(res, { student }, 200, 'Profile updated successfully');
});

/**
 * @route   GET /api/voters/elections
 * @desc    List active elections the student is eligible for
 * @access  Private (Student)
 */
const getActiveElections = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user.id);

  if (!student) {
    return sendError(res, 'Student not found', 404);
  }

  // Get elections that are currently active
  const elections = await Election.find({ phase: 'active' })
    .sort({ startTime: -1 })
    .populate('createdBy', 'username email');

  sendSuccess(res, {
    elections,
    voter: {
      isWalletLinked: student.isWalletLinked,
      isWhitelisted: student.isWhitelisted,
    },
  });
});

/**
 * @route   GET /api/voters/status/:electionId
 * @desc    Check whitelist & voting eligibility for a specific election
 * @access  Private (Student)
 */
const getVoterStatus = asyncHandler(async (req, res) => {
  const { electionId } = req.params;

  const student = await Student.findById(req.user.id);
  if (!student) {
    return sendError(res, 'Student not found', 404);
  }

  const election = await Election.findById(electionId);
  if (!election) {
    return sendError(res, 'Election not found', 404);
  }

  sendSuccess(res, {
    election: {
      id: election._id,
      title: election.title,
      phase: election.phase,
    },
    voter: {
      isWalletLinked: student.isWalletLinked,
      isWhitelisted: student.isWhitelisted,
      walletAddress: student.walletAddress,
      canVote:
        student.isWalletLinked &&
        student.isWhitelisted &&
        election.phase === 'active',
    },
  });
});

module.exports = {
  getProfile,
  updateProfile,
  getActiveElections,
  getVoterStatus,
};
