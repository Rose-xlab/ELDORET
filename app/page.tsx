'use client';

import { SearchComponent } from '@/components/SearchComponent';
import { useStats } from '@/components/StatsProvider';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Users, Award, Star, TrendingUp, ChevronRight } from 'lucide-react';
import Link from "next/link";
import Image from "next/image";

interface RecentRating {
  category: {
    icon: string;
  };
  comment: string;
}

interface Entity {
  id: string | number;
  name: string;
  image?: string;
  position?: {
    name: string;
  };
  institution?: {
    name: string;
  };
  averageRating?: number;
  totalRatings?: number;
  recentRatings?: RecentRating[];
}

interface TrendingCardProps {
  entity: Entity;
  type: 'nominee' | 'institution';
}
function TrendingCard({ entity, type }: TrendingCardProps) {
  return (
    <Link href={`/${type}s/${entity.id}`}>
      <Card className="hover:shadow-lg transition">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16">
            <Image
  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(entity.name)}&size=128`}
  alt={`${entity.name} placeholder`}
  fill
  className="rounded-lg object-cover"
  priority
/>
            </div>
            <div className="flex-1">
              <h3 className="font-medium">{entity.name}</h3>
              {type === 'nominee' && entity.position && (
                <p className="text-sm text-gray-600">
                  {entity.position.name} at {entity.institution?.name}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">
                  {entity.averageRating ? entity.averageRating.toFixed(1) : 'N/A'}
                </span>
                <span className="text-sm text-gray-500">
                  ({entity.totalRatings || 0} ratings)
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

   

export default function HomePage() {
  const stats = useStats();
  const { statistics, trendingNominees, trendingInstitutions, loading } = stats;

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Exposing Corruption in Kenya
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-300">
              Join thousands of Kenyans in rating and exposing corruption through transparent, evidence-based reporting.
            </p>

            {/* Search Box */}
            <div className="mb-8">
              <SearchComponent />
            </div>

            {/* Report Button */}
            <Link
              href="/submit"
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg font-semibold inline-flex items-center gap-2"
            >
              <AlertTriangle className="w-5 h-5" />
              Report Corruption
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      {!loading && statistics && (
        <div className="max-w-7xl mx-auto px-4 -mt-10 mb-16 relative z-10">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900">{statistics.totalNominees}</div>
                <div className="text-sm text-gray-600">Corrupt Officials</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900">{statistics.totalInstitutions}</div>
                <div className="text-sm text-gray-600">Institutions</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900">{statistics.totalRatings}</div>
                <div className="text-sm text-gray-600">Total Ratings</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900">{statistics.totalUsers}</div>
                <div className="text-sm text-gray-600">Active Users</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trending Section */}
      {!loading && (
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid gap-8 md:grid-cols-2">
            {/* Trending Corrupt Officials */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Trending Corrupt Officials
                </CardTitle>
                <Link href="/nominees">
                  <Button variant="ghost">
                    View All
                    <ChevronRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-4">
                {trendingNominees.map(nominee => (
                  <TrendingCard
                    key={nominee.id}
                    entity={nominee}
                    type="nominee"
                  />
                ))}
              </CardContent>
            </Card>

            {/* Trending Corrupt Institutions */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Trending Corrupt Institutions
                </CardTitle>
                <Link href="/institutions">
                  <Button variant="ghost">
                    View All
                    <ChevronRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-4">
                {trendingInstitutions.map(institution => (
                  <TrendingCard
                    key={institution.id}
                    entity={institution}
                    type="institution"
                  />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

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


      {/* Why Use This Platform Section */}
      <div className="bg-slate-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">
              Why Report Corruption?
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Join our community in making Kenya corruption-free through transparency and accountability.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="rounded-full w-12 h-12 bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Community Driven</h3>
                <p className="text-gray-600">
                  Join thousands of Kenyans working together to expose and fight corruption through transparent reporting.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="rounded-full w-12 h-12 bg-green-100 text-green-600 flex items-center justify-center mb-4">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Evidence Based</h3>
                <p className="text-gray-600">
                  Submit and view verified evidence of corruption, We make sure all claims are properly documented.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="rounded-full w-12 h-12 bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Real Impact</h3>
                <p className="text-gray-600">
                  Make a real difference by helping to identify and expose corruption at all levels of the Kenyan Government.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}