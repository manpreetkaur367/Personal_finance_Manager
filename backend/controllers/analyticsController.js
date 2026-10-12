const Transaction = require('../models/Transaction');

const normalizeDateValue = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const buildDateFilter = (reqQuery = {}) => {
  const { month, year, startDate, endDate } = reqQuery;
  const dateFilter = {};

  const monthNumber = Number(month);
  const yearNumber = Number(year) || new Date().getFullYear();
  if (month && monthNumber >= 1 && monthNumber <= 12 && yearNumber >= 2000 && yearNumber <= 9999) {
    dateFilter.$gte = new Date(Date.UTC(yearNumber, monthNumber - 1, 1));
    dateFilter.$lt = new Date(Date.UTC(yearNumber, monthNumber, 1));
  } else if (year && yearNumber >= 2000 && yearNumber <= 9999) {
    dateFilter.$gte = new Date(Date.UTC(yearNumber, 0, 1));
    dateFilter.$lt = new Date(Date.UTC(yearNumber + 1, 0, 1));
  }

  const fromDate = normalizeDateValue(startDate);
  const toDate = normalizeDateValue(endDate);
  if (fromDate && (!dateFilter.$gte || fromDate > dateFilter.$gte)) dateFilter.$gte = fromDate;
  if (toDate) {
    const exclusiveEnd = new Date(toDate);
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(endDate))) {
      exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() + 1);
      if (!dateFilter.$lt || exclusiveEnd < dateFilter.$lt) dateFilter.$lt = exclusiveEnd;
    } else if (!dateFilter.$lt || toDate < dateFilter.$lt) {
      dateFilter.$lte = toDate;
    }
  }

  return dateFilter;
};

const getSummary = async (req, res, next) => {
  try {
    const dateFilter = buildDateFilter(req.query);
    const query = { user: req.user._id };

    if (Object.keys(dateFilter).length > 0) {
      query.date = dateFilter;
    }

    const [totals = { totalIncome: 0, totalExpenses: 0, transactionCount: 0 }] = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalIncome: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } },
          totalExpenses: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } },
          transactionCount: { $sum: 1 },
        },
      },
    ]);

    const totalIncome = Number(totals.totalIncome) || 0;
    const totalExpenses = Number(totals.totalExpenses) || 0;

    const netSavings = totalIncome - totalExpenses;
    const monthlyIncome = totalIncome;
    const monthlyExpenses = totalExpenses;
    const savingsRate = monthlyIncome > 0 ? (netSavings / monthlyIncome) * 100 : 0;

    return res.status(200).json({
      success: true,
      summary: {
        totalIncome,
        totalExpenses,
        netSavings,
        monthlyIncome,
        monthlyExpenses,
        savingsRate,
        transactionCount: totals.transactionCount || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getMonthlyAnalytics = async (req, res, next) => {
  try {
    const requestedYear = Number(req.query.year);
    const currentYear = requestedYear >= 2000 && requestedYear <= 9999 ? requestedYear : new Date().getFullYear();
    const data = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          date: {
            $gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
            $lt: new Date(`${currentYear + 1}-01-01T00:00:00.000Z`),
          },
        },
      },
      {
        $group: {
          _id: { month: { $month: '$date' }, type: '$type' },
          total: { $sum: '$amount' },
        },
      },
      {
        $group: {
          _id: '$_id.month',
          income: {
            $sum: { $cond: [{ $eq: ['$_id.type', 'income'] }, '$total', 0] },
          },
          expenses: {
            $sum: { $cond: [{ $eq: ['$_id.type', 'expense'] }, '$total', 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const months = Array.from({ length: 12 }, (_, index) => index + 1);
    const result = months.map((month) => {
      const record = data.find((entry) => entry._id === month) || { income: 0, expenses: 0 };
      return {
        month,
        income: Number(record.income) || 0,
        expenses: Number(record.expenses) || 0,
      };
    });

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getCategoryBreakdown = async (req, res, next) => {
  try {
    const match = { user: req.user._id, type: 'expense' };
    const dateFilter = buildDateFilter(req.query);
    if (Object.keys(dateFilter).length) match.date = dateFilter;

    const categories = await Transaction.aggregate([
      { $match: match },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
    ]);

    return res.status(200).json({
      success: true,
      data: categories.map((item) => ({
        category: item._id,
        total: Number(item.total),
      })),
    });
  } catch (error) {
    next(error);
  }
};

const getTrendData = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const requestedMonth = Number(month);
    const requestedYear = Number(year);
    const targetMonth = requestedMonth >= 1 && requestedMonth <= 12 ? requestedMonth : new Date().getMonth() + 1;
    const targetYear = requestedYear >= 2000 && requestedYear <= 9999 ? requestedYear : new Date().getFullYear();
    const rangeStart = new Date(Date.UTC(targetYear, targetMonth - 1, 1));
    const rangeEnd = new Date(Date.UTC(targetYear, targetMonth, 1));

    const data = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          date: {
            $gte: rangeStart,
            $lt: rangeEnd,
          },
        },
      },
      {
        $group: {
          _id: { day: { $dayOfMonth: '$date' }, type: '$type' },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.day': 1 } },
    ]);

    const daysInMonth = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate();
    const result = Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      const income = data
        .filter((entry) => entry._id.day === day && entry._id.type === 'income')
        .reduce((sum, entry) => sum + entry.total, 0);
      const expenses = data
        .filter((entry) => entry._id.day === day && entry._id.type === 'expense')
        .reduce((sum, entry) => sum + entry.total, 0);

      return {
        day,
        income: Number(income),
        expenses: Number(expenses),
      };
    });

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSummary,
  getMonthlyAnalytics,
  getCategoryBreakdown,
  getTrendData,
};
