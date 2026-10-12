import formatCurrency from '../../utils/formatCurrency';
import formatDate from '../../utils/formatDate';

const TransactionTable = ({ transactions = [], onEdit, onDelete }) => (
  <div className="table-card">
    <table>
      <thead>
        <tr>
          <th>Title</th>
          <th>Type</th>
          <th>Category</th>
          <th>Date</th>
          <th>Method</th>
          <th>Amount</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {transactions.length === 0 ? (
          <tr>
            <td colSpan="7" className="empty-table-cell">No transactions match the active filters.</td>
          </tr>
        ) : (
          transactions.map((transaction) => (
            <tr key={transaction._id}>
              <td>{transaction.title}</td>
              <td>
                <span className={`pill ${transaction.type}`}>{transaction.type}</span>
              </td>
              <td>{transaction.category}</td>
              <td>{formatDate(transaction.date)}</td>
              <td>{transaction.paymentMethod}</td>
              <td className={transaction.type === 'income' ? 'text-emerald' : 'text-danger'}>
                {transaction.type === 'income' ? '+' : '-'}
                {formatCurrency(transaction.amount)}
              </td>
              <td>
                <div className="row-actions">
                  <button type="button" className="link-button" aria-label={`Edit ${transaction.title}`} onClick={() => onEdit(transaction)}>
                    Edit
                  </button>
                  <button type="button" className="link-button danger" aria-label={`Delete ${transaction.title}`} onClick={() => onDelete(transaction._id)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

export default TransactionTable;
