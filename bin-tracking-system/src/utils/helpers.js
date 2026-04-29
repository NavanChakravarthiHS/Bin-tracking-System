export const getStatusColor = (status) => {
  switch (status) {
    case 'Normal':
      return 'green';
    case 'Warning':
      return 'yellow';
    case 'Full':
      return 'red';
    case 'Empty':
      return 'blue';
    default:
      return 'gray';
  }
};

export const getStatusFromFillLevel = (fillLevel) => {
  if (fillLevel >= 90) return 'Full';
  if (fillLevel >= 70) return 'Warning';
  return 'Normal';
};

export const getMarkerColor = (status) => {
  switch (status) {
    case 'Normal':
      return '#10b981';
    case 'Warning':
      return '#f59e0b';
    case 'Full':
      return '#ef4444';
    case 'Empty':
      return '#3b82f6';
    default:
      return '#6b7280';
  }
};

export const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};
