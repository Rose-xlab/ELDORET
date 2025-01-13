"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChevronRight, Users, Award, AlertTriangle, Search, X } from 'lucide-react';
import Link from "next/link";
import { Nominee, Institution } from '@/types/interfaces';

interface TopNominee extends Nominee {
  averageRating?: number;
}

interface TopInstitution extends Institution {
  averageRating?: number;
}

interface Statistics {
  totalInstitutions: number;
  totalNominees: number;
  totalInstitutionRatings: number;
  totalNomineeRatings: number;
  totalUsers: number;
  totalRatings: number;
}

export default function Home() {
  const [topNominees, setTopNominees] = useState<TopNominee[]>([]);
  const [topInstitutions, setTopInstitutions] = useState<TopInstitution[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    nominees: TopNominee[];
    institutions: TopInstitution[];
  }>({ nominees: [], institutions: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [nomineesRes, institutionsRes, statsRes] = await Promise.all([
          fetch('/api/leaderboard/nominees'),
          fetch('/api/leaderboard/institutions'),
          fetch('/api/statistics')
        ]);

        const [nomineesData, institutionsData, statsData] = await Promise.all([
          nomineesRes.json(),
          institutionsRes.json(),
          statsRes.json()
        ]);

        setTopNominees(nomineesData);
        setTopInstitutions(institutionsData);
        setStatistics(statsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults({ nominees: [], institutions: [] });
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    setShowResults(true);

    const filteredNominees = topNominees.filter(nominee =>
      nominee.name.toLowerCase().includes(query.toLowerCase()) ||
      nominee.position.name.toLowerCase().includes(query.toLowerCase()) ||
      nominee.institution.name.toLowerCase().includes(query.toLowerCase())
    );

    const filteredInstitutions = topInstitutions.filter(institution =>
      institution.name.toLowerCase().includes(query.toLowerCase())
    );

    setSearchResults({
      nominees: filteredNominees,
      institutions: filteredInstitutions
    });
    setIsSearching(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Exposing Corruption in Kenya
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-300">
              Join thousands of citizens in rating and exposing corruption through transparent, evidence-based reporting.
            </p>

            {/* Search Box */}
            <div className="relative mb-8">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search for officials or institutions..."
                className="block w-full pl-10 pr-10 py-4 rounded-lg bg-white text-slate-900 placeholder-gray-400"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults({ nominees: [], institutions: [] });
                    setShowResults(false);
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>

            {/* Report Button */}
            <Link
              href="/submit"
              className="bg-red-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2 inline-flex"
            >
              <AlertTriangle className="w-5 h-5" />
              Report Corruption
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 -mt-10 mb-16 relative z-10">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900">{statistics?.totalNominees ?? '...'}</div>
              <div className="text-sm text-gray-600">Corrupt Officials</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900">{statistics?.totalInstitutions ?? '...'}</div>
              <div className="text-sm text-gray-600">Institutions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900">{statistics?.totalRatings ?? '...'}</div>
              <div className="text-sm text-gray-600">Total Ratings</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900">{statistics?.totalUsers ?? '...'}</div>
              <div className="text-sm text-gray-600">Active Users</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Report Corruption Card */}
          <Card className="hover:shadow-lg transition bg-gradient-to-br from-red-50 to-white">
            <CardHeader>
              <AlertTriangle className="w-12 h-12 text-red-600" />
              <CardTitle>Report Corruption</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Submit evidence-based reports about corrupt officials and institutions. Help expose corruption in Kenya.
              </p>
              <Link href="/submit" className="text-slate-900 font-medium flex items-center group">
                Start Reporting
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition" />
              </Link>
            </CardContent>
          </Card>

          {/* Browse Card */}
          <Card className="hover:shadow-lg transition">
            <CardHeader>
              <Users className="w-12 h-12 text-blue-600" />
              <CardTitle>Browse Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Explore detailed corruption metrics and evidence for both officials and institutions.
              </p>
              <div className="flex gap-4">
                <Link href="/nominees" className="text-slate-900 font-medium flex items-center group">
                  Officials
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition" />
                </Link>
                <Link href="/institutions" className="text-slate-900 font-medium flex items-center group">
                  Institutions
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition" />
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Leaderboard Card */}
          <Card className="hover:shadow-lg transition">
            <CardHeader>
              <Award className="w-12 h-12 text-purple-600" />
              <CardTitle>Corruption Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                View the most corrupt officials and institutions ranked by evidence and citizen ratings.
              </p>
              <Link href="/leaderboard" className="text-slate-900 font-medium flex items-center group">
                View Rankings
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Search Results Modal */}
      {showResults && searchQuery.length >= 2 && (
        <div className="fixed inset-0 z-50" onClick={() => setShowResults(false)}>
          <div className="absolute inset-0 bg-black bg-opacity-50" />
          <div className="absolute left-1/2 top-20 transform -translate-x-1/2 w-full max-w-2xl">
            <Card className="bg-white shadow-xl">
              <CardContent className="divide-y">
                {isSearching ? (
                  <div className="p-4 text-center">Searching...</div>
                ) : (
                  <>
                    {searchResults.nominees.length === 0 && searchResults.institutions.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">No results found</div>
                    ) : (
                      <>
                        {searchResults.nominees.length > 0 && (
                          <div className="p-4">
                            <h3 className="font-semibold text-gray-700 mb-3">Officials</h3>
                            <div className="space-y-2">
                              {searchResults.nominees.map(nominee => (
                                <Link
                                  key={nominee.id}
                                  href={`/nominees/${nominee.id}`}
                                  className="block p-3 hover:bg-gray-50 rounded border border-gray-100"
                                >
                                  <div className="font-medium">{nominee.name}</div>
                                  <div className="text-sm text-gray-600">
                                    {nominee.position.name} at {nominee.institution.name}
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                        {searchResults.institutions.length > 0 && (
                          <div className="p-4">
                            <h3 className="font-semibold text-gray-700 mb-3">Institutions</h3>
                            <div className="space-y-2">
                              {searchResults.institutions.map(institution => (
                                <Link
                                  key={institution.id}
                                  href={`/institutions/${institution.id}`}
                                  className="block p-3 hover:bg-gray-50 rounded border border-gray-100"
                                >
                                  <div className="font-medium">{institution.name}</div>
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}