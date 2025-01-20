import React from 'react';
import { Search, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useSearch } from './SearchProvider';
import Link from 'next/link';
import Image from 'next/image';

export function SearchComponent() {
  const { 
    query, 
    setQuery, 
    results, 
    loading, 
    error,
    showResults,
    setShowResults
  } = useSearch();

  return (
    <div className="relative w-full max-w-3xl">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <Input
          type="text"
          placeholder="Search for officials or institutions..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10 py-4 w-full bg-white text-gray-900 placeholder-gray-400"
          onFocus={() => setShowResults(true)}
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setShowResults(false);
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && query.length >= 2 && (
        <div className="fixed inset-0 z-50" onClick={() => setShowResults(false)}>
          <div className="absolute inset-0 bg-black bg-opacity-50" />
          <div className="absolute left-1/2 top-20 transform -translate-x-1/2 w-full max-w-2xl">
            <Card className="bg-white shadow-xl divide-y">
              {loading ? (
                <div className="p-4 text-center">Searching...</div>
              ) : error ? (
                <div className="p-4 text-center text-red-600">{error}</div>
              ) : results.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No results found</div>
              ) : (
                <>
                  {/* Group results by type */}
                  {['nominee', 'institution'].map((type) => {
                    const typeResults = results.filter(r => r.type === type);
                    if (typeResults.length === 0) return null;

                    return (
                      <div key={type} className="p-4">
                        <h3 className="font-semibold text-gray-700 mb-3">
                          {type === 'nominee' ? 'Officials' : 'Institutions'}
                        </h3>
                        <div className="space-y-2">
                          {typeResults.map((result) => (
                            <Link
                              key={`${result.type}-${result.id}`}
                              href={`/${result.type}s/${result.id}`}
                              className="block p-3 hover:bg-gray-50 rounded border border-gray-100"
                            >
                              <div className="flex items-center gap-3">
                                <div className="relative w-10 h-10">
                                <Image
  src={result.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(result.name)}&size=128&background=f3f4f6&color=4b5563`}
  alt={result.name}
  fill
  className="rounded-full object-cover"
/>
                                </div>
                                <div>
                                  <div className="font-medium">{result.name}</div>
                                  {result.type === 'nominee' && result.position && (
                                    <div className="text-sm text-gray-600">
                                      {result.position.name} at {result.institution?.name}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}