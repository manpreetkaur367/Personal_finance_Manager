const { validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');
const { getCategoriesForType, paymentMethods } = require('../validators/validation');

const parseDateRange = (startDate, endDate) => {
  const range = {};
  if (startDate) range.$gte = new Date(`${startDate}T00:00:00.000Z`);
  if (endDate) {
    const endExclusive = new Date(`${endDate}T00:00:00.000Z`);
    endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
    range.$lt = endExclusive;
  }

  return Object.keys(range).length ? range : {};
};

const buildTransactionQuery = ({ userId, search, type, category, startDate, endDate, month, year }) => {
  const query = { user: userId };

  if (search) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.title = { $regex: escapedSearch, $options: 'i' };
  }

  if (type && ['income', 'expense'].includes(type)) {
    query.type = type;
  }

  if (category) {
    query.category = category;
  }

  if (month) {
    const monthNumber = Number(month);
    if (monthNumber >= 1 && monthNumber <= 12) {
      query.$expr = {
        $eq: [{ $month: '$date' }, monthNumber],
      };
    }
  }

  if (year) {
    const yearNumber = Number(year);
    if (yearNumber >= 2000) {
      query.date = {
        ...query.date,
        $gte: new Date(`${yearNumber}-01-01T00:00:00.000Z`),
        $lt: new Date(`${yearNumber + 1}-01-01T00:00:00.000Z`),
      };
    }
  }

  if (startDate || endDate) {
    query.date = {
      ...query.date,
      ...parseDateRange(startDate, endDate),
    };
  }

  return query;
};

const getTransactions = async (req, res, next) => {
  try {
    const {
      search = '',
      type,
      category,
      startDate,
      endDate,
      month,
      year,
      sortBy = 'date',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = req.query;

    const query = buildTransactionQuery({
      userId: req.user._id,
      search,
      type,
      category,
      startDate,
      endDate,
      month,
      year,
    });

    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const requestedPage = Number.parseInt(page, 10);
    const requestedLimit = Number.parseInt(limit, 10);
    const pageNumber = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
    const limitNumber = Number.isFinite(requestedLimit) ? Math.min(100, Math.max(1, requestedLimit)) : 10;
    const allowedSortFields = ['date', 'amount', 'title', 'createdAt'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'date';

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .sort({ [safeSortBy]: sortDirection })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .lean();

    return res.status(200).json({
      success: true,
      transactions,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    next(error);
  }
};

const createTransaction = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
      });
    }

    const { title, amount, type, category, date, paymentMethod, notes } = req.body;
    const validCategories = getCategoriesForType(type);

    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Please choose a valid ${type} category.`,
      });
    }

    const transaction = await Transaction.create({
      user: req.user._id,
      title: title.trim(),
      amount: Number(amount),
      type,
      category,
      date: new Date(date),
      paymentMethod,
      notes: notes || '',
    });

    return res.status(201).json({
      success: true,
      transaction,
      message: 'Transaction created successfully.',
    });
  } catch (error) {
    next(error);
  }
};

const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found.',
      });
    }

    return res.status(200).json({
      success: true,
      transaction,
    });
  } catch (error) {
    next(error);
  }
};

const updateTransaction = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
      });
    }

    const existingTransaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!existingTransaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found.',
      });
    }

    const { title, amount, type, category, date, paymentMethod, notes } = req.body;
    const nextType = type || existingTransaction.type;
    const validCategories = getCategoriesForType(nextType);

    if (category && !validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Please choose a valid ${nextType} category.`,
      });
    }

    existingTransaction.title = title ? title.trim() : existingTransaction.title;
    existingTransaction.amount = amount ? Number(amount) : existingTransaction.amount;
    existingTransaction.type = nextType;
    existingTransaction.category = category || existingTransaction.category;
    existingTransaction.date = date ? new Date(date) : existingTransaction.date;
    existingTransaction.paymentMethod = paymentMethod || existingTransaction.paymentMethod;
    existingTransaction.notes = notes ?? existingTransaction.notes;

    const transaction = await existingTransaction.save();

    return res.status(200).json({
      success: true,
      transaction,
      message: 'Transaction updated successfully.',
    });
  } catch (error) {
    next(error);
  }
};

const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTransactions,
  createTransaction,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  paymentMethods,
};
