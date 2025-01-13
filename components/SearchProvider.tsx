import React, { createContext, useContext, useState, useCallback } from 'react';

interface SearchResult {
  id: number;
  name: string;
  type: 'nominee' | 'institution';
  image?: string;
  position?: { name: string };
  institution?: { name: string };
}

// Add these new interfaces for API responses
interface Nominee {
  id: number;
  name: string;
  image?: string;
  position?: { name: string };
  institution?: { name: string };
}

interface Institution {
  id: number;
  name: string;
  image?: string;
}

interface ApiResponse<T> {
  data: T[];
  // Add other response fields if needed
  // e.g., meta: { total: number; page: number; }
}

interface SearchContextType {
  query: string;
  setQuery: (query: string) => void;
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  showResults: boolean;
  setShowResults: (show: boolean) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  const debouncedSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch both nominees and institutions concurrently
      const [nomineesRes, institutionsRes] = await Promise.all([
        fetch(`/api/nominees?search=${encodeURIComponent(searchQuery)}`),
        fetch(`/api/institutions?search=${encodeURIComponent(searchQuery)}`)
      ]);

      if (!nomineesRes.ok || !institutionsRes.ok) {
        throw new Error('Failed to fetch search results');
      }

      const [nomineesData, institutionsData]: [ApiResponse<Nominee>, ApiResponse<Institution>] = await Promise.all([
        nomineesRes.json(),
        institutionsRes.json()
      ]);

      // Combine and format results
      const combinedResults: SearchResult[] = [
        ...nomineesData.data.map((nominee: Nominee) => ({
          ...nominee,
          type: 'nominee' as const
        })),
        ...institutionsData.data.map((institution: Institution) => ({
          ...institution,
          type: 'institution' as const
        }))
      ];

      setResults(combinedResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while searching');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <SearchContext.Provider
      value={{
        query,
        setQuery: (newQuery: string) => {
          setQuery(newQuery);
          debouncedSearch(newQuery);
        },
        results,
        loading,
        error,
        showResults,
        setShowResults
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}