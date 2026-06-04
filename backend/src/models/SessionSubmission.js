const mongoose = require('mongoose')
const { n: TOTAL_SESSIONS } = require('../config/stage')

const sessionSubmissionSchema = new mongoose.Schema({
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent',
    required: true,
  },

  clinicianId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinician',
    required: true,
  },

  sessionNumber: {
    type: Number,
    required: true,
    min: 1,
    max: TOTAL_SESSIONS,
  },

  StutteringSeverityRating: {
    type: Number,
    required: true,
    min: 0,
    max: 9,
  },

  SpeechNaturalnessRating: {
    type: Number,
    required: true,
    min: 1,
    max: 9,
  },

  startedAt: {
    type: Date,
    default: Date.now,
  },

  submittedAt: {
    type: Date,
    default: null,
  },

  autoSubmitted: {
    type: Boolean,
    default: false,
  },
})

sessionSubmissionSchema.index(
  { parentId: 1, sessionNumber: 1 },
  { unique: true }
)

const SessionSubmission = mongoose.model(
  'SessionSubmission',
  sessionSubmissionSchema
)

module.exports = { SessionSubmission }