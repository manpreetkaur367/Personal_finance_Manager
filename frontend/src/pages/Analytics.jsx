import { useCallback, useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowDownRight, ArrowUpRight, PiggyBank, ReceiptText } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import CategoryChart from '../components/dashboard/CategoryChart';
import SummaryCard from '../components/dashboard/SummaryCard';
import analyticsService from '../services/analyticsService';
import formatCurrency from '../utils/formatCurrency';

const now = new Date();
const monthOptions = Array.from({ length: 12 }, (_, index) => ({
  value: index + 1,
  label: new Date(2024, index, 1).toLocaleString('en-IN', { month: 'long' }),
}));
const years = Array.from({ length: 7 }, (_, index) => now.getFullYear() - index);
const initialSummary = { totalIncome: 0, totalExpenses: 0, netSavings: 0, transactionCount: 0, savingsRate: 0 };
const formatMoney = (value = 0) => formatCurrency(Number(value) || 0);
const tooltipStyle = {
  labelStyle: { color: '#07172d', fontWeight: 700 },
  itemStyle: { color: '#07172d', fontWeight: 600 },
  contentStyle: { background: '#f8fafc', border: '1px solid rgba(15, 23, 42, 0.12)', borderRadius: 10 },
};

const Analytics = () => {
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [summary, setSummary] = useState(initialSummary);
  const [monthly, setMonthly] = useState([]);
  const [categories, setCategories] = useState([]);
  const [daily, setDaily] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [summaryRes, monthlyRes, categoriesRes, trendsRes] = await Promise.all([
        analyticsService.getSummary({ month, year }),
        analyticsService.getMonthly({ year }),
        analyticsService.getCategories({ month, year }),
        analyticsService.getTrends({ month, year }),
      ]);
      setSummary(summaryRes.summary || initialSummary);
      setMonthly(monthlyRes.data || []);
      setCategories(categoriesRes.data || []);
      setDaily(trendsRes.data || []);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load analytics.');
      setSummary(initialSummary);
      setMonthly([]);
      setCategories([]);
      setDaily([]);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  const monthLabel = monthOptions[month - 1]?.label || '';
  const monthlyChartData = monthly.map((item) => ({
    ...item,
    label: monthOptions[(Number(item.month) || 1) - 1]?.label.slice(0, 3) || '—',
    income: Number(item.income) || 0,
    expenses: Number(item.expenses) || 0,
  }));
  const dailyChartData = daily.map((item) => ({
    ...item,
    label: String(item.day),
    income: Number(item.income) || 0,
    expenses: Number(item.expenses) || 0,
  }));
  const hasMonthlyData = monthlyChartData.some((item) => item.income || item.expenses);
  const hasDailyData = dailyChartData.some((item) => item.income || item.expenses);
  const cards = [
    { label: 'Monthly income', value: formatCurrency(summary.totalIncome), subtitle: `${summary.transactionCount} transactions in ${monthLabel}`, accent: 'emerald', icon: ArrowDownRight },
    { label: 'Total spent', value: formatCurrency(summary.totalExpenses), subtitle: `Expenses in ${monthLabel} ${year}`, accent: 'rose', icon: ArrowUpRight },
    { label: 'Net savings', value: formatCurrency(summary.netSavings), subtitle: 'Income minus expenses', accent: 'sky', icon: PiggyBank, highlight: true },
    { label: 'Savings rate', value: `${(Number(summary.savingsRate) || 0).toFixed(1)}%`, subtitle: 'Net savings as a share of income', accent: 'violet', icon: ReceiptText },
  ];

  return (
    <MainLayout title="Analytics">
      <div className="analytics-toolbar">
        <div><h2>Financial overview</h2><p>Track cash flow and spending patterns from your transactions.</p></div>
        <div className="analytics-period">
          <label><span>Month</span><select aria-label="Analytics month" value={month} onChange={(event) => setMonth(Number(event.target.value))}>
            {monthOptions.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
          </select></label>
          <label><span>Year</span><select aria-label="Analytics year" value={year} onChange={(event) => setYear(Number(event.target.value))}>
            {years.map((item) => <option value={item} key={item}>{item}</option>)}
          </select></label>
        </div>
      </div>

      {error && <div className="notice error-notice" role="alert">{error}</div>}

      {loading ? (
        <section className="stats-grid" aria-label="Loading analytics">
          {Array.from({ length: 4 }, (_, index) => <div className="summary-card skeleton-card" key={index} />)}
        </section>
      ) : (
        <>
          <section className="stats-grid analytics-stats">
            {cards.map((card) => <SummaryCard key={card.label} {...card} />)}
          </section>

          <section className="analytics-visual-grid">
            <div className="chart-card analytics-card">
              <div className="card-header"><div><h3>Cash flow overview</h3><small className="card-subtitle">Monthly income and expenses · {year}</small></div></div>
              {hasMonthlyData ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyChartData} margin={{ top: 12, right: 12, left: 4, bottom: 4 }}>
                    <defs>
                      <linearGradient id="analyticsIncome" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00d99a" stopOpacity={0.28} /><stop offset="100%" stopColor="#00d99a" stopOpacity={0.01} /></linearGradient>
                      <linearGradient id="analyticsExpense" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff5576" stopOpacity={0.18} /><stop offset="100%" stopColor="#ff5576" stopOpacity={0.01} /></linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(148, 163, 184, .14)" strokeDasharray="4 4" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: '#85859b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} tick={{ fill: '#85859b', fontSize: 10 }} axisLine={false} tickLine={false} width={68} />
                    <Tooltip cursor={false} formatter={(value) => formatMoney(value)} {...tooltipStyle} />
                    <Legend wrapperStyle={{ paddingTop: 12, color: '#85859b', fontSize: 11 }} />
                    <Area type="monotone" dataKey="income" name="Income" stroke="#00d99a" strokeWidth={2.5} fill="url(#analyticsIncome)" activeDot={{ r: 4 }} />
                    <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ff5576" strokeWidth={2.5} fill="url(#analyticsExpense)" activeDot={{ r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <div className="empty-chart-state"><p>No cash flow for {year}</p><small>Add transactions to see your monthly trend.</small></div>}
            </div>

            <CategoryChart data={categories} />
          </section>

          <section className="chart-card analytics-daily-card">
            <div className="card-header"><div><h3>Daily cash flow</h3><small className="card-subtitle">Transactions during {monthLabel} {year}</small></div></div>
            {hasDailyData ? (
              <ResponsiveContainer width="100%" height={245}>
                <AreaChart data={dailyChartData} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dailyIncome" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00d99a" stopOpacity={0.28} /><stop offset="100%" stopColor="#00d99a" stopOpacity={0.01} /></linearGradient>
                    <linearGradient id="dailyExpense" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff5576" stopOpacity={0.18} /><stop offset="100%" stopColor="#ff5576" stopOpacity={0.01} /></linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(148, 163, 184, .14)" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#85859b', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tickFormatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} tick={{ fill: '#85859b', fontSize: 10 }} axisLine={false} tickLine={false} width={68} />
                  <Tooltip cursor={false} formatter={(value) => formatMoney(value)} {...tooltipStyle} />
                  <Legend wrapperStyle={{ paddingTop: 12, color: '#85859b', fontSize: 11 }} />
                  <Area type="monotone" dataKey="income" name="Income" stroke="#00d99a" strokeWidth={2.5} fill="url(#dailyIncome)" activeDot={{ r: 4 }} />
                  <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ff5576" strokeWidth={2.5} fill="url(#dailyExpense)" activeDot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <div className="empty-chart-state compact-empty"><p>No transactions in {monthLabel}</p><small>Daily income and expenses will appear here when recorded.</small></div>}
          </section>
        </>
      )}
    </MainLayout>
  );
};

export default Analytics;
