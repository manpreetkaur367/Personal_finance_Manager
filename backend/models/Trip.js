const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'accepted',
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    joinedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: true }
);

const expenseParticipantSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    share: {
      type: Number,
      default: 1,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    amount: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      default: 'Other',
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    payer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: {
      type: String,
      default: '',
    },
    splitType: {
      type: String,
      enum: ['equal', 'custom', 'percentage', 'shares'],
      default: 'equal',
    },
    participants: [expenseParticipantSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

const itinerarySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    place: {
      type: String,
      default: '',
      trim: true,
    },
    date: {
      type: String,
      default: '',
    },
    time: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    cost: {
      type: Number,
      default: 0,
    },
    mapUrl: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const settlementSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending',
    },
    note: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

const tripSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Trip name is required'],
      trim: true,
    },
    destination: {
      type: String,
      required: [true, 'Destination is required'],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    description: {
      type: String,
      default: '',
    },
    budget: {
      type: Number,
      default: 0,
      min: 0,
    },
    members: [memberSchema],
    expenses: [expenseSchema],
    itinerary: [itinerarySchema],
    settlements: [settlementSchema],
  },
  { timestamps: true }
);

tripSchema.index({ owner: 1, startDate: -1 });
tripSchema.index({ 'members.user': 1 });

module.exports = mongoose.model('Trip', tripSchema);
