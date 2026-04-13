const FilterBar = ({ activeFilter, onFilterChange }) => {
  const filters = ['All', 'Normal', 'Warning', 'Full'];

  const getFilterColor = (filter) => {
    switch (filter) {
      case 'Normal':
        return activeFilter === filter
          ? 'bg-green-500 text-white border-green-600'
          : 'bg-white text-green-700 border border-green-400 hover:bg-green-50';
      case 'Warning':
        return activeFilter === filter
          ? 'bg-amber-500 text-black border-amber-600'
          : 'bg-white text-amber-700 border border-amber-400 hover:bg-amber-50';
      case 'Full':
        return activeFilter === filter
          ? 'bg-red-500 text-white border-red-600'
          : 'bg-white text-red-700 border border-red-400 hover:bg-red-50';
      default:
        return activeFilter === filter
          ? 'bg-primary-600 text-white border-primary-700'
          : 'bg-white text-primary-700 border border-primary-400 hover:bg-primary-50';
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <button
          key={filter}
          onClick={() => onFilterChange(filter)}
          className={`px-4 py-2 rounded-lg font-semibold transition-all duration-150 border ${getFilterColor(filter)} ${
            activeFilter === filter ? 'shadow-lg scale-105' : 'hover:scale-105'
          }`}
        >
          {filter}
        </button>
      ))}
    </div>
  );
};

export default FilterBar;
