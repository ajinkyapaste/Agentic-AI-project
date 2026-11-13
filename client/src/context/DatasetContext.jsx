import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { datasetsApi } from '../services/api';
import { useAuth } from './AuthContext';

const DatasetContext = createContext();

export function DatasetProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [datasets, setDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState(() => localStorage.getItem('selectedDatasetId') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    category: 'All',
    season: 'All',
    region: 'All',
    month: 'All',
  });

  const fetchDatasets = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const res = await datasetsApi.list();
      const list = res.data.datasets || [];
      setDatasets(list);

      // If no dataset selected or selected dataset no longer exists, select first
      if (list.length > 0) {
        if (!selectedDatasetId || !list.some((d) => d.id === selectedDatasetId)) {
          setSelectedDatasetId(list[0].id);
          localStorage.setItem('selectedDatasetId', list[0].id);
        }
      } else {
        setSelectedDatasetId('');
        localStorage.removeItem('selectedDatasetId');
      }
    } catch (err) {
      console.error('Failed to load datasets:', err);
      setError('Unable to load datasets.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, selectedDatasetId]);

  useEffect(() => {
    fetchDatasets();
  }, [fetchDatasets]);

  const selectDataset = (id) => {
    setSelectedDatasetId(id);
    localStorage.setItem('selectedDatasetId', id);
    // Reset filters on dataset switch
    setFilters({ category: 'All', season: 'All', region: 'All', month: 'All' });
  };

  const updateFilters = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFilters({ category: 'All', season: 'All', region: 'All', month: 'All' });
  };

  const selectedDataset = datasets.find((d) => d.id === selectedDatasetId) || null;

  return (
    <DatasetContext.Provider
      value={{
        datasets,
        selectedDataset,
        selectedDatasetId,
        loading,
        error,
        filters,
        selectDataset,
        updateFilters,
        resetFilters,
        fetchDatasets,
      }}
    >
      {children}
    </DatasetContext.Provider>
  );
}

export function useDataset() {
  const context = useContext(DatasetContext);
  if (!context) {
    throw new Error('useDataset must be used within a DatasetProvider');
  }
  return context;
}

