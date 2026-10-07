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
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-heading tracking-tight">Collection Management</h2>
        <p className="text-xs sm:text-sm text-gray-600 mt-0.5">Review Full and Warning bins, assign collectors, and mark collections</p>
      </div>

      {error && (
        <div className="modern-card p-3 sm:p-4 border-red-200 bg-red-50 text-red-700 text-xs sm:text-sm font-medium">{error}</div>
      )}
      {success && (
        <div className="modern-card p-3 sm:p-4 border-green-200 bg-green-50 text-green-700 text-xs sm:text-sm font-medium">{success}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <div className="stat-card p-4 sm:p-5">
          <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Full bins</p>
          <p className="text-2xl sm:text-3xl font-bold text-red-700">{stats.full}</p>
        </div>
        <div className="stat-card p-4 sm:p-5">
          <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Warning bins</p>
          <p className="text-2xl sm:text-3xl font-bold text-amber-700">{stats.warning}</p>
        </div>
        <div className="stat-card p-4 sm:p-5">
          <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Unassigned</p>
          <p className="text-2xl sm:text-3xl font-bold text-heading">{stats.unassigned}</p>
        </div>
      </div>

      {pending.length === 0 ? (
        <div className="modern-card p-8 sm:p-10 text-center">
          <CheckCircle size={36} className="mx-auto text-green-600 mb-2.5" />
          <p className="text-heading font-bold text-sm sm:text-base">No bins need collection</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Full and Warning bins will automatically appear here</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {pending.map((bin, index) => (
            <div
              key={bin.id}
              className={`modern-card p-4 sm:p-5 ${bin.cardStyle || ''}`}
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg font-bold text-heading truncate">{bin.id}</h3>
                      <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600 mt-0.5">
                        <MapPin size={13} className="text-primary-600 flex-shrink-0" />
                        <span className="truncate">{bin.location}</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <StatusBadge status={bin.status} />
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-700 mt-2">
                    Fill level: <span className="font-bold text-heading">{bin.fillLevel}%</span>
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 mt-0.5 truncate">
                    Assigned collector:{' '}
                    <span className="font-semibold text-heading">
                      {bin.assignedCollectorName || bin.assignedCollectorMobile || 'Unassigned'}
                    </span>
                    {bin.assignedCollectorMobile && (
                      <span className="inline-flex items-center gap-1 ml-2 text-gray-500">
                        <Phone size={11} />
                        {bin.assignedCollectorMobile}
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 w-full lg:w-96 flex-shrink-0">
                  <select
                    className="input-field flex-1 text-xs sm:text-sm py-2 sm:py-2.5"
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
                    className="btn-primary inline-flex items-center justify-center gap-1.5 whitespace-nowrap min-h-[40px] text-xs sm:text-sm"
                    disabled={savingId === bin.id}
                    onClick={() => markCollected(bin)}
                  >
                    <CheckCircle size={15} />
                    {savingId === bin.id ? 'Saving...' : 'Mark Collected'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="modern-card p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <Clock size={16} className="text-primary-600" />
          <h3 className="text-xs sm:text-sm font-bold text-heading uppercase tracking-wider">Smart Collection Verification History</h3>
        </div>
        {history.length === 0 ? (
          <p className="text-xs sm:text-sm text-gray-500 py-4 text-center">No collections recorded yet</p>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full text-xs sm:text-sm min-w-[650px]">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="py-2.5 pr-3 font-semibold">Bin ID</th>
                  <th className="py-2.5 pr-3 font-semibold">Location</th>
                  <th className="py-2.5 pr-3 font-semibold">Collector</th>
                  <th className="py-2.5 pr-3 font-semibold">Fill Drop (Before ➔ After)</th>
                  <th className="py-2.5 pr-3 font-semibold">Verification Status</th>
                  <th className="py-2.5 pr-3 font-semibold">Duration</th>
                  <th className="py-2.5 font-semibold">Time</th>
                </tr>
              </thead>
              <tbody>
                {history.map((record) => {
                  const status = record.verificationStatus || 'VERIFIED';
                  const isVerified = status === 'VERIFIED';
                  const isPending = status === 'PENDING';
                  const isFailed = status === 'FAILED';

                  return (
                    <tr key={record._id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition-colors">
                      <td className="py-2.5 pr-3 font-bold text-heading">{record.binId}</td>
                      <td className="py-2.5 pr-3 text-gray-700 max-w-44 truncate">{record.location}</td>
                      <td className="py-2.5 pr-3 text-gray-700">
                        {record.collectorName || record.collectorMobile || 'Unknown'}
                      </td>
                      <td className="py-2.5 pr-3 font-semibold text-gray-800">
                        {record.fillLevelBefore != null ? `${record.fillLevelBefore}%` : '—'} ➔{' '}
                        <span className={isVerified ? 'text-green-700 font-bold' : isFailed ? 'text-red-700 font-bold' : 'text-amber-700'}>
                          {record.fillLevelAfter != null ? `${record.fillLevelAfter}%` : isPending ? 'Verifying...' : '—'}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 whitespace-nowrap">
                        {isVerified && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-green-100 text-green-800 border border-green-300">
                            <CheckCircle size={12} className="text-green-600" />
                            VERIFIED ✅
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                            <Clock size={12} className="text-amber-600 animate-spin" />
                            PENDING ⏳
                          </span>
                        )}
                        {isFailed && (
                          <div className="flex flex-col">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-red-100 text-red-800 border border-red-300">
                              FAILED ❌
                            </span>
                            {record.failureReason && (
                              <span className="text-[10px] text-red-600 font-medium mt-0.5 max-w-[200px] truncate" title={record.failureReason}>
                                {record.failureReason}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 text-gray-600 font-medium whitespace-nowrap">
                        {record.collectionDurationSeconds ? `${record.collectionDurationSeconds}s` : '—'}
                      </td>
                      <td className="py-2.5 text-gray-600 whitespace-nowrap">{formatDate(record.verifiedAt || record.collectedAt || record.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectionsPage;
