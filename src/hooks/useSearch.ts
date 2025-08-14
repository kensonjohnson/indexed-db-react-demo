import { useState, useEffect, useMemo } from 'react';

export function useSearch<T>(
  data: T[],
  searchFields: (keyof T)[],
  debounceMs: number = 300
) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce the search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs]);

  // Filter the data based on the debounced search term
  const filteredData = useMemo(() => {
    if (!debouncedSearchTerm.trim()) {
      return data;
    }

    const lowercaseSearch = debouncedSearchTerm.toLowerCase();
    
    return data.filter((item) => {
      return searchFields.some((field) => {
        const fieldValue = item[field];
        if (typeof fieldValue === 'string') {
          return fieldValue.toLowerCase().includes(lowercaseSearch);
        }
        if (typeof fieldValue === 'number') {
          return fieldValue.toString().includes(lowercaseSearch);
        }
        return false;
      });
    });
  }, [data, debouncedSearchTerm, searchFields]);

  const clearSearch = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
  };

  return {
    searchTerm,
    setSearchTerm,
    filteredData,
    clearSearch,
    isSearching: debouncedSearchTerm.length > 0,
  };
}