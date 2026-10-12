import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FinanceIllustration from '../components/auth/FinanceIllustration';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const invitedEmail = searchParams.get('email') || '';
  const returnTo = searchParams.get('returnTo');
  const [form, setForm] = useState({ email: invitedEmail, password: '' });
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
      await login(form);
      navigate(returnTo?.startsWith('/invite/accept') ? returnTo : '/', { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to log in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell auth-scene">
      <div className="auth-layout">
      <div className="auth-card auth-glass-card">
        <p className="eyebrow">Welcome back</p>
        <h2>Sign in to your account</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            <span>Email address</span>
            <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" autoComplete="email" required readOnly={Boolean(invitedEmail)} />
          </label>
          <label>
            <span>Password</span>
            <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Enter your password" autoComplete="current-password" required />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="auth-link">Don’t have an account? <Link to="/register">Sign up</Link></p>
      </div>
      <FinanceIllustration />
      </div>
    </div>
  );
};

export default Login;
