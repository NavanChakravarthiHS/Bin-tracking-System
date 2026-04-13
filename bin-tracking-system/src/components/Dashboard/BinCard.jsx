import { MapPin } from 'lucide-react';
import StatusBadge from '../Common/StatusBadge';

const BinCard = ({ bin, index }) => {
  const getProgressColor = (fillLevel) => {
    if (fillLevel >= 90) return 'progress-fill-full';
    if (fillLevel >= 70) return 'progress-fill-warning';
    return 'progress-fill-normal';
  };

  const getProgressBg = (fillLevel) => {
    if (fillLevel >= 90) return 'bg-red-100';
    if (fillLevel >= 70) return 'bg-yellow-100';
    return 'bg-green-100';
  };

  return (
    <div
      className="modern-card p-5 animate-slide-up cursor-pointer"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-base font-bold text-heading">
            {bin.id}
          </h3>
          <div className="flex items-center gap-1.5 mt-1.5 text-gray-600 text-sm">
            <MapPin size={14} className="text-primary-600" />
            <span className="font-medium">{bin.location}</span>
          </div>
        </div>
        <StatusBadge status={bin.status} />
      </div>

      {/* Fill Level */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-subheading">
            Fill Level
          </span>
          <span className="text-xl font-bold text-heading">
            {bin.fillLevel}%
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className={`w-full h-2 ${getProgressBg(bin.fillLevel)} rounded-full overflow-hidden`}>
          <div
            className={`h-full ${getProgressColor(bin.fillLevel)}`}
            style={{ width: `${bin.fillLevel}%` }}
          ></div>
        </div>
      </div>

      {/* Coordinates */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-500 space-y-0.5">
          <div>Lat: {bin.latitude.toFixed(4)}</div>
          <div>Lng: {bin.longitude.toFixed(4)}</div>
        </div>
      </div>
    </div>
  );
};

export default BinCard;
