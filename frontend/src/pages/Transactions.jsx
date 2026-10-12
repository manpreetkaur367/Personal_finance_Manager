import { useCallback, useEffect, useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import TransactionFilters from '../components/transactions/TransactionFilters';
import TransactionForm from '../components/transactions/TransactionForm';
import TransactionTable from '../components/transactions/TransactionTable';
import transactionService from '../services/transactionService';

const defaultFilters = {
  search: '',
  type: '',
  category: '',
  startDate: '',
  endDate: '',
};

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(() => ({ ...defaultFilters, search: new URLSearchParams(window.location.search).get('search') || '' }));
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadTransactions = useCallback(async (params = {}, requestedPage = 1) => {
    try {
      setLoading(true);
      const response = await transactionService.getTransactions({
        ...params,
        sortBy: 'date',
        sortOrder: 'desc',
        page: requestedPage,
        limit: 10,
      });
      setTransactions(response.transactions || []);
      setPagination(response.pagination || { total: (response.transactions || []).length, totalPages: 1 });
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error.message || 'Unable to load transactions.');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.type) params.type = filters.type;
    if (filters.category) params.category = filters.category;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    loadTransactions(params, page);
  }, [filters, page, loadTransactions]);

  const handleFormSubmit = async (payload) => {
    try {
      setSaving(true);
      setErrorMessage('');
      setSuccessMessage('');
      const normalized = {
        ...payload,
        amount: Number(payload.amount),
      };

      if (editingTransaction) {
        await transactionService.updateTransaction(editingTransaction._id, normalized);
      } else {
        await transactionService.createTransaction(normalized);
      }

      setShowForm(false);
      setEditingTransaction(null);
      setFilters({ ...defaultFilters });
      setPage(1);
      setSuccessMessage(editingTransaction ? 'Transaction updated.' : 'Transaction added.');
      await loadTransactions({}, 1);
    } catch (error) {
      setErrorMessage(error.message || 'Unable to save transaction.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Delete this transaction?');
    if (!confirmed) return;

    try {
      setErrorMessage('');
      await transactionService.deleteTransaction(id);
      setSuccessMessage('Transaction deleted.');
      if (transactions.length === 1 && page > 1) setPage((current) => current - 1);
      else {
        const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
        await loadTransactions(params, page);
      }
    } catch (error) {
      setErrorMessage(error.message || 'Unable to delete transaction.');
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  return (
    <MainLayout title="Transactions">
      <div className="toolbar-row">
        <button className="primary-button" onClick={() => { setEditingTransaction(null); setShowForm(true); setErrorMessage(''); setSuccessMessage(''); }}>
          Add Transaction
        </button>
      </div>

      {successMessage && <div className="notice success-notice" role="status">{successMessage}</div>}
      {errorMessage && <div className="notice error-notice" role="alert">{errorMessage}</div>}

      {showForm && (
        <div className="panel-card form-wrap">
          <TransactionForm
            key={editingTransaction?._id || 'new-transaction'}
            initialData={editingTransaction ? {
              ...editingTransaction,
              date: new Date(editingTransaction.date).toISOString().slice(0, 10),
              amount: editingTransaction.amount,
            } : null}
            onSubmit={handleFormSubmit}
            onCancel={() => { setShowForm(false); setEditingTransaction(null); }}
            isLoading={saving}
          />
        </div>
      )}

      <TransactionFilters
        filters={filters}
        onChange={(key, value) => { setPage(1); setFilters((prev) => ({ ...prev, [key]: value })); }}
        onReset={() => { setPage(1); setFilters(defaultFilters); }}
      />

      {loading ? <div className="loading-panel" aria-live="polite">Loading transactions…</div> : <>
        <TransactionTable transactions={transactions} onEdit={handleEdit} onDelete={handleDelete} />
        {pagination.total > 0 && <div className="pagination-bar">
          <span>Showing {((page - 1) * 10) + 1}–{Math.min(page * 10, pagination.total)} of {pagination.total}</span>
          <div>
            <button className="secondary-button" type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
            <span aria-live="polite">Page {page} of {Math.max(1, pagination.totalPages)}</span>
            <button className="secondary-button" type="button" disabled={page >= pagination.totalPages} onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}>Next</button>
          </div>
        </div>}
      </>}
    </MainLayout>
  );
};

export default Transactions;
