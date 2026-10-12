import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FinanceIllustration from '../components/auth/FinanceIllustration';

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register } = useAuth();
  const invitedEmail = searchParams.get('email') || '';
  const returnTo = searchParams.get('returnTo');
  const [form, setForm] = useState({ name: '', email: invitedEmail, password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await register(form);
      navigate(returnTo?.startsWith('/invite/accept') ? returnTo : '/', { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to register.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell auth-scene">
      <div className="auth-layout">
      <div className="auth-card auth-glass-card register-card">
        <p className="eyebrow">Create an account</p>
        <h2>Join SpendWise</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            <span>Full name</span>
            <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Your name" autoComplete="name" required />
          </label>
          <label>
            <span>Email</span>
            <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" autoComplete="email" required readOnly={Boolean(invitedEmail)} />
          </label>
          <label>
            <span>Password</span>
            <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Create a password" autoComplete="new-password" required />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        <p className="auth-link">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
      <FinanceIllustration />
      </div>
    </div>
  );
};

export default Register;
