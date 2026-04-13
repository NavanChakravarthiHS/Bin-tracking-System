import Alerts from '../components/Alerts/Alerts';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { useBins } from '../hooks/useBins';

const AlertsPage = () => {
  const { allBins, loading } = useBins();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-heading mb-2">
          Alerts & Notifications
        </h2>
        <p className="text-gray-600">
          Monitor bins that require immediate attention
        </p>
      </div>

      {/* Loading State */}
      {loading ? (
        <LoadingSpinner size="large" />
      ) : (
        <Alerts bins={allBins} />
      )}
    </div>
  );
};

export default AlertsPage;
