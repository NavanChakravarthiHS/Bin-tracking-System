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
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-heading">Collector Management</h2>
          <p className="text-sm text-gray-600 mt-1">Add collectors and assign them to one or more bins</p>
        </div>
        <button type="button" className="btn-primary inline-flex items-center gap-2" onClick={openCreate}>
          <Plus size={18} />
          Add Collector
        </button>
      </div>

      {error && (
        <div className="modern-card p-4 border-red-200 bg-red-50 text-red-700 text-sm font-medium">{error}</div>
      )}
      {success && (
        <div className="modern-card p-4 border-green-200 bg-green-50 text-green-700 text-sm font-medium">{success}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card">
          <p className="text-sm font-medium text-gray-600 mb-2">Collectors</p>
          <p className="text-3xl font-bold text-heading">{collectors.length}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm font-medium text-gray-600 mb-2">Assigned Bins</p>
          <p className="text-3xl font-bold text-heading">{assignedCount}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm font-medium text-gray-600 mb-2">Unassigned Bins</p>
          <p className="text-3xl font-bold text-heading">{bins.length - assignedCount}</p>
        </div>
      </div>

      <form onSubmit={handleReassign} className="modern-card p-5">
        <h3 className="text-sm font-semibold text-heading mb-3">Reassign a bin</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            className="input-field"
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
            className="input-field"
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
          <button type="submit" className="btn-primary">Reassign</button>
        </div>
      </form>

      {collectors.length === 0 ? (
        <div className="modern-card p-10 text-center text-gray-500">
          No collectors yet. Add a collector to start assigning bins.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {collectors.map((collector) => (
            <div key={collector._id} className="modern-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-heading">{collector.name || 'Unnamed collector'}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <Phone size={14} />
                    <span>{collector.mobile}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" className="btn-secondary px-3 py-2" onClick={() => openEdit(collector)} title="Edit">
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    className="btn-secondary px-3 py-2 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => handleDelete(collector)}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-2">
                <Package size={16} className="text-primary-600" />
                <span className="text-sm font-semibold text-heading">{collector.binCount} assigned bin{collector.binCount === 1 ? '' : 's'}</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {collector.assignedBins.length === 0 ? (
                  <span className="text-sm text-gray-500">No bins assigned</span>
                ) : (
                  collector.assignedBins.map((bin) => (
                    <span key={bin.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-800 text-xs font-semibold border border-green-200">
                      <MapPin size={12} />
                      {bin.id} · {bin.location}
                    </span>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200">
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-heading">
                  {editing ? 'Edit Collector' : 'Add Collector'}
                </h3>
                <button type="button" className="text-gray-500 hover:text-gray-800" onClick={() => setModalOpen(false)}>
                  Close
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold text-heading mb-1">Name</label>
                <input
                  className="input-field w-full"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Collector name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-heading mb-1">Mobile number</label>
                <input
                  className="input-field w-full"
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) })}
                  placeholder="10-digit mobile number"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-heading mb-1">
                  {editing ? 'Password (leave blank to keep current)' : 'Password'}
                </label>
                <input
                  type="password"
                  className="input-field w-full"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Minimum 6 characters"
                  required={!editing}
                  minLength={editing ? undefined : 6}
                />
              </div>

              <div>
                <p className="text-sm font-semibold text-heading mb-2">Assign bins</p>
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-64 overflow-y-auto">
                  {bins.length === 0 ? (
                    <p className="p-3 text-sm text-gray-500">No bins available</p>
                  ) : (
                    bins.map((bin) => {
                      const currentOwner = bin.assignedCollectorId
                        ? collectorNameById(collectors, bin.assignedCollectorId)
                        : null;
                      const ownedByOther = currentOwner && editing && String(bin.assignedCollectorId) !== String(editing._id);
                      const ownedByOtherOnCreate = currentOwner && !editing;
                      return (
                        <label key={bin.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            className="mt-1"
                            checked={form.binIds.includes(bin.id)}
                            onChange={() => toggleBin(bin.id)}
                          />
                          <span>
                            <span className="block text-sm font-semibold text-heading">{bin.id} — {bin.location}</span>
                            {(ownedByOther || ownedByOtherOnCreate) && (
                              <span className="block text-xs text-amber-700 mt-0.5">
                                Currently assigned to {currentOwner}. Checking this will reassign the bin.
                              </span>
                            )}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
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
