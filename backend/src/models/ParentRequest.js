const mongoose = require('mongoose');

const parentRequestSchema = new mongoose.Schema(
  {
    clinicianId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinician', required: true, index: true },
    childName: { type: String, required: true, trim: true },
    // Accepts decimal ages, e.g., 4.2
    childAge: { type: Number, required: true, min: 1, max: 6 },
    parentName: { type: String, required: true, trim: true },
    email: { type: String,  trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending', index: true },
    childId: { type: String, unique: true, sparse: true, index: true }, // assigned on accept
  },
  { timestamps: true }
);

const ParentRequest = mongoose.model('ParentRequest', parentRequestSchema);

module.exports = { ParentRequest };

