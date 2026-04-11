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
        <div className="inline-block p-6 bg-green-100 dark:bg-green-900 rounded-full mb-4">
          <AlertTriangle size={48} className="text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          All Clear!
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Active Alerts
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {activeAlerts.length} of {fullBins.length} alerts showing
          </p>
        </div>
        {activeAlerts.length > 0 && (
          <button
            onClick={clearAllAlerts}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Alert Cards */}
      {activeAlerts.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-dark-border">
          <p className="text-gray-600 dark:text-gray-400">All alerts have been dismissed</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeAlerts.map((bin, index) => (
            <div
              key={bin.id}
              className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg p-5 animate-fade-in hover:shadow-lg transition-all duration-300"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="bg-red-100 dark:bg-red-800 p-3 rounded-lg">
                    <AlertTriangle size={24} className="text-red-600 dark:text-red-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-red-900 dark:text-red-100">
                      {bin.id} is FULL
                    </h3>
                    <div className="flex items-center gap-1 mt-1 text-red-700 dark:text-red-300 text-sm">
                      <MapPin size={14} />
                      <span>{bin.location}</span>
                    </div>
                    <p className="mt-2 text-red-800 dark:text-red-200">
                      Fill level: <span className="font-bold">{bin.fillLevel}%</span> - Immediate collection required
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => dismissAlert(bin.id)}
                  className="p-2 hover:bg-red-100 dark:hover:bg-red-800 rounded-lg transition-colors duration-200"
                  aria-label="Dismiss alert"
                >
                  <X size={20} className="text-red-600 dark:text-red-300" />
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
