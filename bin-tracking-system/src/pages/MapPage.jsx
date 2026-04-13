import MapView from '../components/Map/MapView';
import SearchBar from '../components/Common/SearchBar';
import FilterBar from '../components/Common/FilterBar';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { useBins } from '../hooks/useBins';

const MapPage = () => {
  const { bins, allBins, loading, searchTerm, setSearchTerm, activeFilter, setActiveFilter } = useBins();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-heading mb-2">
          Bin Locations
        </h2>
        <p className="text-gray-600">
          View bin locations on the map with real-time status
        </p>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between">
        <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
        <FilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter} />
      </div>

      {/* Loading State */}
      {loading ? (
        <LoadingSpinner size="large" />
      ) : (
        <MapView bins={bins} />
      )}

      {/* Legend */}
      <div className="mt-6 bg-white rounded-lg p-4 border border-gray-200 shadow-soft">
        <h3 className="text-sm font-semibold text-heading mb-3">Legend</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-700 font-medium">Normal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
            <span className="text-sm text-gray-700 font-medium">Warning</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span className="text-sm text-gray-700 font-medium">Full</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPage;
