import { BarChart3, CreditCard, Wallet, TrendingUp, Settings, PiggyBank, MapPinned } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navGroups = [
  { label: 'Overview', items: [
    { to: '/', label: 'Dashboard', icon: BarChart3 },
    { to: '/analytics', label: 'Analytics', icon: TrendingUp },
  ] },
  { label: 'Finance', items: [
    { to: '/transactions', label: 'Transactions', icon: Wallet },
    { to: '/budgets', label: 'Budgets', icon: PiggyBank },
    { to: '/trips', label: 'My Trips', icon: MapPinned },
  ] },
  { label: 'Account', items: [
    { to: '/settings', label: 'Settings', icon: Settings },
  ] },
];

const Sidebar = () => (
  <aside className="sidebar">
    <div className="brand-wrap">
      <div className="brand-mark">
        <CreditCard size={18} />
      </div>
      <div>
        <p className="eyebrow">Finance OS</p>
        <h2>SpendWise</h2>
      </div>
    </div>

    <nav className="sidebar-nav">
      {navGroups.map((group) => <div className="sidebar-group" key={group.label}>
        <p className="sidebar-group-label">{group.label}</p>
        {group.items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Icon size={18} />
          <span>{label}</span>
        </NavLink>
        ))}
      </div>)}
    </nav>
  </aside>
);

export default Sidebar;
