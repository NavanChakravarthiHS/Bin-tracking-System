import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, Clock, MapPin, Phone } from 'lucide-react';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import StatusBadge from '../components/Common/StatusBadge';
import { getToken } from '../auth/adminAuth';
import { formatDate, getBinStatus } from '../utils/helpers';
import { API_BASE_URL } from '../config/api';

const API_URL = API_BASE_URL;

const CollectionsPage = () => {
  const [pending, setPending] = useState([]);
  const [collectors, setCollectors] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const token = getToken();

  const loadData = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/collections`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Failed to load collections');
      }
      const resolved = (data.pending || []).map((bin) => ({
        ...bin,
        ...getBinStatus(bin.fillLevel, bin.status, bin),
      }));
      setPending(resolved);
      setCollectors(data.collectors || []);
      setHistory(data.history || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => ({
    full: pending.filter((bin) => bin.status === 'Full').length,
    warning: pending.filter((bin) => bin.status === 'Warning').length,
    unassigned: pending.filter((bin) => !bin.assignedCollectorId).length,
  }), [pending]);

  const assignCollector = async (binId, collectorId) => {
    setSavingId(binId);
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`${API_URL}/admin/bins/${binId}/assign`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ collectorId: collectorId || null }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Failed to assign collector');
      }
      setSuccess(collectorId ? 'Collector assigned' : 'Collector unassigned');
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId('');
    }
  };

  const markCollected = async (bin) => {
    if (!bin.assignedCollectorId) {
      setError(`Assign a collector to ${bin.id} before marking it as collected`);
      return;
    }
    setSavingId(bin.id);
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`${API_URL}/admin/bins/${bin.id}/collect`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ collectorId: bin.assignedCollectorId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Failed to mark as collected');
      }
      setSuccess(`${bin.id} marked as collected`);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId('');
    }
  };

  if (loading) return <LoadingSpinner size="large" />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-heading">Collection Management</h2>
        <p className="text-sm text-gray-600 mt-1">Review Full and Warning bins, assign collectors, and mark collections</p>
      </div>

      {error && (
        <div className="modern-card p-4 border-red-200 bg-red-50 text-red-700 text-sm font-medium">{error}</div>
      )}
      {success && (
        <div className="modern-card p-4 border-green-200 bg-green-50 text-green-700 text-sm font-medium">{success}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card">
          <p className="text-sm font-medium text-gray-600 mb-2">Full bins</p>
          <p className="text-3xl font-bold text-red-700">{stats.full}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm font-medium text-gray-600 mb-2">Warning bins</p>
          <p className="text-3xl font-bold text-amber-700">{stats.warning}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm font-medium text-gray-600 mb-2">Unassigned</p>
          <p className="text-3xl font-bold text-heading">{stats.unassigned}</p>
        </div>
      </div>

      {pending.length === 0 ? (
        <div className="modern-card p-10 text-center">
          <CheckCircle size={40} className="mx-auto text-green-600 mb-3" />
          <p className="text-heading font-semibold">No bins need collection</p>
          <p className="text-sm text-gray-500 mt-1">Full and Warning bins will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((bin, index) => (
            <div
              key={bin.id}
              className={`modern-card p-5 ${bin.cardStyle || ''}`}
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-heading">{bin.id}</h3>
                      <div className="flex items-center gap-1.5 text-sm text-gray-600 mt-1">
                        <MapPin size={14} />
                        <span>{bin.location}</span>
                      </div>
                    </div>
                    <StatusBadge status={bin.status} />
                  </div>
                  <p className="text-sm text-gray-700 mt-3">
                    Fill level: <span className="font-bold">{bin.fillLevel}%</span>
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Assigned collector:{' '}
                    <span className="font-semibold text-heading">
                      {bin.assignedCollectorName || bin.assignedCollectorMobile || 'Unassigned'}
                    </span>
                    {bin.assignedCollectorMobile && (
                      <span className="inline-flex items-center gap-1 ml-2 text-gray-500">
                        <Phone size={12} />
                        {bin.assignedCollectorMobile}
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 lg:w-96">
                  <select
                    className="input-field flex-1"
                    value={bin.assignedCollectorId || ''}
                    disabled={savingId === bin.id}
                    onChange={(e) => assignCollector(bin.id, e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {collectors.map((collector) => (
                      <option key={collector._id} value={collector._id}>
                        {collector.name || collector.mobile}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn-primary inline-flex items-center justify-center gap-2 whitespace-nowrap"
                    disabled={savingId === bin.id}
                    onClick={() => markCollected(bin)}
                  >
                    <CheckCircle size={16} />
                    {savingId === bin.id ? 'Saving...' : 'Mark as Collected'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="modern-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={18} className="text-primary-600" />
          <h3 className="text-sm font-semibold text-heading">Recent collections</h3>
        </div>
        {history.length === 0 ? (
          <p className="text-sm text-gray-500">No collections recorded yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="py-2 pr-3 font-semibold">Bin</th>
                  <th className="py-2 pr-3 font-semibold">Location</th>
                  <th className="py-2 pr-3 font-semibold">Collector</th>
                  <th className="py-2 font-semibold">Date & time</th>
                </tr>
              </thead>
              <tbody>
                {history.map((record) => (
                  <tr key={record._id} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 pr-3 font-semibold text-heading">{record.binId}</td>
                    <td className="py-2 pr-3 text-gray-700">{record.location}</td>
                    <td className="py-2 pr-3 text-gray-700">
                      {record.collectorName || record.collectorMobile || 'Unknown'}
                    </td>
                    <td className="py-2 text-gray-700">{formatDate(record.collectedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectionsPage;
