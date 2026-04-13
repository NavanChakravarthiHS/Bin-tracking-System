import { AlertTriangle, X, MapPin } from 'lucide-react';
import { useState } from 'react';

const Alerts = ({ bins }) => {
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

  const fullBins = bins.filter((bin) => bin.status === 'Full');
  const activeAlerts = fullBins.filter((bin) => !dismissedAlerts.has(bin.id));

  const dismissAlert = (binId) => {
    setDismissedAlerts((prev) => new Set([...prev, binId]));
  };

  const clearAllAlerts = () => {
    setDismissedAlerts(new Set(fullBins.map((bin) => bin.id)));
  };

  if (fullBins.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-block p-6 bg-green-100 rounded-full mb-4">
          <AlertTriangle size={48} className="text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-heading mb-2">
          All Clear!
        </h3>
        <p className="text-gray-600">
          No bins are currently full. Great job!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Clear All button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-heading">
            Active Alerts
          </h2>
          <p className="text-gray-600 mt-1">
            {activeAlerts.length} of {fullBins.length} alerts showing
          </p>
        </div>
        {activeAlerts.length > 0 && (
          <button
            onClick={clearAllAlerts}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Alert Cards */}
      {activeAlerts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200 shadow-soft">
          <p className="text-gray-600">All alerts have been dismissed</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeAlerts.map((bin, index) => (
            <div
              key={bin.id}
              className="bg-red-50 border-2 border-red-300 rounded-lg p-5 animate-fade-in hover:shadow-lg transition-all duration-300"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="bg-red-100 p-3 rounded-lg">
                    <AlertTriangle size={24} className="text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-red-900">
                      {bin.id} is FULL
                    </h3>
                    <div className="flex items-center gap-1 mt-1 text-red-700 text-sm">
                      <MapPin size={14} />
                      <span>{bin.location}</span>
                    </div>
                    <p className="mt-2 text-red-800">
                      Fill level: <span className="font-bold">{bin.fillLevel}%</span> - Immediate collection required
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => dismissAlert(bin.id)}
                  className="p-2 hover:bg-red-100 rounded-lg transition-colors duration-200"
                  aria-label="Dismiss alert"
                >
                  <X size={20} className="text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Alerts;
