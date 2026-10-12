const mongoose = require('mongoose');

const tripInvitationSchema = new mongoose.Schema({
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  role: { type: String, enum: ['admin', 'member'], default: 'member' },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'declined', 'expired'], default: 'pending' },
  tokenHash: { type: String, required: true, unique: true, select: false },
  expiresAt: { type: Date, required: true },
  acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  acceptedAt: { type: Date, default: null },
}, { timestamps: true });

tripInvitationSchema.index(
  { trip: 1, email: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } }
);

module.exports = mongoose.model('TripInvitation', tripInvitationSchema);
