const SummaryCard = ({ label, value, subtitle, accent = 'emerald', icon: Icon, highlight = false }) => (
  <div className={`summary-card ${highlight ? 'summary-card-highlight' : ''}`}>
    <div className="summary-header">
      <span className={`badge ${accent}`}>{label}</span>
      {Icon && <span className={`summary-icon ${accent}`}><Icon size={18} aria-hidden="true" /></span>}
    </div>
    <h3>{value}</h3>
    <p>{subtitle}</p>
  </div>
);

export default SummaryCard;
