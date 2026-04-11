const FilterBar = ({ activeFilter, onFilterChange }) => {
  const filters = ['All', 'Normal', 'Warning', 'Full'];

  const getFilterColor = (filter) => {
    switch (filter) {
      case 'Normal':
        return activeFilter === filter
          ? 'bg-green-600 text-white'
          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800';
      case 'Warning':
        return activeFilter === filter
          ? 'bg-yellow-600 text-white'
          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-800';
      case 'Full':
        return activeFilter === filter
          ? 'bg-red-600 text-white'
          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800';
      default:
        return activeFilter === filter
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600';
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <button
          key={filter}
          onClick={() => onFilterChange(filter)}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${getFilterColor(filter)}`}
        >
          {filter}
        </button>
      ))}
    </div>
  );
};

export default FilterBar;
