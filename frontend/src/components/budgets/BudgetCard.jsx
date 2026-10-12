import formatCurrency from '../../utils/formatCurrency';

const BudgetCard = ({ budget }) => {
  const normalized = budget || {};
  const progress = Math.max(0, Math.min(100, Number(normalized.utilisation || 0)));

  return (
    <div className="budget-card">
      <div className="budget-header">
        <div>
          <p className="eyebrow">{normalized.category || 'Overall'}</p>
          <h4>{formatCurrency(normalized.amount || 0)}</h4>
        </div>
        <span className={`status-chip ${normalized.status || 'on-track'}`}>{normalized.status || 'On track'}</span>
      </div>

      <div className="progress-bar">
        <div className={`progress-fill ${normalized.status || 'on-track'}`} style={{ width: `${progress}%` }} />
      </div>

      <div className="budget-meta">
        <span>Spent: {formatCurrency(normalized.spent || 0)}</span>
        <span>Left: {formatCurrency(normalized.remaining || 0)}</span>
      </div>
    </div>
  );
};

export default BudgetCard;
