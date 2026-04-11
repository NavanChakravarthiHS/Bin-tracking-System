import Dashboard from '../components/Dashboard/Dashboard';
import SearchBar from '../components/Common/SearchBar';
import FilterBar from '../components/Common/FilterBar';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { useBins } from '../hooks/useBins';

const DashboardPage = () => {
  const { bins, loading, searchTerm, setSearchTerm, activeFilter, setActiveFilter } = useBins();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Dashboard
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor all waste bins and their current status
        </p>
      </div>

      {/* Search and Filter */}
      <div className="mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between">
        <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
        <FilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter} />
      </div>

      {/* Loading State */}
      {loading ? (
        <LoadingSpinner size="large" />
      ) : (
        <>
          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">Normal</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {bins.filter((b) => b.status === 'Normal').length}
              </p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">Warning</p>
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                {bins.filter((b) => b.status === 'Warning').length}
              </p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">Full</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                {bins.filter((b) => b.status === 'Full').length}
              </p>
            </div>
          </div>

          {/* Dashboard Grid */}
          <Dashboard bins={bins} />
        </>
      )}
    </div>
  );
};

export default DashboardPage;
