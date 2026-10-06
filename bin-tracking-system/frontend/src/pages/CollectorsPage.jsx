import { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, Phone, MapPin, Package } from 'lucide-react';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { getToken } from '../auth/adminAuth';
import { API_BASE_URL } from '../config/api';

const API_URL = API_BASE_URL;

const emptyForm = {
  name: '',
  mobile: '',
  password: '',
  binIds: [],
};

function collectorNameById(collectors, collectorId) {
  const match = collectors.find((collector) => String(collector._id) === String(collectorId));
  return match?.name || match?.mobile || 'Unassigned';
}

const CollectorsPage = () => {
  const [collectors, setCollectors] = useState([]);
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [reassignBinId, setReassignBinId] = useState('');
  const [reassignCollectorId, setReassignCollectorId] = useState('');

  const token = getToken();

  const loadData = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/collectors`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Failed to load collectors');
      }
      setCollectors(data.collectors || []);
      setBins(data.bins || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load collectors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const assignedCount = useMemo(
    () => bins.filter((bin) => bin.assignedCollectorId).length,
    [bins]
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
    setError('');
    setSuccess('');
  };

  const openEdit = (collector) => {
    setEditing(collector);
    setForm({
      name: collector.name || '',
      mobile: collector.mobile || '',
      password: '',
      binIds: (collector.assignedBins || []).map((bin) => bin.id),
    });
    setModalOpen(true);
    setError('');
    setSuccess('');
  };

  const toggleBin = (binId) => {
    setForm((prev) => {
      const selected = prev.binIds.includes(binId)
        ? prev.binIds.filter((id) => id !== binId)
        : [...prev.binIds, binId];
      return { ...prev, binIds: selected };
    });
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const payload = {
      name: form.name.trim(),
      mobile: form.mobile.trim(),
      binIds: form.binIds,
    };
    if (form.password) payload.password = form.password;

    try {
      const url = editing
        ? `${API_URL}/admin/collectors/${editing._id}`
        : `${API_URL}/admin/collectors`;
      const response = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save collector');
      }
      setSuccess(data.message || 'Saved');
      setModalOpen(false);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (collector) => {
    const confirmed = window.confirm(`Delete collector ${collector.name || collector.mobile}? Assigned bins will be unassigned.`);
    if (!confirmed) return;

    setError('');
    try {
      const response = await fetch(`${API_URL}/admin/collectors/${collector._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete collector');
      }
      setSuccess('Collector deleted');
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReassign = async (event) => {
    event.preventDefault();
    if (!reassignBinId) return;

    setError('');
    try {
      const response = await fetch(`${API_URL}/admin/bins/${reassignBinId}/assign`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ collectorId: reassignCollectorId || null }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Failed to reassign bin');
      }
      setSuccess(data.message || 'Bin reassigned');
      setReassignBinId('');
      setReassignCollectorId('');
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <LoadingSpinner size="large" />;

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-heading tracking-tight">Collector Management</h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-0.5">Add collectors and assign them to one or more bins</p>
        </div>
        <button type="button" className="btn-primary inline-flex items-center justify-center gap-2 self-start sm:self-auto min-h-[42px]" onClick={openCreate}>
          <Plus size={18} />
          Add Collector
        </button>
      </div>

      {error && (
        <div className="modern-card p-3 sm:p-4 border-red-200 bg-red-50 text-red-700 text-xs sm:text-sm font-medium">{error}</div>
      )}
      {success && (
        <div className="modern-card p-3 sm:p-4 border-green-200 bg-green-50 text-green-700 text-xs sm:text-sm font-medium">{success}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <div className="stat-card p-4 sm:p-5">
          <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Collectors</p>
          <p className="text-2xl sm:text-3xl font-bold text-heading">{collectors.length}</p>
        </div>
        <div className="stat-card p-4 sm:p-5">
          <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Assigned Bins</p>
          <p className="text-2xl sm:text-3xl font-bold text-green-700">{assignedCount}</p>
        </div>
        <div className="stat-card p-4 sm:p-5">
          <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Unassigned Bins</p>
          <p className="text-2xl sm:text-3xl font-bold text-amber-700">{bins.length - assignedCount}</p>
        </div>
      </div>

      <form onSubmit={handleReassign} className="modern-card p-4 sm:p-5">
        <h3 className="text-xs sm:text-sm font-bold text-heading mb-2.5 uppercase tracking-wider">Quick Reassign Bin</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
          <select
            className="input-field text-xs sm:text-sm py-2 sm:py-2.5"
            value={reassignBinId}
            onChange={(e) => setReassignBinId(e.target.value)}
            required
          >
            <option value="">Select bin</option>
            {bins.map((bin) => (
              <option key={bin.id} value={bin.id}>
                {bin.id} — {bin.location}
              </option>
            ))}
          </select>
          <select
            className="input-field text-xs sm:text-sm py-2 sm:py-2.5"
            value={reassignCollectorId}
            onChange={(e) => setReassignCollectorId(e.target.value)}
          >
            <option value="">Unassigned</option>
            {collectors.map((collector) => (
              <option key={collector._id} value={collector._id}>
                {collector.name || collector.mobile}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-primary min-h-[40px] flex items-center justify-center">Reassign</button>
        </div>
      </form>

      {collectors.length === 0 ? (
        <div className="modern-card p-8 sm:p-10 text-center text-gray-500">
          No collectors yet. Add a collector to start assigning bins.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {collectors.map((collector) => (
            <div key={collector._id} className="modern-card p-4 sm:p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-bold text-heading truncate">{collector.name || 'Unnamed collector'}</h3>
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600 mt-1">
                      <Phone size={13} className="text-gray-400 flex-shrink-0" />
                      <span>{collector.mobile}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    <button type="button" className="btn-secondary px-2.5 py-1.5 text-xs inline-flex items-center min-h-[36px]" onClick={() => openEdit(collector)} title="Edit Collector">
                      <Pencil size={14} />
                      <span className="hidden sm:inline ml-1">Edit</span>
                    </button>
                    <button
                      type="button"
                      className="btn-secondary px-2.5 py-1.5 text-xs text-red-600 border-red-200 hover:bg-red-50 inline-flex items-center min-h-[36px]"
                      onClick={() => handleDelete(collector)}
                      title="Delete Collector"
                    >
                      <Trash2 size={14} />
                      <span className="hidden sm:inline ml-1">Delete</span>
                    </button>
                  </div>
                </div>

                <div className="mt-3.5 pt-3 border-t border-gray-100 flex items-center gap-2">
                  <Package size={15} className="text-primary-600" />
                  <span className="text-xs sm:text-sm font-semibold text-heading">{collector.binCount} assigned bin{collector.binCount === 1 ? '' : 's'}</span>
                </div>

                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {collector.assignedBins.length === 0 ? (
                    <span className="text-xs text-gray-400 italic">No bins assigned</span>
                  ) : (
                    collector.assignedBins.map((bin) => (
                      <span key={bin.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-800 text-xs font-semibold border border-green-200 max-w-full truncate">
                        <MapPin size={11} className="flex-shrink-0" />
                        <span className="truncate">{bin.id} · {bin.location}</span>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] my-auto overflow-y-auto border border-gray-200 animate-slide-up">
            <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <h3 className="text-lg sm:text-xl font-bold text-heading">
                  {editing ? 'Edit Collector' : 'Add Collector'}
                </h3>
                <button type="button" className="text-gray-400 hover:text-gray-800 p-1.5 text-2xl font-bold leading-none" onClick={() => setModalOpen(false)}>
                  &times;
                </button>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-heading mb-1">Name</label>
                <input
                  className="input-field w-full text-sm py-2 sm:py-2.5"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Collector full name"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-heading mb-1">Mobile number</label>
                <input
                  className="input-field w-full text-sm py-2 sm:py-2.5"
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) })}
                  placeholder="10-digit mobile number"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-heading mb-1">
                  {editing ? 'Password (leave blank to keep current)' : 'Password'}
                </label>
                <input
                  type="password"
                  className="input-field w-full text-sm py-2 sm:py-2.5"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Minimum 6 characters"
                  required={!editing}
                  minLength={editing ? undefined : 6}
                />
              </div>

              <div>
                <p className="text-xs sm:text-sm font-semibold text-heading mb-2">Assign bins</p>
                <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 max-h-56 sm:max-h-64 overflow-y-auto">
                  {bins.length === 0 ? (
                    <p className="p-3 text-xs text-gray-500">No bins available</p>
                  ) : (
                    bins.map((bin) => {
                      const currentOwner = bin.assignedCollectorId
                        ? collectorNameById(collectors, bin.assignedCollectorId)
                        : null;
                      const ownedByOther = currentOwner && editing && String(bin.assignedCollectorId) !== String(editing._id);
                      const ownedByOtherOnCreate = currentOwner && !editing;
                      return (
                        <label key={bin.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer text-xs sm:text-sm">
                          <input
                            type="checkbox"
                            className="mt-0.5 w-4 h-4 rounded text-green-600 focus:ring-green-500"
                            checked={form.binIds.includes(bin.id)}
                            onChange={() => toggleBin(bin.id)}
                          />
                          <div className="min-w-0 flex-1">
                            <span className="block font-semibold text-heading truncate">{bin.id} — {bin.location}</span>
                            {(ownedByOther || ownedByOtherOnCreate) && (
                              <span className="block text-[11px] text-amber-700 mt-0.5">
                                Currently assigned to {currentOwner}. Checking this will reassign the bin.
                              </span>
                            )}
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 sm:gap-3 pt-3 border-t border-gray-200">
                <button type="button" className="btn-secondary min-h-[42px] w-full sm:w-auto" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary min-h-[42px] w-full sm:w-auto" disabled={saving}>
                  {saving ? 'Saving...' : editing ? 'Save changes' : 'Create collector'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectorsPage;
