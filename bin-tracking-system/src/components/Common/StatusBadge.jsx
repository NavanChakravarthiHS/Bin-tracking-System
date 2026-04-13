import { getStatusColor } from '../../utils/helpers';

const StatusBadge = ({ status }) => {
  const color = getStatusColor(status);
  
  const colorClasses = {
    green: 'bg-green-500 text-white border border-green-600 font-semibold',
    yellow: 'bg-amber-500 text-black border border-amber-600 font-semibold',
    red: 'bg-red-500 text-white border border-red-600 font-semibold',
    gray: 'bg-gray-400 text-white border border-gray-500 font-semibold'
  };

  const dotColors = {
    green: 'bg-white',
    yellow: 'bg-black',
    red: 'bg-white',
    gray: 'bg-white'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${colorClasses[color]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColors[color]} animate-pulse`}></span>
      {status}
    </span>
  );
};

export default StatusBadge;
