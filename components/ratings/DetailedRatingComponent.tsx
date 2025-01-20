import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Star, Award, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { SimilarProfile } from '@/types/interfaces';

interface CategoryData {
  id: number;
  name: string;
  icon: string;
  totalRatings: number;
  ratingDistribution?: {
    score: number;
    count: number;
  }[];
}

interface RatingDistributionProps {
  categoryRatings: {
    score: number;
    count: number;
  }[];
  total: number;
}

interface CategoryRatingsProps {
  categories: CategoryData[];
  type?: 'nominee' | 'institution';
}

interface SimilarProfilesProps {
  profiles: SimilarProfile[];
  type: 'nominees' | 'institutions';
}

interface ProfileHeaderProps {
  rank: number;
  name: string;
  role?: string;
  institution?: string;
  averageRating: number;
  totalRatings: number;
}

interface RankIndicatorProps {
  rank: number;
  type: 'overall' | 'category';
  className?: string;
}

const RankIndicator: React.FC<RankIndicatorProps> = ({ rank, type, className }) => {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center">
        <Award className="w-8 h-8 text-white absolute" />
        <span className="text-white font-bold text-xl">#{rank}</span>
      </div>
      <span className="mt-2 text-sm font-medium text-gray-600">
        {type === 'overall' ? 'Overall Rank' : 'Category Rank'}
      </span>
    </div>
  );
};

const RatingDistribution: React.FC<RatingDistributionProps> = ({ categoryRatings, total }) => {
  return (
    <div className="space-y-2">
      {[5, 4, 3, 2, 1].map((stars) => {
        const rating = categoryRatings.find(r => r.score === stars) || { count: 0 };
        const percentage = (rating.count / total) * 100 || 0;
        
        return (
          <div key={stars} className="flex items-center gap-4">
            <div className="flex items-center gap-1 w-24">
              {Array(stars).fill(0).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <div className="flex-1">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-400 rounded-full transition-all duration-500" 
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
            <div className="w-20 text-sm text-gray-600">
              {rating.count} votes
            </div>
          </div>
        );
      })}
    </div>
  );
};

const CategoryRatings: React.FC<CategoryRatingsProps> = ({ categories }) => {
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      {categories.map((category) => (
        <Card key={category.id} className="overflow-hidden">
          <div 
            className="p-4 cursor-pointer hover:bg-gray-50"
            onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{category.icon}</span>
                <div>
                  <h3 className="font-medium">{category.name}</h3>
                  <p className="text-sm text-gray-600">{category.totalRatings} ratings</p>
                </div>
              </div>
              <ChevronRight 
                className={`w-5 h-5 transition-transform ${expandedCategory === category.id ? 'rotate-90' : ''}`} 
              />
            </div>
          </div>
          
          {expandedCategory === category.id && category.ratingDistribution && (
            <CardContent>
              <RatingDistribution 
                categoryRatings={category.ratingDistribution} 
                total={category.totalRatings || 0}
              />
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};

const SimilarProfiles: React.FC<SimilarProfilesProps> = ({ profiles, type }) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      {profiles.map((profile) => (
        <Link 
          key={profile.id} 
          href={`/${type}/${profile.id}`}
          className="block"
        >
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16">
                <Image
  src={profile.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&size=128&background=f3f4f6&color=4b5563`}
  alt={profile.name}
  fill
  className="object-cover rounded-full"
/>
                </div>
                <div>
                  <h3 className="font-medium">{profile.name}</h3>
                  {profile.position && (
                    <p className="text-sm text-gray-600">{profile.position.name}</p>
                  )}
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">
                      {profile.averageRating.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
};

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ 
  rank, 
  name, 
  role, 
  institution, 
  averageRating, 
  totalRatings 
}) => {
  return (
    <div className="relative">
      <div className="absolute top-4 right-4">
        <RankIndicator rank={rank} type="overall" />
      </div>
      
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{name}</h1>
        {role && <p className="text-xl text-gray-600">{role}</p>}
        {institution && <p className="text-gray-500">{institution}</p>}
        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
            <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
          </div>
          <span className="text-gray-600">({totalRatings} ratings)</span>
        </div>
      </div>
    </div>
  );
};

export { ProfileHeader, CategoryRatings, SimilarProfiles };