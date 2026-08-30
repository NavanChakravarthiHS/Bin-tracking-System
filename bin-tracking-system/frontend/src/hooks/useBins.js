import { useState, useEffect } from 'react';
import { mockBins } from '../data/mockData';
import { getBinStatus } from '../utils/helpers';

const API_URL = 'http://localhost:5000';

export const useBins = (searchTerm = '', activeFilter = 'All') => {
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBins = async () => {
      try {
        const token = localStorage.getItem('admin_token') || localStorage.getItem('adminToken');
        
        // If no admin token, use mock data
        if (!token) {
          console.log('No admin token found, using mock data');
          const resolvedMock = mockBins.map(bin => {
            const resolved = getBinStatus(bin.fillLevel, bin.status, bin);
            return { ...bin, ...resolved };
          });
          setBins(resolvedMock);
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_URL}/admin/bins`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const resolvedBins = data.bins.map(bin => {
            const resolved = getBinStatus(bin.fillLevel, bin.status, bin);
            return { ...bin, ...resolved };
          });
          setBins(resolvedBins);
        } else {
          // If API fails, fallback to mock data
          console.log('API fetch failed, using mock data');
          const resolvedMock = mockBins.map(bin => {
            const resolved = getBinStatus(bin.fillLevel, bin.status, bin);
            return { ...bin, ...resolved };
          });
          setBins(resolvedMock);
        }
      } catch (error) {
        console.error('Failed to fetch bins from API, using mock data:', error);
        const resolvedMock = mockBins.map(bin => {
          const resolved = getBinStatus(bin.fillLevel, bin.status, bin);
          return { ...bin, ...resolved };
        });
        setBins(resolvedMock);
      } finally {
        setLoading(false);
      }
    };

    fetchBins();
    
    // Poll every 5 seconds for real-time updates
    const interval = setInterval(fetchBins, 5000);
    return () => clearInterval(interval);
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
    activeFilter,
  };
};
