export const getBinStatus = (fillLevel, status, bin = {}) => {
  const warningThreshold = Number(bin.warningThreshold ?? 50);
  const fullThreshold = Number(bin.fullThreshold ?? 80);

  if (fillLevel === 0) {
    return {
      status: 'Collected',
      badgeColor: 'gray',
      progressColor: 'progress-fill-empty', // Gray/blue progress bar css class
      markerColor: '#6b7280', // Gray marker
      cardStyle: 'border-gray-200 bg-gray-50/60 opacity-80 border shadow-sm', // Slightly reflected collected state
    };
  }

  // Once new garbage starts filling again after collection:
  if (fillLevel >= fullThreshold) {
    return {
      status: 'Full',
      badgeColor: 'red',
      progressColor: 'progress-fill-full', // Red progress bar
      markerColor: '#ef4444', // Red marker
      cardStyle: 'border-red-200 bg-red-50/30 hover:bg-red-50/50 border shadow-md shadow-red-50/50',
    };
  } else if (fillLevel >= warningThreshold) {
    return {
      status: 'Warning',
      badgeColor: 'orange',
      progressColor: 'progress-fill-warning', // Orange progress bar
      markerColor: '#f59e0b', // Orange marker
      cardStyle: 'border-amber-200 bg-amber-50/30 hover:bg-amber-50/50 border shadow-md shadow-amber-50/50',
    };
  } else {
    return {
      status: 'Normal',
      badgeColor: 'green',
      progressColor: 'progress-fill-normal', // Green progress bar
      markerColor: '#10b981', // Green marker
      cardStyle: 'border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50/50 border shadow-md shadow-emerald-50/50',
    };
  }
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'Normal':
      return 'green';
    case 'Warning':
      return 'orange';
    case 'Full':
      return 'red';
    case 'Collected':
      return 'gray';
    default:
      return 'gray';
  }
};

export const getMarkerColor = (status) => {
  switch (status) {
    case 'Normal':
      return '#10b981';
    case 'Warning':
      return '#f59e0b';
    case 'Full':
      return '#ef4444';
    case 'Collected':
      return '#6b7280';
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
  }).format(new Date(date));
};

export const formatSensorTime = (date) => {
  if (!date) return 'Never';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'Never';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(parsed);
};
