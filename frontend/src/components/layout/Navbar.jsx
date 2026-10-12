import { useEffect, useRef, useState } from 'react';
import { Bell, ChevronDown, Search, CalendarRange, Settings, LogOut, X, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import transactionService from '../../services/transactionService';
import formatCurrency from '../../utils/formatCurrency';

const monthOptions = Array.from({ length: 12 }, (_, index) => ({ value: index + 1, label: new Date(2024, index, 1).toLocaleString('en-IN', { month: 'long' }) }));

const Navbar = ({ title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [panel, setPanel] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setPanel('');
    };
    const closeOnEscape = (event) => { if (event.key === 'Escape') setPanel(''); };
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  useEffect(() => {
    if (panel !== 'search') return undefined;
    if (!query.trim()) { setResults([]); setLoading(false); return undefined; }
    let active = true;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const response = await transactionService.getTransactions({ search: query.trim(), limit: 8, sortBy: 'date', sortOrder: 'desc' });
        if (active) setResults(response.transactions || []);
      } catch (_error) {
        if (active) setResults([]);
      } finally {
        if (active) setLoading(false);
      }
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [panel, query]);

  const openNotifications = async () => {
    setPanel(panel === 'notifications' ? '' : 'notifications');
    if (panel !== 'notifications') {
      try {
        const response = await transactionService.getTransactions({ limit: 5, sortBy: 'date', sortOrder: 'desc' });
        setActivity(response.transactions || []);
      } catch (_error) { setActivity([]); }
    }
  };

  const openTransactions = (search = '') => {
    setPanel('');
    navigate(`/transactions${search ? `?search=${encodeURIComponent(search)}` : ''}`);
  };

  return (
    <header className="topbar">
      <div className="page-heading">
        <div><p className="eyebrow">Overview</p><h1>{title}</h1></div>
      </div>
      <div className="topbar-actions" ref={rootRef}>
        <div className="month-picker">
          <CalendarRange size={16} />
          <select defaultValue={new Date().getMonth() + 1} aria-label="Month">
            {monthOptions.map((month) => <option key={month.value} value={month.value}>{month.label}</option>)}
          </select>
        </div>
        <button className="icon-button" aria-label="Search transactions" aria-expanded={panel === 'search'} onClick={() => setPanel(panel === 'search' ? '' : 'search')}><Search size={16} /></button>
        <button className="icon-button" aria-label="Recent activity" aria-expanded={panel === 'notifications'} onClick={openNotifications}><Bell size={16} /></button>
        <button className="profile-chip" aria-label="Open account menu" aria-expanded={panel === 'profile'} onClick={() => setPanel(panel === 'profile' ? '' : 'profile')}>
          <div className="profile-avatar">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
          <div className="profile-meta"><strong>{user?.name || 'User'}</strong><small>{user?.email || 'member@spendwise.com'}</small></div>
          <ChevronDown size={16} />
        </button>

        {panel === 'search' && <section className="topbar-popover search-popover" aria-label="Search transactions">
          <div className="popover-heading"><strong>Search transactions</strong><button className="popover-close" aria-label="Close search" onClick={() => setPanel('')}><X size={16} /></button></div>
          <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by transaction title…" />
          <div className="popover-results">
            {loading && <p className="popover-empty">Searching…</p>}
            {!loading && query.trim() && results.length === 0 && <p className="popover-empty">No matching transactions.</p>}
            {results.map((item) => <button className="popover-result" key={item._id} onClick={() => openTransactions(item.title)}>
              <span className={`activity-icon ${item.type}`} aria-hidden="true">{item.type === 'income' ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}</span>
              <span className="result-copy"><strong>{item.title}</strong><small>{item.category}</small></span>
              <strong className="result-amount">{formatCurrency(item.amount)}</strong>
            </button>)}
            {!query.trim() && <p className="popover-empty">Type a title to find a transaction.</p>}
          </div>
          <button className="popover-footer" onClick={() => openTransactions(query.trim())}>Open all transactions</button>
        </section>}

        {panel === 'notifications' && <section className="topbar-popover notification-popover" aria-label="Recent activity">
          <div className="popover-heading"><div><strong>Recent activity</strong><small>Your latest transactions</small></div><button className="popover-close" aria-label="Close notifications" onClick={() => setPanel('')}><X size={16} /></button></div>
          {activity.length ? activity.map((item) => <button className="popover-result" key={item._id} onClick={() => openTransactions()}>
            <span className={`activity-icon ${item.type}`} aria-hidden="true">{item.type === 'income' ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}</span>
            <span className="result-copy"><strong>{item.title}</strong><small>{item.category} · {new Date(item.date).toLocaleDateString('en-IN')}</small></span>
            <strong className="result-amount">{formatCurrency(item.amount)}</strong>
          </button>) : <p className="popover-empty">No transaction activity yet.</p>}
          <button className="popover-footer" onClick={() => openTransactions()}>View all transactions</button>
        </section>}

        {panel === 'profile' && <section className="topbar-popover profile-popover" aria-label="Account menu">
          <div className="account-summary"><div className="profile-avatar">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</div><span className="result-copy"><strong>{user?.name || 'User'}</strong><small>{user?.email || ''}</small></span></div>
          <button className="menu-action" onClick={() => { setPanel(''); navigate('/settings'); }}><Settings size={16} /> Account settings</button>
          <button className="menu-action danger-action" onClick={async () => { setPanel(''); await logout(); navigate('/login', { replace: true }); }}><LogOut size={16} /> Sign out</button>
        </section>}
      </div>
    </header>
  );
};

export default Navbar;
