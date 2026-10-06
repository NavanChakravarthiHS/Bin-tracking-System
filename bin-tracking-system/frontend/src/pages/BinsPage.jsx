import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapPin, Pencil, Plus, Power, PowerOff, Search, Trash2, SlidersHorizontal, AlertTriangle, AlertOctagon, CheckCircle2, Radio } from 'lucide-react';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import StatusBadge from '../components/Common/StatusBadge';
import { getToken } from '../auth/adminAuth';
import { getBinStatus } from '../utils/helpers';
import { API_BASE_URL } from '../config/api';

const API_URL = API_BASE_URL;

const emptyForm = {
  id: '',
  location: '',
  latitude: '',
  longitude: '',
  warningThreshold: 50,
  fullThreshold: 80,
  blynkPin: '',
};

const BinsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const token = getToken();

  const loadData = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/bins?includeInactive=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Failed to load bins');
      }
      const loadedBins = (data.bins || []).map((bin) => ({ ...bin, ...getBinStatus(bin.fillLevel, bin.status, bin) }));
      setBins(loadedBins);
      setError('');
      return loadedBins;
    } catch (err) {
      setError(err.message || 'Failed to load bins');
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData().then((loaded) => {
      const action = searchParams.get('action');
      const editId = searchParams.get('edit');
      if (action === 'add') {
        openCreate();
      } else if (editId && loaded.length > 0) {
        const target = loaded.find((b) => b.id === editId);
        if (target) openEdit(target);
      }
    });
  }, []);

  const stats = useMemo(() => {
    const activeCount = bins.filter(
      (bin) => bin.isActive !== false && (bin.deviceStatus === 'Active' || bin.sensorConnected === true)
    ).length;
    const inactiveCount = bins.length - activeCount;

    return {
      total: bins.length,
      active: activeCount,
      inactive: inactiveCount,
    };
  }, [bins]);

  const filteredBins = useMemo(() => {
    return bins.filter((bin) => {
      const matchesSearch =
        bin.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bin.location.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (filterStatus === 'All') return true;
      if (filterStatus === 'Active') return bin.isActive !== false && (bin.deviceStatus === 'Active' || bin.sensorConnected === true);
      if (filterStatus === 'Inactive') return bin.isActive === false || bin.deviceStatus === 'Inactive' || bin.sensorConnected === false;
      return bin.status === filterStatus;
    });
  }, [bins, searchTerm, filterStatus]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
    setError('');
    setSuccess('');
  };

  const openEdit = (bin) => {
    setEditing(bin);
    setForm({
      id: bin.id || '',
      location: bin.location || '',
      latitude: bin.latitude ?? '',
      longitude: bin.longitude ?? '',
      warningThreshold: bin.warningThreshold ?? 50,
      fullThreshold: bin.fullThreshold ?? 80,
      blynkPin: bin.blynkPin || '',
    });
    setFormError('');
    setModalOpen(true);
    setError('');
    setSuccess('');
  };

  const closeModal = () => {
    setModalOpen(false);
    setSearchParams({});
  };

  const payload = () => ({
    id: form.id.trim().toUpperCase(),
    location: form.location.trim(),
    latitude: Number(form.latitude),
    longitude: Number(form.longitude),
    warningThreshold: Number(form.warningThreshold),
    fullThreshold: Number(form.fullThreshold),
    blynkPin: form.blynkPin ? form.blynkPin.trim() : null,
  });

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    setError('');
    setSuccess('');

    const wt = Number(form.warningThreshold);
    const ft = Number(form.fullThreshold);
    if (wt >= ft) {
      setFormError('Warning threshold must be lower than full threshold.');
      setSaving(false);
      return;
    }

    try {
      const url = editing
        ? `${API_URL}/admin/bins/${editing.id}`
        : `${API_URL}/admin/bins`;
      const response = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload()),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save bin');
      }
      setSuccess(data.message || 'Saved successfully');
      closeModal();
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to save bin');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (bin) => {
    const next = bin.isActive === false;
    setError('');
    try {
      const response = await fetch(`${API_URL}/admin/bins/${bin.id}/active`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: next }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update bin');
      }
      setSuccess(data.message || (next ? 'Bin activated' : 'Bin deactivated'));
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (bin) => {
    const confirmed = window.confirm(`Are you sure you want to delete bin ${bin.id}? This will permanently remove it from MongoDB.`);
    if (!confirmed) return;
    setError('');
    try {
      const response = await fetch(`${API_URL}/admin/bins/${bin.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete bin');
      }
      setSuccess(`Bin ${bin.id} deleted successfully`);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <LoadingSpinner size="large" />;

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-heading tracking-tight">Bin Management</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-0.5">Add, edit, deactivate, delete, and configure fill-level thresholds saved in MongoDB</p>
        </div>
        <button type="button" className="btn-primary inline-flex items-center justify-center gap-2 self-start sm:self-auto min-h-[42px]" onClick={openCreate}>
          <Plus size={18} />
          Add New Bin
        </button>
      </div>

      {/* Global Alerts */}
      {error && (
        <div className="modern-card p-3 sm:p-4 border-red-200 bg-red-50 text-red-700 text-xs sm:text-sm font-medium flex items-center justify-between">
          <span>{error}</span>
          <button type="button" className="text-red-500 font-bold ml-2 p-1" onClick={() => setError('')}>×</button>
        </div>
      )}
      {success && (
        <div className="modern-card p-3 sm:p-4 border-green-200 bg-green-50 text-green-700 text-xs sm:text-sm font-medium flex items-center justify-between">
          <span>{success}</span>
          <button type="button" className="text-green-500 font-bold ml-2 p-1" onClick={() => setSuccess('')}>×</button>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <div className="stat-card p-4 sm:p-5">
          <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total Monitored Bins</p>
          <p className="text-2xl sm:text-3xl font-bold text-heading">{stats.total}</p>
          <p className="text-[11px] sm:text-xs text-gray-500 mt-1.5">Stored in MongoDB database</p>
        </div>
        <div className="stat-card p-4 sm:p-5">
          <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Active Devices</p>
          <p className="text-2xl sm:text-3xl font-bold text-green-700">{stats.active}</p>
          <p className="text-[11px] sm:text-xs text-gray-500 mt-1.5">Receiving live sensor data</p>
        </div>
        <div className="stat-card p-4 sm:p-5">
          <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Inactive / Disconnected</p>
          <p className="text-2xl sm:text-3xl font-bold text-red-600">{stats.inactive}</p>
          <p className="text-[11px] sm:text-xs text-gray-500 mt-1.5">No sensor data for &ge; 2 minutes</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="modern-card p-3.5 sm:p-4 flex flex-col md:flex-row gap-3 sm:gap-4 items-stretch md:items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            className="input-field w-full pl-9 text-xs sm:text-sm py-2 sm:py-2.5"
            placeholder="Search by Bin ID or Location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-1.5 sm:gap-2 w-full md:w-auto">
          {['All', 'Active', 'Inactive', 'Normal', 'Warning', 'Full'].map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setFilterStatus(filter)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 border ${
                filterStatus === filter
                  ? 'bg-green-600 text-white border-green-600 shadow-sm'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Bins Grid */}
      {filteredBins.length === 0 ? (
        <div className="modern-card p-8 sm:p-12 text-center text-gray-500">
          <p className="text-sm sm:text-base font-medium">No bins found matching your filter criteria.</p>
          <button type="button" className="btn-secondary mt-4 inline-flex items-center gap-2" onClick={openCreate}>
            <Plus size={16} /> Add Bin
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {filteredBins.map((bin) => (
            <div
              key={bin.id}
              className={`modern-card p-4 sm:p-5 transition-all duration-200 ${
                bin.isActive === false ? 'opacity-70 bg-gray-50/50' : 'bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-2 sm:gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold text-heading">{bin.id}</h3>
                    {bin.isActive === false && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 font-semibold">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600 mt-1">
                    <MapPin size={13} className="text-green-600 flex-shrink-0" />
                    <span className="font-medium truncate" title={bin.location}>{bin.location}</span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <StatusBadge status={bin.isActive === false ? 'Inactive' : bin.status} />
                </div>
              </div>

              {/* Threshold & Coordinates Detail Box */}
              <div className="mt-3.5 p-3 bg-gray-50 rounded-lg border border-gray-200/80 grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-xs text-gray-600">
                <div>
                  <span className="font-semibold text-gray-700 block">Coordinates</span>
                  <span className="font-mono text-[11px]">{Number(bin.latitude).toFixed(6)}, {Number(bin.longitude).toFixed(6)}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700 block">Fill Level</span>
                  <span className="font-bold text-heading text-sm">{bin.fillLevel}%</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700 block">Thresholds</span>
                  <span className="text-amber-600 font-medium">Warn: {bin.warningThreshold ?? 50}%</span> · <span className="text-red-600 font-medium">Full: {bin.fullThreshold ?? 80}%</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700 block">Hardware / IoT</span>
                  <span className="truncate block">{bin.blynkPin ? `Blynk ${bin.blynkPin}` : 'No Pin'} ({bin.deviceStatus || 'Inactive'})</span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-3.5 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-secondary px-2.5 sm:px-3 py-1.5 text-xs inline-flex items-center gap-1.5 min-h-[36px]"
                    onClick={() => openEdit(bin)}
                  >
                    <Pencil size={13} />
                    Edit
                  </button>
                  <button
                    type="button"
                    className={`btn-secondary px-2.5 sm:px-3 py-1.5 text-xs inline-flex items-center gap-1.5 min-h-[36px] ${
                      bin.isActive === false ? 'text-green-700 border-green-300' : 'text-amber-700 border-amber-300'
                    }`}
                    onClick={() => toggleActive(bin)}
                  >
                    {bin.isActive === false ? <Power size={13} className="text-green-600" /> : <PowerOff size={13} className="text-amber-600" />}
                    {bin.isActive === false ? 'Activate' : 'Deactivate'}
                  </button>
                </div>

                <button
                  type="button"
                  className="btn-secondary px-2.5 sm:px-3 py-1.5 text-xs text-red-600 border-red-200 hover:bg-red-50 inline-flex items-center gap-1.5 min-h-[36px]"
                  onClick={() => handleDelete(bin)}
                >
                  <Trash2 size={13} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Bin Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] my-auto overflow-y-auto border border-gray-200 animate-slide-up">
            <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={20} className="text-green-600" />
                  <h3 className="text-lg sm:text-xl font-bold text-heading">{editing ? `Edit Bin ${editing.id}` : 'Add New Bin'}</h3>
                </div>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg text-2xl font-bold leading-none"
                  onClick={closeModal}
                  aria-label="Close modal"
                >
                  &times;
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-lg font-medium">
                  {formError}
                </div>
              )}

              {/* Bin ID & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-heading mb-1">
                    Bin ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="input-field w-full uppercase text-sm py-2 sm:py-2.5"
                    value={form.id}
                    onChange={(e) => setForm({ ...form, id: e.target.value.toUpperCase() })}
                    placeholder="e.g. BIN005"
                    required
                  />
                  <p className="text-[11px] text-gray-500 mt-1">Unique identifier (3-20 characters)</p>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-heading mb-1">
                    Location Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="input-field w-full text-sm py-2 sm:py-2.5"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="e.g. College Library - 2nd Floor"
                    required
                  />
                  <p className="text-[11px] text-gray-500 mt-1">Human-readable physical placement</p>
                </div>
              </div>

              {/* Coordinates */}
              <div className="border border-gray-200 rounded-xl p-3.5 sm:p-4 bg-gray-50/50 space-y-3">
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-heading">
                  <MapPin size={16} className="text-green-600" />
                  <span>Geographic Coordinates</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Latitude (-90 to 90) <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="input-field w-full bg-white text-sm py-2 sm:py-2.5"
                      type="number"
                      step="any"
                      placeholder="12.884826"
                      value={form.latitude}
                      onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Longitude (-180 to 180) <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="input-field w-full bg-white text-sm py-2 sm:py-2.5"
                      type="number"
                      step="any"
                      placeholder="76.167055"
                      value={form.longitude}
                      onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Fill-level Thresholds */}
              <div className="border border-gray-200 rounded-xl p-3.5 sm:p-4 bg-gray-50/50 space-y-2.5 sm:space-y-3">
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-heading">
                  <AlertTriangle size={16} className="text-amber-500" />
                  <span>Fill-Level Thresholds (%)</span>
                </div>
                <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed">
                  Configure triggers: status turns <span className="text-amber-600 font-semibold">Warning</span> at Warning threshold, and <span className="text-red-600 font-semibold">Full</span> at Full threshold.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-amber-700 mb-1">
                      Warning Threshold (%) <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="input-field w-full bg-white text-sm py-2 sm:py-2.5"
                      type="number"
                      min="1"
                      max="99"
                      value={form.warningThreshold}
                      onChange={(e) => setForm({ ...form, warningThreshold: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-red-700 mb-1">
                      Full Threshold (%) <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="input-field w-full bg-white text-sm py-2 sm:py-2.5"
                      type="number"
                      min="2"
                      max="100"
                      value={form.fullThreshold}
                      onChange={(e) => setForm({ ...form, fullThreshold: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Blynk IoT Virtual Pin */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-heading mb-1">
                  Blynk Virtual Pin (Optional)
                </label>
                <input
                  className="input-field w-full text-sm py-2 sm:py-2.5"
                  value={form.blynkPin}
                  onChange={(e) => setForm({ ...form, blynkPin: e.target.value })}
                  placeholder="e.g. V0, V1"
                />
                <p className="text-[11px] text-gray-500 mt-1">Attach to hardware sensor pin for live IoT telemetry updates</p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 sm:gap-3 pt-3 border-t border-gray-200">
                <button type="button" className="btn-secondary min-h-[42px] w-full sm:w-auto" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary min-h-[42px] w-full sm:w-auto" disabled={saving}>
                  {saving ? 'Saving to MongoDB...' : editing ? 'Update Bin' : 'Create & Save Bin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BinsPage;

