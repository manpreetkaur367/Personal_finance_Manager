const incomeCategories = [
  'Salary',
  'Freelancing',
  'Business',
  'Investments',
  'Gifts',
  'Other Income',
];

const expenseCategories = [
  'Food & Groceries',
  'Rent',
  'Shopping',
  'Transportation',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Entertainment',
  'Travel',
  'Subscriptions',
  'Personal Care',
  'Other Expenses',
];

const paymentMethods = ['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Bank Transfer', 'Wallet'];

const categoryOptions = {
  income: incomeCategories,
  expense: expenseCategories,
};

const getCategoriesForType = (type) => categoryOptions[type] || [...incomeCategories, ...expenseCategories];

const isValidDate = (value) => {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

module.exports = {
  incomeCategories,
  expenseCategories,
  paymentMethods,
  categoryOptions,
  getCategoriesForType,
  isValidDate,
};
