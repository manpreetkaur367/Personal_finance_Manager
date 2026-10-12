import { useEffect, useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';

const Settings = () => {
  const { user, updateProfile, logout } = useAuth();
  const [form, setForm] = useState({ name: '', preferredCurrency: 'INR' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', preferredCurrency: user.preferredCurrency || 'INR' });
    }
  }, [user]);

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setNotice('');
    try {
      await updateProfile({ ...form, name: form.name.trim() });
      setNotice('Profile updated successfully.');
    } catch (saveError) {
      setError(saveError.message || 'Unable to update your profile.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSave = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setNotice('');
    try {
      await authService.changePassword(passwords);
      setPasswords({ currentPassword: '', newPassword: '' });
      setNotice('Password changed successfully.');
    } catch (saveError) {
      setError(saveError.message || 'Unable to change your password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout title="Settings">
      {notice && <div className="notice success-notice" role="status">{notice}</div>}
      {error && <div className="notice error-notice" role="alert">{error}</div>}
      <div className="settings-grid">
        <div className="panel-card">
          <div className="card-header">
            <h3>Profile</h3>
          </div>
          <form className="auth-form" onSubmit={handleProfileSave}>
            <label>
              <span>Name</span>
                <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} minLength={2} required />
            </label>
            <label>
              <span>Email</span>
              <input value={user?.email || ''} disabled />
            </label>
            <label>
              <span>Currency</span>
              <select value={form.preferredCurrency} onChange={(event) => setForm({ ...form, preferredCurrency: event.target.value })}>
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </label>
            <button type="submit" className="primary-button" disabled={loading}>Save profile</button>
          </form>
        </div>

        <div className="panel-card">
          <div className="card-header">
            <h3>Security</h3>
          </div>
          <form className="auth-form" onSubmit={handlePasswordSave}>
            <label>
              <span>Current password</span>
              <input type="password" value={passwords.currentPassword} onChange={(event) => setPasswords({ ...passwords, currentPassword: event.target.value })} autoComplete="current-password" required />
            </label>
            <label>
              <span>New password</span>
              <input type="password" value={passwords.newPassword} onChange={(event) => setPasswords({ ...passwords, newPassword: event.target.value })} autoComplete="new-password" minLength={6} required />
            </label>
            <button type="submit" className="primary-button" disabled={loading}>Change password</button>
          </form>
          <div className="divider" />
          <button className="secondary-button full-width" onClick={logout}>Logout</button>
        </div>
      </div>
    </MainLayout>
  );
};

export default Settings;
