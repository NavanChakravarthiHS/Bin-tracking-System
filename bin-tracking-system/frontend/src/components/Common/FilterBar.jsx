const FilterBar = ({ activeFilter, onFilterChange }) => {
  const filters = ['All', 'Normal', 'Warning', 'Full'];

  const getFilterColor = (filter) => {
    switch (filter) {
      case 'All':
        return activeFilter === filter
          ? 'bg-blue-600 text-white border-blue-700 shadow-lg'
          : 'bg-white text-blue-700 border-2 border-blue-500 hover:bg-blue-50';
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
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <button
          key={filter}
          onClick={() => onFilterChange(filter)}
          className={`px-4 py-2 rounded-lg font-semibold transition-all duration-150 border ${getFilterColor(filter)} ${
            activeFilter === filter ? 'scale-105' : 'hover:scale-105'
          }`}
        >
          {filter}
        </button>
      ))}
    </div>
  );
};

export default FilterBar;
