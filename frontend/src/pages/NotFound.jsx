import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="auth-shell">
    <div className="auth-card">
      <p className="eyebrow">404</p>
      <h1>Page not found</h1>
      <p className="muted-copy">The page you are looking for does not exist.</p>
      <Link to="/" className="primary-button inline-button">Back to dashboard</Link>
    </div>
  </div>
);

export default NotFound;
