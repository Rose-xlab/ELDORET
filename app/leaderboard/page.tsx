// app/leaderboard/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Medal, ChevronRight, Star } from 'lucide-react';
import Link from "next/link";
import Image from "next/image";

interface Leader {
  id: number;
  name: string;
  image?: string | null;
  position?: string;
  rating: number;
  totalRatings: number;
}

interface CategoryData {
  id: number;
  name: string;
  icon: string;
  description?: string;
  leaders: Leader[];
}

export default function LeaderboardPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("officials");
  const [nomineeCategoryData, setNomineeCategoryData] = useState<CategoryData[]>([]);
  const [institutionCategoryData, setInstitutionCategoryData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        const [nomineeRes, institutionRes] = await Promise.all([
          fetch('/api/leaderboard/nominees/categories'),
          fetch('/api/leaderboard/institutions/categories')
        ]);

        if (!nomineeRes.ok || !institutionRes.ok) {
          throw new Error('Failed to fetch leaderboard data');
        }

        const [nomineeData, institutionData] = await Promise.all([
          nomineeRes.json(),
          institutionRes.json()
        ]);

        setNomineeCategoryData(nomineeData);
        setInstitutionCategoryData(institutionData);
      } catch (error) {
        console.error('Error fetching leaderboard data:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load leaderboard data"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, [toast]);

  const LeaderCard: React.FC<{ leader: Leader; rank: number; type: 'nominee' | 'institution' }> = ({ 
    leader, 
    rank, 
    type 
  }) => (
    <div className="relative flex items-center gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow">
      <div className="flex items-center justify-center w-8 h-8">
        {rank <= 3 ? (
          <Medal className={`w-6 h-6 ${
            rank === 1 ? 'text-yellow-500' :
            rank === 2 ? 'text-gray-400' :
            'text-orange-700'
          }`} />
        ) : (
          <span className="text-lg font-semibold text-gray-500">{rank}</span>
        )}
      </div>

      <div className="relative w-12 h-12 flex-shrink-0">
        <Image
          src={leader.image || "/placeholder.png"}
          alt={leader.name}
          fill
          className="rounded-full object-cover"
        />
      </div>

      <div className="flex-1">
        <h3 className="font-medium">{leader.name}</h3>
        {type === 'nominee' && leader.position && (
          <p className="text-sm text-gray-600">{leader.position}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="font-medium">{leader.rating.toFixed(1)}</span>
          <span className="text-sm text-gray-500">
            ({leader.totalRatings} ratings)
          </span>
        </div>
      </div>

      <Link 
        href={`/${type}s/${leader.id}`}
        className="absolute inset-0 opacity-0 hover:opacity-100 bg-black/5 rounded-lg flex items-center justify-center"
      >
        <Button variant="secondary">
          View Details
          <ChevronRight className="ml-2 w-4 h-4" />
        </Button>
      </Link>
    </div>
  );

  const CategorySection: React.FC<{
    data: CategoryData[];
    type: 'nominee' | 'institution';
  }> = ({ data, type }) => (
    <div className="space-y-6">
      {data.map((category) => (
        <Card key={category.id} className="overflow-hidden">
          <div 
            className="p-4 cursor-pointer hover:bg-gray-50"
            onClick={() => setExpandedCategory(
              expandedCategory === category.id ? null : category.id
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{category.icon}</span>
                <div>
                  <h3 className="font-medium">{category.name}</h3>
                  {category.description && (
                    <p className="text-sm text-gray-600">{category.description}</p>
                  )}
                </div>
              </div>
              <ChevronRight className={`w-5 h-5 transition-transform ${
                expandedCategory === category.id ? 'rotate-90' : ''
              }`} />
            </div>
          </div>

          {expandedCategory === category.id && (
            <CardContent>
              <div className="space-y-4">
                {category.leaders.map((leader, index) => (
                  <LeaderCard
                    key={leader.id}
                    leader={leader}
                    rank={index + 1}
                    type={type}
                  />
                ))}
              </div>
              
              <div className="mt-4 text-center">
                <Link href={`/categories/${category.id}/${type}s`}>
                  <Button variant="outline">
                    View All Rankings
                  </Button>
                </Link>
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p>Loading leaderboard data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Corruption Leaderboard
      </h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="officials">Officials</TabsTrigger>
          <TabsTrigger value="institutions">Institutions</TabsTrigger>
        </TabsList>

        <TabsContent value="officials" className="space-y-6">
          <CategorySection 
            data={nomineeCategoryData} 
            type="nominee"
          />
        </TabsContent>

        <TabsContent value="institutions" className="space-y-6">
          <CategorySection 
            data={institutionCategoryData}
            type="institution"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}