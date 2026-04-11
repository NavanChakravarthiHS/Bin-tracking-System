import { useState, useEffect } from 'react';
import { mockBins } from '../data/mockData';

export const useBins = () => {
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    // Simulate API call with timeout
    const timer = setTimeout(() => {
      setBins(mockBins);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Filter bins based on search and filter criteria
  const getFilteredBins = () => {
    let filtered = bins;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((bin) =>
        bin.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bin.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (activeFilter !== 'All') {
      filtered = filtered.filter((bin) => bin.status === activeFilter);
    }

    return filtered;
  };

  const filteredBins = getFilteredBins();

  return {
    bins: filteredBins,
    allBins: bins,
    loading,
    searchTerm,
    setSearchTerm,
    activeFilter,
    setActiveFilter,
  };
};
