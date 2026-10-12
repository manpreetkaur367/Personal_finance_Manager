import { useEffect, useState } from 'react';

const incomeCategories = ['Salary', 'Freelancing', 'Business', 'Investments', 'Gifts', 'Other Income'];
const expenseCategories = ['Food & Groceries', 'Rent', 'Shopping', 'Transportation', 'Bills & Utilities', 'Healthcare', 'Education', 'Entertainment', 'Travel', 'Subscriptions', 'Personal Care', 'Other Expenses'];

const defaultForm = {
  title: '',
  amount: '',
  type: 'expense',
  category: 'Food & Groceries',
  date: new Date().toISOString().slice(0, 10),
  paymentMethod: 'UPI',
  notes: '',
};

const getFormValues = (initialData) => ({ ...defaultForm, ...(initialData || {}) });

const TransactionForm = ({ initialData, onSubmit, onCancel, isLoading }) => {
  const [form, setForm] = useState(() => getFormValues(initialData));

  useEffect(() => {
    setForm(getFormValues(initialData));
  }, [initialData]);

  const categories = form.type === 'income' ? incomeCategories : expenseCategories;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'type' ? { category: value === 'income' ? incomeCategories[0] : expenseCategories[0] } : {}),
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <div className="field-row">
        <label>
          <span>Title</span>
          <input name="title" value={form.title} onChange={handleChange} required />
        </label>
        <label>
          <span>Amount</span>
          <input name="amount" type="number" min="0.01" step="0.01" value={form.amount} onChange={handleChange} required />
        </label>
      </div>

      <div className="field-row">
        <label>
          <span>Type</span>
          <select name="type" value={form.type} onChange={handleChange}>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </label>
        <label>
          <span>Category</span>
          <select name="category" value={form.category} onChange={handleChange}>
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="field-row">
        <label>
          <span>Date</span>
          <input name="date" type="date" value={form.date} onChange={handleChange} required />
        </label>
        <label>
          <span>Payment Method</span>
          <select name="paymentMethod" value={form.paymentMethod} onChange={handleChange}>
            <option value="UPI">UPI</option>
            <option value="Cash">Cash</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Debit Card">Debit Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Wallet">Wallet</option>
          </select>
        </label>
      </div>

      <label>
        <span>Notes</span>
        <textarea name="notes" rows="3" value={form.notes} onChange={handleChange} />
      </label>

      <div className="form-actions">
        {onCancel && (
          <button type="button" className="secondary-button" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="primary-button" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Transaction'}
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;
