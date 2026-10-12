import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import tripService from '../services/tripService';
import FinanceIllustration from '../components/auth/FinanceIllustration';

const InvitationAcceptance = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const token = searchParams.get('token') || '';
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!token) {
      setError('This invitation link is missing its token. Ask the trip owner to send a new invitation.');
      setLoading(false);
      return () => { active = false; };
    }

    tripService.verifyInvitation(token)
      .then((response) => { if (active) setInvitation(response.invitation); })
      .catch((verifyError) => { if (active) setError(verifyError.message || 'This invitation link is invalid or expired.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  const returnTo = `/invite/accept?token=${encodeURIComponent(token)}`;
  const authQuery = `email=${encodeURIComponent(invitation?.email || '')}&returnTo=${encodeURIComponent(returnTo)}`;
  const userMatches = user && invitation && user.email?.toLowerCase() === invitation.email?.toLowerCase();

  const handleAccept = async () => {
    setAccepting(true);
    setError('');
    try {
      const response = await tripService.acceptInvitation(token);
      navigate(`/trips?trip=${encodeURIComponent(response.tripId)}`, { replace: true });
    } catch (acceptError) {
      setError(acceptError.message || 'Unable to accept this invitation.');
    } finally {
      setAccepting(false);
    }
  };

  const switchAccount = async () => {
    await logout();
    navigate(`/login?${authQuery}`);
  };

  return (
    <div className="auth-shell auth-scene">
      <div className="auth-layout">
        <section className="auth-card auth-glass-card invitation-card" aria-labelledby="invitation-heading">
          <p className="eyebrow">SpendWise trip invitation</p>
          <h2 id="invitation-heading">Accept your invitation</h2>
          {loading ? <p role="status">Checking invitation…</p> : null}
          {!loading && invitation && (
            <div className="invitation-details">
              <p><strong>{invitation.inviterName}</strong> invited you to join <strong>{invitation.tripName}</strong>.</p>
              <p>Invitation for <strong>{invitation.email}</strong></p>
              <p className="invitation-status">Status: Pending</p>
              {userMatches ? (
                <button className="primary-button" type="button" onClick={handleAccept} disabled={accepting}>
                  {accepting ? 'Accepting…' : 'Accept Invitation'}
                </button>
              ) : user ? (
                <div className="invitation-auth-prompt">
                  <p>You are signed in as {user.email}. Sign in using the invited email address to continue.</p>
                  <button className="primary-button" type="button" onClick={switchAccount}>Switch account</button>
                </div>
              ) : (
                <div className="invitation-auth-prompt">
                  <p>Log in or create a SpendWise account using this invited email address to accept.</p>
                  <div className="invitation-auth-actions">
                    <Link className="primary-button" to={`/login?${authQuery}`}>Log in</Link>
                    <Link className="secondary-button" to={`/register?${authQuery}`}>Register</Link>
                  </div>
                </div>
              )}
            </div>
          )}
          {error && <p className="form-error" role="alert">{error}</p>}
          {!loading && !invitation && <Link className="secondary-button" to="/login">Go to SpendWise login</Link>}
        </section>
        <FinanceIllustration />
      </div>
    </div>
  );
};

export default InvitationAcceptance;
