const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');

const buildBudgetMeta = async (userId, budgets) => {
  if (!budgets.length) return [];
  const periods = budgets.map((budget) => new Date(Date.UTC(Number(budget.year), Number(budget.month) - 1, 1)).getTime());
  const firstPeriod = new Date(Math.min(...periods));
  const afterLastPeriod = new Date(Math.max(...periods));
  afterLastPeriod.setUTCMonth(afterLastPeriod.getUTCMonth() + 1);

  const expenses = await Transaction.find({
    user: userId,
    type: 'expense',
    date: {
      $gte: firstPeriod,
      $lt: afterLastPeriod,
    },
  }).lean();

  return budgets.map((budget) => {
    const monthStart = new Date(Date.UTC(Number(budget.year), Number(budget.month) - 1, 1));
    const nextMonthStart = new Date(Date.UTC(Number(budget.year), Number(budget.month), 1));
    const spent = expenses
      .filter((transaction) =>
        transaction.date >= monthStart
        && transaction.date < nextMonthStart
        && (budget.category === 'overall' || transaction.category === budget.category)
      )
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

    const remaining = Number(budget.amount) - spent;
    const utilisation = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

    return {
      ...budget,
      spent,
      remaining,
      utilisation,
      status: utilisation >= 100 ? 'exceeded' : utilisation >= 80 ? 'warning' : 'on-track',
    };
  });
};

const getBudgets = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const filters = { user: req.user._id };

    if (month) filters.month = Number(month);
    if (year) filters.year = Number(year);

    const budgets = await Budget.find(filters).sort({ year: -1, month: -1, category: 1 }).lean();
    const enrichedBudgets = await buildBudgetMeta(req.user._id, budgets);

    return res.status(200).json({
      success: true,
      budgets: enrichedBudgets,
    });
  } catch (error) {
    next(error);
  }
};

const createBudget = async (req, res, next) => {
  try {
    const { category, amount, month, year } = req.body;

    const parsedAmount = Number(amount);
    const parsedMonth = Number(month);
    const parsedYear = Number(year);
    if (typeof category !== 'string' || !category.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0 || !Number.isInteger(parsedMonth) || parsedMonth < 1 || parsedMonth > 12 || !Number.isInteger(parsedYear) || parsedYear < 2000) {
      return res.status(400).json({
        success: false,
        message: 'Category, amount, month and year are required.',
      });
    }

    const existingBudget = await Budget.findOne({
      user: req.user._id,
      category: category.trim(),
      month: parsedMonth,
      year: parsedYear,
    });

    if (existingBudget) {
      return res.status(409).json({
        success: false,
        message: 'A budget for this category and month already exists.',
      });
    }

    const budget = await Budget.create({
      user: req.user._id,
      category: category.trim(),
      amount: parsedAmount,
      month: parsedMonth,
      year: parsedYear,
    });

    return res.status(201).json({
      success: true,
      budget,
      message: 'Budget created successfully.',
    });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'A budget for this category and month already exists.' });
    next(error);
  }
};

const updateBudget = async (req, res, next) => {
  try {
    const { category, amount, month, year } = req.body;
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found.',
      });
    }

    if (category !== undefined) {
      if (typeof category !== 'string' || !category.trim()) return res.status(400).json({ success: false, message: 'Category is required.' });
      budget.category = category.trim();
    }
    if (amount !== undefined) {
      const parsedAmount = Number(amount);
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return res.status(400).json({ success: false, message: 'Budget amount must be greater than zero.' });
      budget.amount = parsedAmount;
    }
    if (month !== undefined) {
      const parsedMonth = Number(month);
      if (!Number.isInteger(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) return res.status(400).json({ success: false, message: 'Month must be between 1 and 12.' });
      budget.month = parsedMonth;
    }
    if (year !== undefined) {
      const parsedYear = Number(year);
      if (!Number.isInteger(parsedYear) || parsedYear < 2000) return res.status(400).json({ success: false, message: 'Year must be 2000 or later.' });
      budget.year = parsedYear;
    }

    await budget.save();

    return res.status(200).json({
      success: true,
      budget,
      message: 'Budget updated successfully.',
    });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'A budget for this category and month already exists.' });
    next(error);
  }
};

const deleteBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Budget deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
};
