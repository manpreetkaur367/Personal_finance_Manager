import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDownRight, ArrowUpRight, PiggyBank, Wallet } from 'lucide-react';
import SummaryCard from '../components/dashboard/SummaryCard';
import IncomeExpenseChart from '../components/dashboard/IncomeExpenseChart';
import CategoryChart from '../components/dashboard/CategoryChart';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import MainLayout from '../components/layout/MainLayout';
import TransactionForm from '../components/transactions/TransactionForm';
import analyticsService from '../services/analyticsService';
import transactionService from '../services/transactionService';
import budgetService from '../services/budgetService';
import { useAuth } from '../context/AuthContext';
import formatCurrency from '../utils/formatCurrency';

const currentDate = new Date();
const monthOptions = Array.from({ length: 12 }, (_, index) => ({
  value: index + 1,
  label: new Date(2024, index, 1).toLocaleString('en-IN', { month: 'long' }),
}));

const comparisonText = (current, previous) => {
  if (!previous) return current ? 'New activity this month' : 'No change from last month';
  const change = ((current - previous) / previous) * 100;
  return `${change > 0 ? '+' : ''}${change.toFixed(1)}% vs last month`;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [summary, setSummary] = useState({ all: null, current: null, previous: null });
  const [transactions, setTransactions] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [quickAddType, setQuickAddType] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const loadDashboard = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setError('');
      const previousDate = new Date(selectedYear, selectedMonth - 2, 1);
      const [allSummaryRes, currentSummaryRes, previousSummaryRes, txRes, monthlyRes, categoryRes] = await Promise.all([
        analyticsService.getSummary(),
        analyticsService.getSummary({ month: selectedMonth, year: selectedYear }),
        analyticsService.getSummary({ month: previousDate.getMonth() + 1, year: previousDate.getFullYear() }),
        transactionService.getTransactions({ limit: 6, sortBy: 'date', sortOrder: 'desc' }),
        analyticsService.getMonthly({ year: selectedYear }),
        analyticsService.getCategories({ month: selectedMonth, year: selectedYear }),
      ]);

      setSummary({
        all: allSummaryRes.summary,
        current: currentSummaryRes.summary,
        previous: previousSummaryRes.summary,
      });
      setTransactions(txRes.transactions || []);
      setMonthlyData((monthlyRes.data || []).map((entry) => ({
        month: monthOptions[Number(entry.month) - 1]?.label.slice(0, 3) || '—',
        income: Number(entry.income) || 0,
        expenses: Number(entry.expenses) || 0,
      })));
      setCategoryData(categoryRes.data || []);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load your financial overview.');
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const currentSummary = summary.current || {};
  const previousSummary = summary.previous || {};
  const allSummary = summary.all || {};
  const summaryCards = [
    { label: 'Net worth', value: formatCurrency(allSummary.netSavings || 0), subtitle: 'All-time income minus expenses', accent: 'emerald', icon: Wallet, highlight: true },
    { label: 'Monthly income', value: formatCurrency(currentSummary.totalIncome || 0), subtitle: comparisonText(currentSummary.totalIncome || 0, previousSummary.totalIncome || 0), accent: 'slate', icon: ArrowDownRight },
    { label: 'Total spent', value: formatCurrency(currentSummary.totalExpenses || 0), subtitle: comparisonText(currentSummary.totalExpenses || 0, previousSummary.totalExpenses || 0), accent: 'rose', icon: ArrowUpRight },
    { label: 'Savings rate', value: `${(currentSummary.savingsRate || 0).toFixed(1)}%`, subtitle: `Net savings ${formatCurrency(currentSummary.netSavings || 0)} this month`, accent: 'violet', icon: PiggyBank },
  ];

  const handleQuickAdd = async (payload) => {
    try {
      setSaving(true);
      setError('');
      await transactionService.createTransaction({ ...payload, amount: Number(payload.amount) });
      setQuickAddType('');
      setNotice(`${payload.type === 'income' ? 'Income' : 'Expense'} added successfully.`);
      await loadDashboard(false);
    } catch (saveError) {
      setError(saveError.message || 'Unable to save this transaction.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout title={`Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, ${user?.name?.split(' ')[0] || 'there'} 👋`}>
      <div className="dashboard-filters">
        <label>
          <span>Summary month</span>
          <select aria-label="Summary month" value={selectedMonth} onChange={(event) => setSelectedMonth(Number(event.target.value))}>
            {monthOptions.map((month) => <option key={month.value} value={month.value}>{month.label}</option>)}
          </select>
        </label>
        <label>
          <span>Year</span>
          <select aria-label="Summary year" value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value))}>
            {Array.from({ length: 7 }, (_, index) => currentDate.getFullYear() - index).map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </label>
      </div>

      {notice && <div className="notice success-notice" role="status">{notice}</div>}
      {error && <div className="notice error-notice" role="alert">{error}</div>}

      {loading ? (
        <section className="stats-grid" aria-label="Loading dashboard">
          {Array.from({ length: 4 }, (_, index) => <div className="summary-card skeleton-card" key={index} />)}
        </section>
      ) : (
        <>
          <section className="stats-grid">
            {summaryCards.map((card) => <SummaryCard key={card.label} {...card} />)}
          </section>

          <section className="dashboard-main-grid">
            <IncomeExpenseChart data={monthlyData} year={selectedYear} onYearChange={setSelectedYear} years={Array.from({ length: 7 }, (_, index) => currentDate.getFullYear() - index)} />
            <CategoryChart data={categoryData} />
          </section>

          <section className="dashboard-lower-grid">
            <RecentTransactions transactions={transactions} onViewAll={() => navigate('/transactions')} />
            <div className="panel-card dashboard-goals-card">
              <div className="card-header split-header"><div><h3>Budget goals</h3><small>{monthOptions[selectedMonth - 1]?.label} spending limits</small></div><button className="text-button" onClick={() => navigate('/budgets')}>Manage <span aria-hidden="true">→</span></button></div>
              <BudgetGoals month={selectedMonth} year={selectedYear} />
            </div>
          </section>

          <section className="panel-card quick-actions-card dashboard-quick-actions">
            <div className="card-header split-header"><h3>Quick actions</h3></div>
            <div className="quick-action-buttons">
              <button className="primary-button" onClick={() => { setNotice(''); setQuickAddType('income'); }}>Add income</button>
              <button className="secondary-button" onClick={() => { setNotice(''); setQuickAddType('expense'); }}>Add expense</button>
            </div>
            {quickAddType && (
              <div className="quick-add-form">
                <h4>New {quickAddType}</h4>
                <TransactionForm
                  key={quickAddType}
                  initialData={{ type: quickAddType, category: quickAddType === 'income' ? 'Salary' : 'Food & Groceries' }}
                  onSubmit={handleQuickAdd}
                  onCancel={() => setQuickAddType('')}
                  isLoading={saving}
                />
              </div>
            )}
          </section>
        </>
      )}
    </MainLayout>
  );
};

