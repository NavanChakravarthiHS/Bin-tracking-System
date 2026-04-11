const FilterBar = ({ activeFilter, onFilterChange }) => {
  const filters = ['All', 'Normal', 'Warning', 'Full'];

  const getFilterColor = (filter) => {
    switch (filter) {
      case 'Normal':
        return activeFilter === filter
          ? 'bg-green-600 text-white border-green-600'
          : 'bg-white text-green-700 border-2 border-green-500 hover:bg-green-50';
      case 'Warning':
        return activeFilter === filter
          ? 'bg-yellow-500 text-white border-yellow-500'
          : 'bg-white text-yellow-700 border-2 border-yellow-500 hover:bg-yellow-50';
      case 'Full':
        return activeFilter === filter
          ? 'bg-red-600 text-white border-red-600'
          : 'bg-white text-red-700 border-2 border-red-500 hover:bg-red-50';
      default:
        return activeFilter === filter
          ? 'bg-primary-600 text-white border-primary-600'
          : 'bg-white text-primary-700 border-2 border-primary-500 hover:bg-primary-50';
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      {filters.map((filter) => (
        <button
          key={filter}
          onClick={() => onFilterChange(filter)}
          className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 border ${getFilterColor(filter)} ${
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
