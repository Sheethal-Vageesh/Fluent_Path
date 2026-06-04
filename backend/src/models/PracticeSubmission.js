
const mongoose = require('mongoose');
const { n: TOTAL_SESSIONS } = require('../config/stage');

const practiceSubmissionSchema = new mongoose.Schema(
  {
    clinicianId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinician', required: true, index: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent', required: true, index: true },
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'StrategyAssignment', required: true, index: true },
    strategyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Strategy', required: true, index: true },

    sessionNumber: { type: Number, required: true, min: 1, max: TOTAL_SESSIONS },

    StutteringSeverityRating: { type: Number, required: false, min: 0, max: 9 },
    SpeechNaturalnessRating: { type: Number, required: false, min: 1, max: 9 },

    durationSeconds: { type: Number, required: true, min: 0, max: 24 * 60 * 60 },

    practiceVideoUrl: { type: String, trim: true, default: '' },
    submittedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

// ✅ FIXED HERE
practiceSubmissionSchema.index(
  { assignmentId: 1, sessionNumber: 1 },
  { unique: true }
);

const PracticeSubmission = mongoose.model('PracticeSubmission', practiceSubmissionSchema);

module.exports = { PracticeSubmission };

