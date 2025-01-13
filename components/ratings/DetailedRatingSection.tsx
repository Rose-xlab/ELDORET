import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { RatingComponent } from './RatingComponent';
import SummaryRatingsCard from '@/components/sections/SummaryRatingsCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface RatingCategory {
  id: number;
  name: string;
  icon: string;
  description: string;
  examples: string[];
}

interface CategorySummary {
  id: number;
  name: string;
  icon: string;
  totalScore: number;
  totalRatings: number;
}

interface Rating {
  id: number;
  score: number;
  ratingCategory: {
    id: number;
    name: string;
    icon: string;
  };
}

interface RatingSubmission {
  categoryId: number;
  score: number;
  comment?: string;
}

interface DetailedRatingSectionProps {
  entity: {
    id: number;
    name: string;
    rating: Rating[] | null;
  };
  categories: RatingCategory[];
  type: 'nominee' | 'institution';
  onSubmitRating: (data: RatingSubmission[]) => Promise<void>;
}

export default function DetailedRatingSection({
  entity,
  categories,
  type,
  onSubmitRating
}: DetailedRatingSectionProps) {
  const [activeTab, setActiveTab] = useState('summary');

  const ratings = Array.isArray(entity.rating) ? entity.rating : [];
  const averageRating = ratings.length > 0
    ? ratings.reduce((acc, r) => acc + r.score, 0) / ratings.length
    : 0;

  const categorySummaries: CategorySummary[] = categories.map(category => {
    const categoryRatings = ratings.filter(r => r.ratingCategory.id === category.id);

    return {
      id: category.id,
      name: category.name,
      icon: category.icon,
      totalScore: categoryRatings.reduce((acc, r) => acc + r.score, 0),
      totalRatings: categoryRatings.length
    };
  });

  return (
    <div className="space-y-6">
      <SummaryRatingsCard
        categories={categorySummaries}
        averageRating={averageRating}
        totalRatings={ratings.length}
        onShowAllRatings={() => setActiveTab('all')}
        onVoteClick={() => setActiveTab('rate')}
        entityType={type}
      />

      <Card className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="rate">Rate</TabsTrigger>
            <TabsTrigger value="all">All Ratings</TabsTrigger>
          </TabsList>

          <TabsContent value="rate">
            <RatingComponent
              categories={categories}
              entityId={entity.id}
              type={type}
              onClose={() => setActiveTab('summary')}
              onSubmit={onSubmitRating}
            />
          </TabsContent>

          <TabsContent value="all">
            <div className="space-y-4">
              {categorySummaries.map(category => (
                <div key={category.id} className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{category.icon}</span>
                    <h3 className="font-medium">{category.name}</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold">
                      {category.totalRatings > 0
                        ? (category.totalScore / category.totalRatings).toFixed(1)
                        : '0.0'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {category.totalRatings} ratings
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}