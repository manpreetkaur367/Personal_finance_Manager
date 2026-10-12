const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      default: 'overall',
    },
    amount: {
      type: Number,
      required: [true, 'Budget amount is required'],
      min: [0.01, 'Budget amount must be greater than zero'],
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
      min: 2000,
    },
  },
  { timestamps: true }
);

budgetSchema.index({ user: 1, month: 1, year: 1, category: 1 }, { unique: true });
budgetSchema.index({ user: 1, category: 1, month: 1, year: 1 });

module.exports = mongoose.model('Budget', budgetSchema);
