import { Cell, Label, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#22C55E', '#10B981', '#34D399', '#F59E0B', '#EF4444', '#A78BFA', '#60A5FA', '#F472B6'];

const formatMoney = (value = 0) => `₹${Number(value).toLocaleString('en-IN')}`;

const CategoryChart = ({ data = [] }) => {
  const hasData = Array.isArray(data) && data.some((item) => Number(item.total) > 0);
  const total = data.reduce((sum, item) => sum + Math.max(0, Number(item.total) || 0), 0);

  if (!hasData) {
    return (
      <div className="chart-card analytics-card">
        <div className="card-header split-header">
          <h3>Spending</h3>
        </div>
        <div className="empty-chart-state">
          <div className="empty-chart-icon">₹</div>
          <p>No expense categories yet</p>
          <small>Add transactions to see your spending breakdown.</small>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-card analytics-card">
      <div className="card-header split-header">
        <div><h3>Spending</h3><small className="card-subtitle">By category</small></div>
      </div>

      <div className="category-chart-shell">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="category"
              innerRadius={52}
              outerRadius={82}
              paddingAngle={3}
              stroke="rgba(7, 23, 45, 0.8)"
              strokeWidth={2}
            >
              <Label value={formatMoney(total)} position="center" fill="#edf6ff" fontSize={14} fontWeight={700} />
              {data.map((entry, index) => (
                <Cell key={entry.category} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatMoney(value)}
              labelStyle={{ color: '#07172d', fontWeight: 700 }}
              itemStyle={{ color: '#07172d' }}
              contentStyle={{ background: '#f8fafc', border: '1px solid rgba(15, 23, 42, 0.12)', borderRadius: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="donut-legend">
          {data.map((entry, index) => (
            <div key={entry.category} className="donut-legend-item">
              <div className="legend-label-wrap">
                <span className="legend-dot" style={{ background: COLORS[index % COLORS.length] }} />
                <span>{entry.category}</span>
              </div>
              <strong>{formatMoney(entry.total)} <small>{total ? `${((Number(entry.total) / total) * 100).toFixed(1)}%` : '0%'}</small></strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryChart;
