import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const IncomeExpenseChart = ({ data = [], year, onYearChange, years = [] }) => {
  const hasData = data.some((entry) => Number(entry.income) > 0 || Number(entry.expenses) > 0);

  return <div className="chart-card">
    <div className="card-header">
      <div><h3>Cash flow overview</h3><small className="card-subtitle">Income vs expenses · {year}</small></div>
      <label className="chart-year-filter">
        <span className="visually-hidden">Chart year</span>
        <select aria-label="Chart year" value={year} onChange={(event) => onYearChange(Number(event.target.value))}>
          {years.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </label>
    </div>
    {hasData ? <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data.slice(-6)} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="rgba(148, 163, 184, .16)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" tick={{ fill: '#9bb2cc', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#9bb2cc', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} />
        <Tooltip cursor={false} formatter={(value, name) => [`₹${Number(value).toLocaleString('en-IN')}`, name]} labelStyle={{ color: '#07172d', fontWeight: 700 }} itemStyle={{ color: '#07172d', fontWeight: 600 }} contentStyle={{ backgroundColor: '#f5f7fb', border: '1px solid rgba(15, 23, 42, 0.12)', borderRadius: 12, boxShadow: '0 12px 28px rgba(15, 23, 42, .14)', padding: '10px 12px' }} />
        <Legend />
        <Area type="monotone" dataKey="income" name="Income" stroke="#00e0a1" strokeWidth={2.5} fill="url(#incomeFill)" activeDot={{ r: 4 }} />
        <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ff4d74" strokeWidth={2.5} fill="url(#expenseFill)" activeDot={{ r: 4 }} />
        <defs>
          <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00e0a1" stopOpacity={0.3} /><stop offset="100%" stopColor="#00e0a1" stopOpacity={0.01} /></linearGradient>
          <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff4d74" stopOpacity={0.16} /><stop offset="100%" stopColor="#ff4d74" stopOpacity={0.01} /></linearGradient>
        </defs>
      </AreaChart>
    </ResponsiveContainer> : <div className="empty-chart-state compact-empty"><p>No income or expenses for {year} yet.</p><small>Transactions will appear here once recorded.</small></div>}
  </div>;
};

export default IncomeExpenseChart;
