const Election = require('../models/Election');
const CandidateInfo = require('../models/CandidateInfo');
const Student = require('../models/Student');
const { sendSuccess, sendError, asyncHandler } = require('../utils/api');

// ─── Election Management ────────────────────────────────────────────────────

/**
 * @route   POST /api/admin/elections
 * @desc    Create a new election
 * @access  Private (Admin)
 * @body    { title, description, startTime, endTime, contractAddress }
 */
const createElection = asyncHandler(async (req, res) => {
  const { title, description, startTime, endTime, contractAddress } = req.body;

  const election = await Election.create({
    title,
    description,
    startTime,
    endTime,
    contractAddress,
    createdBy: req.user.id,
  });

  console.log(`🗳️  Election created: ${title}`);
  sendSuccess(res, { election }, 201, 'Election created successfully');
});

/**
 * @route   GET /api/admin/elections
 * @desc    List all elections
 * @access  Private (Admin)
 */
const getElections = asyncHandler(async (req, res) => {
  const elections = await Election.find()
    .sort({ createdAt: -1 })
    .populate('createdBy', 'username email');

  sendSuccess(res, { elections });
});

/**
 * @route   GET /api/admin/elections/:id
 * @desc    Get a single election by ID
 * @access  Private (Admin)
 */
const getElectionById = asyncHandler(async (req, res) => {
  const election = await Election.findById(req.params.id).populate(
    'createdBy',
    'username email'
  );

  if (!election) {
    return sendError(res, 'Election not found', 404);
  }

  // Get candidate count for this election
  const candidateCount = await CandidateInfo.countDocuments({
    electionId: election._id,
  });

  sendSuccess(res, { election, candidateCount });
});

/**
 * @route   PUT /api/admin/elections/:id
 * @desc    Update election (phase, times, contract address)
 * @access  Private (Admin)
 * @body    { phase, startTime, endTime, contractAddress }
 */
const updateElection = asyncHandler(async (req, res) => {
  const { phase, startTime, endTime, contractAddress } = req.body;

  const updateData = {};
  if (phase) updateData.phase = phase;
  if (startTime) updateData.startTime = startTime;
  if (endTime) updateData.endTime = endTime;
  if (contractAddress) updateData.contractAddress = contractAddress;

  const election = await Election.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );

  if (!election) {
    return sendError(res, 'Election not found', 404);
  }

  console.log(
    `📝 Election updated: ${election.title} → Phase: ${election.phase}`
  );
  sendSuccess(res, { election }, 200, 'Election updated successfully');
});

// ─── Candidate Management ───────────────────────────────────────────────────

/**
 * @route   GET /api/admin/elections/:id/candidates
 * @desc    List all candidates for an election
 * @access  Private (Admin)
 */
const getElectionCandidates = asyncHandler(async (req, res) => {
  const candidates = await CandidateInfo.find({
    electionId: req.params.id,
  }).sort({ createdAt: -1 });

  sendSuccess(res, { candidates });
});

/**
 * @route   POST /api/admin/candidates
 * @desc    Register a new candidate (with academic validation)
 * @access  Private (Admin)
 * @body    { name, rollNumber, email, walletAddress, position, bio, manifesto, cgpa, hasActiveBacklogs, electionId }
 */
const registerCandidate = asyncHandler(async (req, res) => {
  const {
    name,
    rollNumber,
    email,
    walletAddress,
    position,
    bio,
    manifesto,
    cgpa,
    hasActiveBacklogs,
    electionId,
  } = req.body;

  // Academic eligibility check: CGPA >= 7.5 and no active backlogs
  if (cgpa < 7.5) {
    return sendError(
      res,
      'Candidate must have a CGPA of at least 7.5',
      400
    );
  }

  if (hasActiveBacklogs) {
    return sendError(res, 'Candidate must not have active backlogs', 400);
  }

  // Verify election exists
  const election = await Election.findById(electionId);
  if (!election) {
    return sendError(res, 'Election not found', 404);
  }

  const candidate = await CandidateInfo.create({
    name,
    rollNumber,
    email,
    walletAddress,
    position,
    bio,
    manifesto,
    cgpa,
    hasActiveBacklogs,
    electionId,
  });

  console.log(`👤 Candidate registered: ${name} for ${election.title}`);
  sendSuccess(res, { candidate }, 201, 'Candidate registered successfully');
});

/**
 * @route   PUT /api/admin/candidates/:id/approve
 * @desc    Approve or reject a candidate
 * @access  Private (Admin)
 * @body    { isApproved }
 */
const approveCandidate = asyncHandler(async (req, res) => {
  const { isApproved } = req.body;

  if (typeof isApproved !== 'boolean') {
    return sendError(res, 'isApproved must be a boolean value', 400);
  }

  const candidate = await CandidateInfo.findByIdAndUpdate(
    req.params.id,
    { isApproved },
    { new: true }
  );

  if (!candidate) {
    return sendError(res, 'Candidate not found', 404);
  }

  const status = isApproved ? 'approved' : 'rejected';
  console.log(`✅ Candidate ${status}: ${candidate.name}`);
  sendSuccess(res, { candidate }, 200, `Candidate ${status} successfully`);
});

// ─── Student / Voter Management ─────────────────────────────────────────────

/**
 * @route   GET /api/admin/students
 * @desc    List all registered students (with search & pagination)
 * @access  Private (Admin)
 */
const getStudents = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, search } = req.query;

  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { rollNumber: { $regex: search, $options: 'i' } },
    ];
  }

  const students = await Student.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Student.countDocuments(query);

  sendSuccess(res, {
    students,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

/**
 * @route   POST /api/admin/students/whitelist
 * @desc    Batch update whitelist status for students
 * @access  Private (Admin)
 * @body    { studentIds: [...], isWhitelisted: true/false }
 */
const batchWhitelist = asyncHandler(async (req, res) => {
  const { studentIds, isWhitelisted } = req.body;

  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    return sendError(res, 'studentIds must be a non-empty array', 400);
  }

  if (typeof isWhitelisted !== 'boolean') {
    return sendError(res, 'isWhitelisted must be a boolean value', 400);
  }

  const result = await Student.updateMany(
    { _id: { $in: studentIds } },
    { isWhitelisted }
  );

  console.log(
    `📋 Whitelist updated: ${result.modifiedCount} students → ${isWhitelisted}`
  );
  sendSuccess(
    res,
    { modifiedCount: result.modifiedCount },
    200,
    `${result.modifiedCount} students whitelist status updated`
  );
});

// ─── Dashboard ──────────────────────────────────────────────────────────────

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get dashboard statistics
 * @access  Private (Admin)
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalStudents,
    totalElections,
    totalCandidates,
    activeElections,
    whitelistedStudents,
    linkedWallets,
  ] = await Promise.all([
    Student.countDocuments(),
    Election.countDocuments(),
    CandidateInfo.countDocuments(),
    Election.countDocuments({ phase: 'active' }),
    Student.countDocuments({ isWhitelisted: true }),
    Student.countDocuments({ isWalletLinked: true }),
  ]);

  sendSuccess(res, {
    stats: {
      totalStudents,
      totalElections,
      totalCandidates,
      activeElections,
      whitelistedStudents,
      linkedWallets,
    },
  });
});

module.exports = {
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
};
