import { ArrowRight, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import formatCurrency from '../../utils/formatCurrency';
import formatDate from '../../utils/formatDate';

const RecentTransactions = ({ transactions = [], onViewAll }) => (
  <div className="panel-card">
    <div className="card-header split-header">
      <h3>Recent Transactions</h3>
      <button className="text-button" onClick={onViewAll}>
        View all <ArrowRight size={14} />
      </button>
    </div>

    <div className="transaction-list">
      {transactions.length === 0 ? (
        <div className="empty-box">No transactions yet. Add your first record.</div>
      ) : (
        transactions.map((transaction) => (
          <div key={transaction._id} className="transaction-item">
            <div className="transaction-bullet">
              {transaction.type === 'income' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            </div>
            <div className="transaction-copy">
              <strong>{transaction.title}</strong>
              <span>{transaction.category}</span>
            </div>
            <div className="transaction-meta">
              <span>{formatDate(transaction.date)}</span>
            </div>
            <div className={`amount ${transaction.type}`}>
              {transaction.type === 'income' ? '+' : '-'}
              {formatCurrency(transaction.amount)}
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

export default RecentTransactions;
