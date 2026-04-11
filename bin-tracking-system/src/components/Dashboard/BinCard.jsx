import { MapPin } from 'lucide-react';
import StatusBadge from '../Common/StatusBadge';

const BinCard = ({ bin, index }) => {
  const getProgressColor = (fillLevel) => {
    if (fillLevel >= 90) return 'bg-red-500';
    if (fillLevel >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getProgressBg = (fillLevel) => {
    if (fillLevel >= 90) return 'bg-red-100 dark:bg-red-900';
    if (fillLevel >= 70) return 'bg-yellow-100 dark:bg-yellow-900';
    return 'bg-green-100 dark:bg-green-900';
  };

  return (
    <div
      className="card p-6 animate-fade-in hover:scale-105 cursor-pointer"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {bin.id}
          </h3>
          <div className="flex items-center gap-1 mt-1 text-gray-600 dark:text-gray-400 text-sm">
            <MapPin size={14} />
            <span>{bin.location}</span>
          </div>
        </div>
        <StatusBadge status={bin.status} />
      </div>

      {/* Fill Level */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Fill Level
          </span>
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {bin.fillLevel}%
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className={`w-full h-3 ${getProgressBg(bin.fillLevel)} rounded-full overflow-hidden`}>
          <div
            className={`h-full ${getProgressColor(bin.fillLevel)} transition-all duration-500 rounded-full`}
            style={{ width: `${bin.fillLevel}%` }}
          ></div>
        </div>
      </div>

      {/* Coordinates */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-border">
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <div>Lat: {bin.latitude.toFixed(4)}</div>
          <div>Lng: {bin.longitude.toFixed(4)}</div>
        </div>
      </div>
    </div>
  );
};

export default BinCard;
