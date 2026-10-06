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
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-heading tracking-tight">Live Waste Monitoring</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-0.5">Real-time bin telemetry, fill levels, and status tracking</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Link to="/bins" className="btn-secondary inline-flex items-center gap-1.5 text-xs py-2 px-3 min-h-[38px]">
            <Settings size={15} />
            Manage Bins
          </Link>
          <Link to="/bins?action=add" className="btn-primary inline-flex items-center gap-1.5 text-xs py-2 px-3 min-h-[38px]">
            <Plus size={15} />
            Add Bin
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
        {/* Total Bins */}
        <div className="stat-card p-4 sm:p-5 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total Bins</p>
              <p className="text-2xl sm:text-3xl font-bold text-heading">{stats.total}</p>
            </div>
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
              <Trash2 size={24} className="text-white" strokeWidth={2.5} />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-[11px] sm:text-xs text-gray-500 truncate">All monitored bins</p>
          </div>
        </div>

        {/* Normal Bins */}
        <div className="stat-card p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Normal</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-700">{stats.normal}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md">
              <CheckCircle size={20} className="text-white" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-[11px] sm:text-xs text-gray-500 truncate">Operating normally</p>
          </div>
        </div>

        {/* Warning Bins */}
        <div className="stat-card p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Warning</p>
              <p className="text-2xl sm:text-3xl font-bold text-amber-700">{stats.warning}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center shadow-md">
              <AlertTriangle size={20} className="text-white" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-[11px] sm:text-xs text-gray-500 truncate">Needs attention soon</p>
          </div>
        </div>

        {/* Full Bins */}
        <div className="stat-card p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Full</p>
              <p className="text-2xl sm:text-3xl font-bold text-red-700">{stats.full}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-md">
              <AlertOctagon size={20} className="text-white" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-[11px] sm:text-xs text-gray-500 truncate">Requires pickup</p>
          </div>
        </div>

        {/* Collected Bins */}
        <div className="stat-card p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Collected</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-600">{stats.collected}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center shadow-md">
              <PackageOpen size={20} className="text-white" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-[11px] sm:text-xs text-gray-500 truncate">Recently collected</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="eco-card p-3.5 sm:p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} className="text-primary-600" />
          <h3 className="text-xs sm:text-sm font-semibold text-primary-800">Filter Bins</h3>
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
