const express = require('express');
const { check } = require('express-validator');
const {
  getTransactions,
  createTransaction,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} = require('../controllers/transactionController');
const protect = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getTransactions);
router.post(
  '/',
  [
    check('title', 'Title is required').notEmpty().trim(),
    check('amount', 'Amount must be greater than zero').isFloat({ min: 0.01 }),
    check('type', 'Type is required').isIn(['income', 'expense']),
    check('category', 'Category is required').notEmpty().trim(),
    check('date', 'Date is required').notEmpty(),
    check('paymentMethod', 'Payment method is required').notEmpty().trim(),
  ],
  createTransaction
);
router.get('/:id', getTransactionById);
router.put(
  '/:id',
  [
    check('title', 'Title is required').optional().notEmpty().trim(),
    check('amount', 'Amount must be greater than zero').optional().isFloat({ min: 0.01 }),
    check('type', 'Type is required').optional().isIn(['income', 'expense']),
    check('category', 'Category is required').optional().notEmpty().trim(),
    check('date', 'Date is required').optional().notEmpty(),
    check('paymentMethod', 'Payment method is required').optional().notEmpty().trim(),
  ],
  updateTransaction
);
router.delete('/:id', deleteTransaction);

module.exports = router;
