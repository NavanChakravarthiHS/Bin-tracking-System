import { MapPin, CheckCircle, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatusBadge from '../Common/StatusBadge';
import { formatSensorTime } from '../../utils/helpers';

const BinCard = ({ bin, index }) => {
  // Use pre-computed style classes from our unified status hook
  const cardStyle = bin.cardStyle || 'border-gray-200 bg-white';
  const progressFillColor = bin.progressColor || 'bg-emerald-500';
  const isCollected = bin.status === 'Collected';

  // Determine progress bar background color based on status
  const getProgressBg = (status) => {
    switch (status) {
      case 'Collected': return 'bg-gray-100';
      case 'Full': return 'bg-red-100';
      case 'Warning': return 'bg-amber-100';
      default: return 'bg-emerald-100';
    }
  };

  return (
    <div
      className={`modern-card p-5 animate-slide-up transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${cardStyle}`}
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
            {Number(bin.fillLevel) || 0}%
          </span>
        </div>
        
        {/* Progress Bar with modern color transition */}
        <div className={`w-full h-2 ${getProgressBg(bin.status)} rounded-full overflow-hidden transition-all duration-300`}>
          <div
            className={`h-full ${progressFillColor} rounded-full transition-all duration-500`}
            style={{ width: `${bin.fillLevel}%` }}
          ></div>
        </div>

        {/* Threshold Summary */}
        <div className="flex justify-between text-[11px] text-gray-500 pt-0.5">
          <span>Warn: <strong className="text-amber-600">{bin.warningThreshold ?? 50}%</strong></span>
          <span>Full: <strong className="text-red-600">{bin.fullThreshold ?? 80}%</strong></span>
        </div>
      </div>

      {/* Coordinates & Collection Metadata */}
      <div className="mt-4 pt-3 border-t border-gray-200/60">
        <div className="text-xs text-gray-600 space-y-1 font-medium">
          <div>
            <span>
              Device:{' '}
              {bin.sensorConnected || bin.deviceStatus === 'Active' ? (
                <strong className="text-emerald-600 font-bold inline-flex items-center gap-1">
                  🟢 ACTIVE
                </strong>
              ) : (
                <strong className="text-red-600 font-bold inline-flex items-center gap-1">
                  🔴 INACTIVE
                </strong>
              )}
            </span>
          </div>
          <div>Lat: {bin.latitude ? bin.latitude.toFixed(4) : '0.0000'} | Lng: {bin.longitude ? bin.longitude.toFixed(4) : '0.0000'}</div>
          <div>Last Seen: <strong className="text-gray-800">{formatSensorTime(bin.lastSensorUpdate)}</strong></div>
        </div>
        
        {bin.assignedCollectorName && (
          <div className="text-xs text-gray-600 mt-2">
            Assigned to: {bin.assignedCollectorName}
          </div>
        )}

        {/* Collection Info - Only show when the bin is in Collected state */}
        {isCollected && bin.lastCollected && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <CheckCircle size={12} className="text-emerald-500" />
              <span>Collected {new Date(bin.lastCollected).toLocaleDateString()}</span>
            </div>
            {bin.assignedCollector && (
              <div className="text-xs text-gray-500 mt-1 pl-3.5">
                By: {bin.assignedCollector}
              </div>
            )}
          </div>
        )}

        {/* Quick Edit Footer */}
        <div className="mt-3 pt-2.5 border-t border-gray-100 flex justify-end">
          <Link
            to={`/bins?edit=${bin.id}`}
            className="text-xs font-semibold text-green-700 hover:text-green-800 inline-flex items-center gap-1 hover:underline"
          >
            <Pencil size={12} />
            Configure / Edit
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BinCard;
