import { getStatusColor } from '../../utils/helpers';

const StatusBadge = ({ status }) => {
  const color = getStatusColor(status);
  
  const colorClasses = {
    green: 'status-normal',
    yellow: 'status-warning',
    red: 'status-full',
    gray: 'bg-gray-100 text-gray-800 border-2 border-gray-400 font-semibold'
  };

  const dotColors = {
    green: 'bg-green-600',
    yellow: 'bg-yellow-600',
    red: 'bg-red-600',
    gray: 'bg-gray-600'
  };

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${colorClasses[color]}`}>
      <span className={`w-2.5 h-2.5 rounded-full ${dotColors[color]} animate-pulse`}></span>
      {status}
    </span>
  );
};

export default StatusBadge;