const BudgetGoals = ({ month, year }) => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    budgetService.getBudgets({ month, year })
      .then((response) => { if (active) setBudgets(response.budgets || []); })
      .catch((loadError) => { if (active) setError(loadError.message || 'Unable to load budgets.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [month, year]);

  if (loading) return <div className="goals-empty">Loading budget goals…</div>;
  if (error) return <div className="goals-empty" role="alert">{error}</div>;
  if (!budgets.length) return <div className="goals-empty">No budgets for this month yet. Create one to track spending limits.</div>;

  return <div className="dashboard-goals-list">{budgets.slice(0, 5).map((budget, index) => {
    const amount = Number(budget.amount) || 0;
    const spent = Number(budget.spent) || 0;
    const progress = amount > 0 ? Math.min(100, (spent / amount) * 100) : 0;
    return <div className="dashboard-goal" key={budget._id}>
      <div className="dashboard-goal-heading"><strong>{budget.category}</strong><span>{formatCurrency(spent)} / {formatCurrency(amount)}</span></div>
      <div className="dashboard-goal-track" aria-label={`${budget.category} budget ${progress.toFixed(0)}% used`}><span className={`goal-color-${index % 4}`} style={{ width: `${progress}%` }} /></div>
      <small>{progress.toFixed(0)}% used · {formatCurrency(Math.max(0, amount - spent))} remaining</small>
    </div>;
  })}</div>;
};

export default Dashboard;
