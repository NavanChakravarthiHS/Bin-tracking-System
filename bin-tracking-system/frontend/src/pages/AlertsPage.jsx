import Alerts from '../components/Alerts/Alerts';

const AlertsPage = () => {
  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-heading tracking-tight">
          Alerts & Notifications
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
          Real-time smart bin threshold monitoring, collector dispatch, and TextBee SMS gateway delivery tracking
        </p>
      </div>

      <Alerts />
    </div>
  );
};

export default AlertsPage;
