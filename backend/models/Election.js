const mongoose = require('mongoose');

/**
 * Election Schema
 * Off-chain election metadata — tracks lifecycle phases
 */
const electionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Election title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required'],
    },
    phase: {
      type: String,
      enum: ['setup', 'active', 'ended'],
      default: 'setup',
    },
    contractAddress: {
      type: String,
      default: null,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Validate endTime > startTime
electionSchema.pre('validate', function (next) {
  if (this.endTime <= this.startTime) {
    this.invalidate('endTime', 'End time must be after start time');
  }
  next();
});

module.exports = mongoose.model('Election', electionSchema);
