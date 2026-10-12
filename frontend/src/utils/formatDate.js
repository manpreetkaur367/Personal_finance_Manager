const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export default formatDate;
