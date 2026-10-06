import { useState, useEffect } from 'react';
import BinMap from '../components/BinMap';
import SearchBar from '../components/Common/SearchBar';
import FilterBar from '../components/Common/FilterBar';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { useBins } from '../hooks/useBins';

const MapPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const { bins, loading } = useBins(searchTerm, activeFilter);

  useEffect(() => {
    console.log("🚦 Map Route mounted");
  }, []);

  useEffect(() => {
    if (!loading) {
      console.log(`📦 Bin data loaded: ${bins.length} bins found`);
    }
  }, [loading, bins.length]);

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-heading tracking-tight">
          Bin Locations
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
          View bin locations on OpenStreetMap with real-time status
        </p>
      </div>

      {/* Search and Filter */}
      <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-3">
        <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
        <FilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter} />
      </div>

      {/* Loading State & Map */}
      {loading ? (
        <LoadingSpinner size="large" />
      ) : (
        <BinMap bins={bins} />
      )}

      {/* Legend */}
      <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-gray-200 shadow-sm">
        <h3 className="text-xs font-bold text-heading mb-2.5 uppercase tracking-wider">Map Legend</h3>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2.5 sm:gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-green-500 shadow-xs flex-shrink-0"></div>
            <span className="text-xs sm:text-sm text-gray-700 font-medium">Normal (&lt;50%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-amber-500 shadow-xs flex-shrink-0"></div>
            <span className="text-xs sm:text-sm text-gray-700 font-medium">Warning (50–79%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-xs flex-shrink-0"></div>
            <span className="text-xs sm:text-sm text-gray-700 font-medium">Full (80%+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-gray-400 shadow-xs flex-shrink-0"></div>
            <span className="text-xs sm:text-sm text-gray-700 font-medium">Collected / Clean</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPage;
