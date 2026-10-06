const FilterBar = ({ activeFilter, onFilterChange }) => {
  const filters = ['All', 'Active', 'Inactive', 'Normal', 'Warning', 'Full', 'Collected'];

  const getFilterColor = (filter) => {
    switch (filter) {
      case 'All':
        return activeFilter === filter
          ? 'bg-blue-600 text-white border-blue-700 shadow-lg'
          : 'bg-white text-blue-700 border-2 border-blue-500 hover:bg-blue-50';
      case 'Active':
        return activeFilter === filter
          ? 'bg-emerald-600 text-white border-emerald-700 shadow-lg'
          : 'bg-white text-emerald-700 border-2 border-emerald-500 hover:bg-emerald-50';
      case 'Inactive':
        return activeFilter === filter
          ? 'bg-rose-600 text-white border-rose-700 shadow-lg'
          : 'bg-white text-rose-700 border-2 border-rose-500 hover:bg-rose-50';
      case 'Normal':
        return activeFilter === filter
          ? 'bg-green-600 text-white border-green-700 shadow-lg'
          : 'bg-white text-green-700 border-2 border-green-500 hover:bg-green-50';
      case 'Warning':
        return activeFilter === filter
          ? 'bg-amber-500 text-black border-amber-600 shadow-lg'
          : 'bg-white text-amber-700 border-2 border-amber-500 hover:bg-amber-50';
      case 'Full':
        return activeFilter === filter
          ? 'bg-red-600 text-white border-red-700 shadow-lg'
          : 'bg-white text-red-700 border-2 border-red-500 hover:bg-red-50';
      case 'Collected':
        return activeFilter === filter
          ? 'bg-gray-600 text-white border-gray-700 shadow-lg'
          : 'bg-white text-gray-700 border-2 border-gray-500 hover:bg-gray-50';
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5 sm:gap-2">
      {filters.map((filter) => (
        <button
          key={filter}
          type="button"
          onClick={() => onFilterChange(filter)}
          className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 border min-h-[36px] ${getFilterColor(filter)} ${
            activeFilter === filter ? 'scale-102 shadow-sm' : 'hover:scale-102'
          }`}
        >
          {filter}
        </button>
      ))}
    </div>
  );
};

export default FilterBar;
