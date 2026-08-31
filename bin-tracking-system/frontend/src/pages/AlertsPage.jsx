import Alerts from '../components/Alerts/Alerts';

const AlertsPage = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-black text-heading mb-1">
          Alerts & Notifications
        </h2>
        <p className="text-gray-600 text-sm">
          Real-time smart bin threshold monitoring, collector dispatch, and TextBee SMS gateway delivery tracking
        </p>
      </div>

      <Alerts />
    </div>
  );
};

export default AlertsPage;
