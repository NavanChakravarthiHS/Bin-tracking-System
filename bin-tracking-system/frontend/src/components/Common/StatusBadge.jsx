import { getStatusColor } from '../../utils/helpers';

const StatusBadge = ({ status }) => {
  const color = getStatusColor(status);
  
  const colorClasses = {
    green: 'bg-emerald-500 text-white border border-emerald-600 font-semibold shadow-sm',
    orange: 'bg-amber-500 text-white border border-amber-600 font-semibold shadow-sm',
    yellow: 'bg-amber-500 text-white border border-amber-600 font-semibold shadow-sm',
    red: 'bg-red-500 text-white border border-red-600 font-semibold shadow-sm animate-pulse',
    gray: 'bg-gray-400 text-white border border-gray-500 font-semibold shadow-sm'
  };

  const dotColors = {
    green: 'bg-white',
    orange: 'bg-white',
    yellow: 'bg-white',
    red: 'bg-white',
    gray: 'bg-white'
  };

  const activeColorClass = colorClasses[color] || colorClasses.gray;
  const activeDotClass = dotColors[color] || dotColors.gray;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${activeColorClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${activeDotClass} ${color === 'red' ? 'animate-ping' : 'animate-pulse'}`}></span>
      {status}
    </span>
  );
};

export default StatusBadge;
