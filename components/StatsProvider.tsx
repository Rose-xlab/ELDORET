import React, { createContext, useContext, useState, useEffect } from 'react';

interface Statistics {
  totalInstitutions: number;
  totalNominees: number;
  totalRatings: number;
  totalUsers: number;
}

interface TrendingEntity {
  id: number;
  name: string;
  image?: string;
  averageRating: number;
  totalRatings: number;
  position?: {
    name: string;
  };
  institution?: {
    name: string;
  };
  recentRatings: Array<{
    score: number;
    comment: string;
    category: {
      name: string;
      icon: string;
    };
  }>;
}

interface StatsContextType {
  statistics: Statistics | null;
  trendingNominees: TrendingEntity[];
  trendingInstitutions: TrendingEntity[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const StatsContext = createContext<StatsContextType | undefined>(undefined);

export function StatsProvider({ children }: { children: React.ReactNode }) {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [trendingNominees, setTrendingNominees] = useState<TrendingEntity[]>([]);
  const [trendingInstitutions, setTrendingInstitutions] = useState<TrendingEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [statsRes, nomineesRes, institutionsRes] = await Promise.all([
        fetch('/api/statistics'),
        fetch('/api/trending/nominees'),
        fetch('/api/trending/institutions')
      ]);

      if (!statsRes.ok || !nomineesRes.ok || !institutionsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [statsData, nomineesData, institutionsData] = await Promise.all([
        statsRes.json(),
        nomineesRes.json(),
        institutionsRes.json()
      ]);

      setStatistics(statsData);
      setTrendingNominees(nomineesData);
      setTrendingInstitutions(institutionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <StatsContext.Provider
      value={{
        statistics,
        trendingNominees,
        trendingInstitutions,
        loading,
        error,
        refetch: fetchData
      }}
    >
      {children}
    </StatsContext.Provider>
  );
}

export function useStats() {
  const context = useContext(StatsContext);
  if (context === undefined) {
    throw new Error('useStats must be used within a StatsProvider');
  }
  return context;
}