import { Prisma } from '@prisma/client';

// Define the possible field types for filtering
type FilterValue = string | number | Date | boolean;
type RangeValue = number | Date;

// Define the structure for range comparisons
type RangeFilter<T> = {
  gte?: T;
  lte?: T;
};

// Define the structure for text search conditions
type TextSearchCondition = {
  contains: string;
  mode: Prisma.QueryMode;
};

// Define the complete filter structure
type FilterConditions = {
  OR?: Array<Record<string, TextSearchCondition>>;
  [key: string]: FilterValue | RangeFilter<RangeValue> | Array<Record<string, TextSearchCondition>> | undefined;
};

type FilterOptions = {
  searchFields?: string[]; // Fields for text search
  exactFields?: string[]; // Fields for exact match
  rangeFields?: {
    // Fields for range queries (e.g., createdAt, price)
    [key: string]: {
      min?: RangeValue;
      max?: RangeValue;
    };
  };
};

export function buildSearchQuery(search: string, fields: string[]) {
  if (!search) return undefined;

  return {
    OR: fields.map(field => ({
      [field]: {
        contains: search,
        mode: 'insensitive' as const,
      },
    })),
  };
}

export function buildStatusFilter(status: string | null) {
  if (!status) return undefined;
  
  return {
    status: status === 'active',
  };
}

export function buildRatingSort(rating: string | null) {
  if (!rating) return { createdAt: 'desc' as const };

  return rating === 'high'
    ? { rating: { _count: 'desc' as const } }
    : { rating: { _count: 'asc' as const } };
}

export function buildFilters(
  query: URLSearchParams,
  options: FilterOptions
): FilterConditions {
  const filters: FilterConditions = {};

  // Text search
  if (options.searchFields) {
    const searchValue = query.get('search');
    if (searchValue) {
      filters.OR = options.searchFields.map((field) => ({
        [field]: {
          contains: searchValue,
          mode: 'insensitive' as Prisma.QueryMode,
        },
      }));
    }
  }

  // Exact matches
  if (options.exactFields) {
    options.exactFields.forEach((field) => {
      const value = query.get(field);
      if (value) {
        filters[field] = value;
      }
    });
  }

  // Range filters
  if (options.rangeFields) {
    Object.entries(options.rangeFields).forEach(([field, range]) => {
      const minValue = query.get(`${field}_min`);
      const maxValue = query.get(`${field}_max`);

      if (minValue || maxValue) {
        const rangeFilter: RangeFilter<RangeValue> = {};
        
        if (minValue) {
          rangeFilter.gte = range.min instanceof Date 
            ? new Date(minValue) 
            : parseFloat(minValue);
        }
        
        if (maxValue) {
          rangeFilter.lte = range.max instanceof Date 
            ? new Date(maxValue) 
            : parseFloat(maxValue);
        }
        
        filters[field] = rangeFilter;
      }
    });
  }

  return filters;
}