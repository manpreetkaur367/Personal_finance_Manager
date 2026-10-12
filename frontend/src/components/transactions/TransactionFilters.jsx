const TransactionFilters = ({ filters, onChange, onReset }) => (
  <div className="filter-row">
    <input
      type="text"
      aria-label="Search transactions"
      placeholder="Search by title"
      value={filters.search || ''}
      onChange={(event) => onChange('search', event.target.value)}
    />
    <select aria-label="Filter by type" value={filters.type || ''} onChange={(event) => onChange('type', event.target.value)}>
      <option value="">All Types</option>
      <option value="income">Income</option>
      <option value="expense">Expense</option>
    </select>
    <select aria-label="Filter by category" value={filters.category || ''} onChange={(event) => onChange('category', event.target.value)}>
      <option value="">All Categories</option>
      <option value="Salary">Salary</option>
      <option value="Freelancing">Freelancing</option>
      <option value="Business">Business</option>
      <option value="Investments">Investments</option>
      <option value="Gifts">Gifts</option>
      <option value="Other Income">Other Income</option>
      <option value="Food & Groceries">Food & Groceries</option>
      <option value="Rent">Rent</option>
      <option value="Shopping">Shopping</option>
      <option value="Transportation">Transportation</option>
      <option value="Bills & Utilities">Bills & Utilities</option>
      <option value="Healthcare">Healthcare</option>
      <option value="Education">Education</option>
      <option value="Entertainment">Entertainment</option>
      <option value="Travel">Travel</option>
      <option value="Subscriptions">Subscriptions</option>
      <option value="Personal Care">Personal Care</option>
      <option value="Other Expenses">Other Expenses</option>
    </select>
    <input
      type="date"
      aria-label="Start date"
      value={filters.startDate || ''}
      onChange={(event) => onChange('startDate', event.target.value)}
    />
    <input
      type="date"
      aria-label="End date"
      value={filters.endDate || ''}
      onChange={(event) => onChange('endDate', event.target.value)}
    />
    <button className="secondary-button" onClick={onReset} type="button">
      Reset
    </button>
  </div>
);

export default TransactionFilters;
