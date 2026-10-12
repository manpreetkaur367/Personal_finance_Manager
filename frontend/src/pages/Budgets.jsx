import { useCallback, useEffect, useState } from 'react';
import BudgetCard from '../components/budgets/BudgetCard';
import MainLayout from '../components/layout/MainLayout';
import budgetService from '../services/budgetService';

const createDefaultForm = () => ({ category: 'overall', amount: '', month: new Date().getMonth() + 1, year: new Date().getFullYear() });

const Budgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [form, setForm] = useState(createDefaultForm);
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadBudgets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await budgetService.getBudgets({ month: form.month, year: form.year });
      setBudgets(response.budgets || []);
      setError('');
    } catch (loadError) {
      setError(loadError.message || 'Unable to load budgets.');
    } finally {
      setLoading(false);
    }
  }, [form.month, form.year]);

  useEffect(() => { loadBudgets(); }, [loadBudgets]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const payload = { ...form, category: form.category.trim(), amount: Number(form.amount) };
      if (!payload.category || !Number.isFinite(payload.amount) || payload.amount <= 0 || !Number.isInteger(Number(payload.year)) || payload.year < 2000) {
        throw new Error('Enter a category, a positive budget amount, and a valid year.');
      }
      if (editingId) await budgetService.updateBudget(editingId, payload);
      else await budgetService.createBudget(payload);
      setNotice(editingId ? 'Budget updated successfully.' : 'Budget created successfully.');
      setEditingId('');
      setForm({ ...createDefaultForm(), month: Number(payload.month), year: Number(payload.year) });
      await loadBudgets();
    } catch (saveError) {
      setError(saveError.message || 'Unable to save this budget.');
    } finally {
      setSaving(false);
    }
  };

  const beginEdit = (budget) => {
    setEditingId(budget._id);
    setForm({ category: budget.category, amount: String(budget.amount), month: budget.month, year: budget.year });
    setError('');
    setNotice('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this budget?')) return;
    setDeletingId(id);
    setError('');
    setNotice('');
    try {
      await budgetService.deleteBudget(id);
      setNotice('Budget deleted.');
      await loadBudgets();
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete budget.');
    } finally {
      setDeletingId('');
    }
  };

  const cancelEdit = () => { setEditingId(''); setForm(createDefaultForm()); };

  return (
    <MainLayout title="Budgets">
      {notice && <div className="notice success-notice" role="status">{notice}</div>}
      {error && <div className="notice error-notice" role="alert">{error}</div>}
      <div className="two-column-grid budget-grid">
        <div className="panel-card">
          <div className="card-header"><h3>{editingId ? 'Edit budget' : 'Create a monthly budget'}</h3></div>
          <form className="auth-form" onSubmit={handleSubmit}>
            <label><span>Category</span><input name="category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} required /></label>
            <label><span>Amount</span><input name="amount" type="number" min="0.01" step="0.01" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} required /></label>
            <div className="field-row">
              <label><span>Month</span><select name="month" value={form.month} onChange={(event) => setForm({ ...form, month: Number(event.target.value) })}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{new Date(2024, index, 1).toLocaleString('en-IN', { month: 'long' })}</option>)}</select></label>
              <label><span>Year</span><input name="year" type="number" min="2000" max="9999" value={form.year} onChange={(event) => setForm({ ...form, year: Number(event.target.value) })} required /></label>
            </div>
            <div className="form-actions">
              {editingId && <button type="button" className="secondary-button" onClick={cancelEdit}>Cancel</button>}
              <button type="submit" className="primary-button" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Update budget' : 'Save budget'}</button>
            </div>
          </form>
        </div>

        <div className="panel-card">
          <div className="card-header"><h3>Budget overview</h3></div>
          {loading ? <div className="loading-panel" aria-live="polite">Loading budgets…</div> : budgets.length === 0 ? (
            <div className="empty-box">No budgets created for this month yet.</div>
          ) : (
            <div className="budget-list">
              {budgets.map((budget) => <div key={budget._id} className="budget-item-wrap">
                <BudgetCard budget={budget} />
                <div className="row-actions">
                  <button type="button" className="link-button" onClick={() => beginEdit(budget)}>Edit</button>
                  <button type="button" className="link-button danger" disabled={deletingId === budget._id} onClick={() => handleDelete(budget._id)}>{deletingId === budget._id ? 'Deleting…' : 'Delete'}</button>
                </div>
              </div>)}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Budgets;
