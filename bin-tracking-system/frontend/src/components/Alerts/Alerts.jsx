import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  XCircle,
  Smartphone,
  MessageSquare,
  RefreshCw,
  MapPin,
  User,
  Clock,
  X,
  ShieldAlert,
  Info
} from 'lucide-react';
import { getToken } from '../../auth/adminAuth';
import LoadingSpinner from '../Common/LoadingSpinner';

const API_URL = 'http://localhost:5000';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, critical: 0, warning: 0, failedNotifications: 0 });
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState(null);
  const [filter, setFilter] = useState('ALL'); // ALL, CRITICAL, WARNING, FAILED
  const [statusFilter, setStatusFilter] = useState('ACTIVE'); // ACTIVE, ALL, RESOLVED
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const token = getToken();

  const fetchAlerts = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (statusFilter !== 'ALL') queryParams.set('status', statusFilter);
      if (filter === 'CRITICAL' || filter === 'WARNING') queryParams.set('severity', filter);

      const res = await fetch(`${API_URL}/admin/alerts?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setAlerts(data.alerts || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(() => fetchAlerts(true), 5000);
    return () => clearInterval(interval);
  }, [filter, statusFilter]);

  const handleRetry = async (alertId) => {
    setRetryingId(alertId);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_URL}/admin/alerts/${alertId}/retry`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSuccessMsg(data.message || 'Notification retried successfully!');
        await fetchAlerts(true);
      } else {
        setErrorMsg(data.message || 'Failed to retry notification.');
      }
    } catch (err) {
      setErrorMsg('Network error while retrying notification.');
    } finally {
      setRetryingId(null);
    }
  };

  const handleDismiss = async (alertId) => {
    try {
      const res = await fetch(`${API_URL}/admin/alerts/${alertId}/dismiss`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchAlerts(true);
      }
    } catch (err) {
      console.error('Failed to dismiss alert:', err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to dismiss all active alerts?')) return;
    try {
      const res = await fetch(`${API_URL}/admin/alerts/clear`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSuccessMsg('All active alerts dismissed.');
        await fetchAlerts(true);
      }
    } catch (err) {
      console.error('Failed to clear alerts:', err);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'FAILED') {
      return alert.smsStatus === 'FAILED';
    }
    return true;
  });

  const getDeliveryBadge = (channel, status, error) => {
    switch (status) {
      case 'SENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-300">
            <CheckCircle size={13} className="text-green-600" />
            {channel}: SENT
          </span>
        );
      case 'FAILED':
        return (
          <div className="flex flex-col gap-0.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
              <XCircle size={13} className="text-red-600" />
              {channel}: FAILED
            </span>
            {error && (
              <span className="text-[11px] text-red-600 font-medium ml-1 max-w-[220px] truncate" title={error}>
                {error}
              </span>
            )}
          </div>
        );
      case 'SKIPPED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-300">
            <Info size={13} className="text-gray-500" />
            {channel}: SKIPPED
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <RefreshCw size={13} className="text-amber-600 animate-spin" />
            {channel}: SENDING
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-500 border border-gray-200">
            {channel}: NOT SENT
          </span>
        );
    }
  };

  if (loading && alerts.length === 0) {
    return <LoadingSpinner size="large" />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Feedback */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm font-semibold flex items-center justify-between">
          <span>{successMsg}</span>
          <button type="button" onClick={() => setSuccessMsg('')}><X size={16} /></button>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-semibold flex items-center justify-between">
          <span>{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg('')}><X size={16} /></button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="modern-card p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Alerts</p>
            <p className="text-2xl font-black text-heading mt-1">{stats.active}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <ShieldAlert size={24} />
          </div>
        </div>

        <div className="modern-card p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Critical (90%+)</p>
            <p className="text-2xl font-black text-red-600 mt-1">{stats.critical}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="modern-card p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Warning (80–89%)</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{stats.warning}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <AlertCircle size={24} />
          </div>
        </div>

        <div className="modern-card p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Failed Dispatches</p>
            <p className="text-2xl font-black text-purple-700 mt-1">{stats.failedNotifications}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <Smartphone size={24} />
          </div>
        </div>
      </div>

      {/* Action & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-soft">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filter === 'ALL' ? 'bg-primary-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Severity
          </button>
          <button
            type="button"
            onClick={() => setFilter('CRITICAL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filter === 'CRITICAL' ? 'bg-red-600 text-white shadow-sm' : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
            }`}
          >
            Critical Only
          </button>
          <button
            type="button"
            onClick={() => setFilter('WARNING')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filter === 'WARNING' ? 'bg-amber-600 text-white shadow-sm' : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            Warning Only
          </button>
          <button
            type="button"
            onClick={() => setFilter('FAILED')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filter === 'FAILED' ? 'bg-purple-600 text-white shadow-sm' : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
            }`}
          >
            Failed Dispatches
          </button>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="ACTIVE">Active Alerts</option>
            <option value="ALL">All Statuses (History)</option>
            <option value="RESOLVED">Resolved / Emptied</option>
          </select>

          {stats.active > 0 && statusFilter === 'ACTIVE' && (
            <button
              type="button"
              onClick={handleClearAll}
              className="px-3 py-2 text-xs font-bold rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700 transition-colors whitespace-nowrap"
            >
              Clear All Active
            </button>
          )}
        </div>
      </div>

      {/* Alert Feed */}
      {filteredAlerts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-soft">
          <div className="inline-block p-4 bg-green-50 rounded-full mb-3 text-green-600">
            <CheckCircle size={36} />
          </div>
          <h3 className="text-lg font-bold text-heading">All Clear!</h3>
          <p className="text-sm text-gray-500 mt-1">No active alerts matching the selected filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert, index) => {
            const isCritical = alert.severity === 'CRITICAL';
            const hasCollector = Boolean(alert.collectorName || alert.collectorMobile);
            const hasFailed = alert.smsStatus === 'FAILED';

            return (
              <div
                key={alert._id || index}
                className={`modern-card p-5 border-l-4 transition-all duration-200 ${
                  isCritical ? 'border-l-red-600 bg-red-50/20' : 'border-l-amber-500 bg-amber-50/20'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Bin & Location Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-lg font-black text-heading">{alert.binId}</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wide ${
                          isCritical
                            ? 'bg-red-600 text-white'
                            : 'bg-amber-500 text-white'
                        }`}
                      >
                        {isCritical ? <AlertTriangle size={12} /> : <AlertCircle size={12} />}
                        {alert.severity}
                      </span>
                      {alert.status === 'RESOLVED' && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-700">
                          RESOLVED
                        </span>
                      )}
                      {alert.status === 'DISMISSED' && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                          DISMISSED
                        </span>
                      )}
                      <span className="text-xs text-gray-500 flex items-center gap-1 ml-auto lg:ml-2">
                        <Clock size={13} />
                        {formatDate(alert.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <MapPin size={15} className="text-primary-600 flex-shrink-0" />
                      <span className="font-semibold">{alert.location}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-600 font-medium">
                        Fill Level: <strong className={isCritical ? 'text-red-700' : 'text-amber-700'}>{alert.fillLevel}%</strong>
                      </span>
                    </div>

                    {/* Collector Info */}
                    <div className="flex items-center gap-2 text-sm">
                      <User size={15} className={hasCollector ? 'text-gray-600' : 'text-amber-600'} />
                      {hasCollector ? (
                        <span className="text-gray-800 font-medium">
                          Collector: <strong>{alert.collectorName || 'Assigned'}</strong> ({alert.collectorMobile})
                        </span>
                      ) : (
                        <span className="text-amber-700 font-semibold flex items-center gap-1">
                          No collector assigned to this bin
                        </span>
                      )}
                    </div>

                    {/* Admin Note if present */}
                    {alert.adminNote && (
                      <p className="text-xs text-gray-600 bg-gray-100 px-2.5 py-1 rounded inline-block">
                        Note: {alert.adminNote}
                      </p>
                    )}
                  </div>

                  {/* Middle Column: Delivery Status Badges */}
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2 min-w-[200px] border-t lg:border-t-0 lg:border-l border-gray-200 pt-3 lg:pt-0 lg:pl-4">
                    <div className="flex items-center gap-2">
                      <Smartphone size={16} className="text-primary-600 flex-shrink-0" />
                      {getDeliveryBadge('TextBee SMS', alert.smsStatus, alert.smsError)}
                    </div>
                  </div>

                  {/* Right Column: Actions (Retry & Dismiss) */}
                  <div className="flex items-center gap-2 self-end lg:self-center">
                    {(hasFailed || (isCritical && alert.smsStatus !== 'SENT')) && (
                      <button
                        type="button"
                        onClick={() => handleRetry(alert._id)}
                        disabled={retryingId === alert._id}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold transition-colors disabled:opacity-50 shadow-sm"
                        title="Retry sending SMS via TextBee"
                      >
                        <RefreshCw size={14} className={retryingId === alert._id ? 'animate-spin' : ''} />
                        {retryingId === alert._id ? 'Retrying...' : 'Retry SMS'}
                      </button>
                    )}

                    {alert.status === 'ACTIVE' && (
                      <button
                        type="button"
                        onClick={() => handleDismiss(alert._id)}
                        className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Dismiss Alert"
                        aria-label="Dismiss alert"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Alerts;
