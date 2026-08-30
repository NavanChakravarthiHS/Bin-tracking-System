import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, CheckCircle, AlertTriangle, AlertOctagon, Filter, PackageOpen, Plus, Settings } from 'lucide-react';
import Dashboard from '../components/Dashboard/Dashboard';
import FilterBar from '../components/Common/FilterBar';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { useBins } from '../hooks/useBins';

const DashboardPage = ({ searchTerm }) => {
  const [activeFilter, setActiveFilter] = useState('All');
  const { bins, loading, allBins } = useBins(searchTerm, activeFilter);

  // Calculate stats
  const stats = {
    total: allBins.length,
    normal: allBins.filter(b => b.status === 'Normal').length,
    warning: allBins.filter(b => b.status === 'Warning').length,
    full: allBins.filter(b => b.status === 'Full').length,
    collected: allBins.filter(b => b.status === 'Collected').length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-heading">Live Waste Monitoring</h1>
          <p className="text-sm text-gray-600 mt-1">Real-time bin telemetry, fill levels, and status tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/bins" className="btn-secondary inline-flex items-center gap-2 text-xs py-2 px-3">
            <Settings size={16} />
            Manage Bins
          </Link>
          <Link to="/bins?action=add" className="btn-primary inline-flex items-center gap-2 text-xs py-2 px-3">
            <Plus size={16} />
            Add Bin
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Total Bins */}
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Total Bins</p>
              <p className="text-3xl font-bold text-heading">{stats.total}</p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-xl">
              <Trash2 size={32} className="text-white" strokeWidth={2.5} />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-600">All monitored bins</p>
          </div>
        </div>

        {/* Normal Bins */}
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Normal</p>
              <p className="text-3xl font-bold text-green-700">{stats.normal}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-lg">
              <CheckCircle size={24} className="text-white" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-600">Operating normally</p>
          </div>
        </div>

        {/* Warning Bins */}
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Warning</p>
              <p className="text-3xl font-bold text-amber-700">{stats.warning}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center shadow-lg">
              <AlertTriangle size={24} className="text-white" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-600">Needs attention soon</p>
          </div>
        </div>

        {/* Full Bins */}
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Full</p>
              <p className="text-3xl font-bold text-red-700">{stats.full}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg">
              <AlertOctagon size={24} className="text-white" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-600">Requires immediate pickup</p>
          </div>
        </div>

        {/* Collected Bins */}
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Collected</p>
              <p className="text-3xl font-bold text-gray-600">{stats.collected}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center shadow-lg">
              <PackageOpen size={24} className="text-white" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-600">Recently collected</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="eco-card p-4">
        <div className="flex items-center gap-3 mb-4">
          <Filter size={18} className="text-primary-600" />
          <h3 className="text-sm font-semibold text-primary-800">Filter Bins</h3>
        </div>
        <FilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter} />
      </div>

      {/* Loading State */}
      {loading ? (
        <LoadingSpinner size="large" />
      ) : (
        <Dashboard bins={bins} />
      )}
    </div>
  );
};

export default DashboardPage;
