const mongoose = require('mongoose');

const clinicianRatingSchema = new mongoose.Schema(
  {
    clinicianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinician',
      required: true,
      index: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Parent',
      required: true,
      index: true,
    },
    /** Sequential live-session rating number for this child (1, 2, 3, …). */
    day: { type: Number, required: true, min: 1 },
    /** Clinician label for when the live session occurred (e.g. Tuesday). */
    dayValue: { type: String, required: true, trim: true, maxlength: 100 },
    rating: { type: Number, required: true, min: 0, max: 9 },
    ratedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

clinicianRatingSchema.index({ clinicianId: 1, parentId: 1, day: 1 }, { unique: true });

const ClinicianRating = mongoose.model('ClinicianRating', clinicianRatingSchema);

module.exports = { ClinicianRating };
