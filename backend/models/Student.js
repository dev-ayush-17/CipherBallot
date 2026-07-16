const mongoose = require('mongoose');

/**
 * Student Schema
 * Core voter identity model — maps college identity to blockchain wallet
 */
const studentSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    rollNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    walletAddress: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    isWalletLinked: {
      type: Boolean,
      default: false,
    },
    isWhitelisted: {
      type: Boolean,
      default: false,
    },
    cgpa: {
      type: Number,
      min: 0,
      max: 10,
    },
    hasActiveBacklogs: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast lookups
studentSchema.index({ walletAddress: 1 });
studentSchema.index({ email: 1 });

module.exports = mongoose.model('Student', studentSchema);
