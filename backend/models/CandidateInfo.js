const mongoose = require('mongoose');

/**
 * CandidateInfo Schema
 * Off-chain candidate data — complements on-chain registration
 * Academic eligibility: CGPA >= 7.5, no active backlogs
 */
const candidateInfoSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Candidate name is required'],
      trim: true,
    },
    rollNumber: {
      type: String,
      required: [true, 'Roll number is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
    },
    walletAddress: {
      type: String,
      required: [true, 'Wallet address is required'],
      trim: true,
    },
    position: {
      type: String,
      required: [true, 'Position is required'],
      trim: true,
    },
    bio: {
      type: String,
      maxlength: 500,
      trim: true,
    },
    manifesto: {
      type: String,
      maxlength: 2000,
      trim: true,
    },
    photo: {
      type: String,
      default: null,
    },
    cgpa: {
      type: Number,
      required: [true, 'CGPA is required'],
      min: 0,
      max: 10,
    },
    hasActiveBacklogs: {
      type: Boolean,
      required: true,
      default: false,
    },
    electionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Election',
      required: [true, 'Election ID is required'],
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: one candidate per wallet per election
candidateInfoSchema.index({ walletAddress: 1, electionId: 1 }, { unique: true });
candidateInfoSchema.index({ electionId: 1, isApproved: 1 });

module.exports = mongoose.model('CandidateInfo', candidateInfoSchema);
