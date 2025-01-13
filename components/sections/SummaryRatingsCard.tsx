import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
//import { AuthModal } from '@/components/AuthModal';
//import { useAuth } from '@/lib/auth-context';
import { Star, ChevronRight } from 'lucide-react';

interface CategorySummary {
  id: number;
  name: string;
  icon: string;
  totalScore: number;
  totalRatings: number;
}

interface SummaryRatingsCardProps {
  categories?: CategorySummary[];  // Made optional
  averageRating?: number;
  totalRatings?: number;
  onShowAllRatings: () => void;
  onVoteClick: () => void;
  entityType: 'nominee' | 'institution';
}

export default function SummaryRatingsCard({
  categories = [],  // Default to empty array
  averageRating = 0,
  totalRatings = 0,
  onShowAllRatings,
  //onVoteClick,
  //entityType
}: SummaryRatingsCardProps) {
  //const { isAuthenticated } = useAuth();

  const getCategoryRating = (totalScore: number, totalRatings: number): number => {
    if (totalRatings === 0) return 0;
    return totalScore / totalRatings;
  };

  const formatRating = (rating: number): string => {
    return rating > 0 ? rating.toFixed(1) : '-';
  };

  const CategoryRow = ({ category }: { category: CategorySummary }) => {
    const categoryRating = getCategoryRating(category.totalScore, category.totalRatings);
    
    return (
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{category.icon}</span>
          <span className="font-medium">{category.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= categoryRating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-gray-200 text-gray-200'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-500">({category.totalRatings || 0})</span>
        </div>
      </div>
    );
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-4xl font-bold">{formatRating(averageRating)}</span>
            <div className="flex flex-col">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= (averageRating || 0)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-gray-200 text-gray-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500">{totalRatings} total ratings</span>
            </div>
          </div>
        </div>

        {/*{isAuthenticated ? (*/}
        {/*  <Button */}
        {/*  onClick={onVoteClick}*/}
        {/*  className="bg-[#cc0000] hover:bg-[#bb0000] text-white"*/}
        {/*>*/}
        {/*  Vote*/}
        {/*</Button>*/}
        {/*) : (*/}
        {/*  */}
        {/*  <AuthModal*/}
        {/*    trigger={*/}
        {/*      <Button className="bg-[#cc0000] hover:bg-[#bb0000] text-white">*/}
        {/*        Vote*/}
        {/*      </Button>*/}
        {/*    }*/}
        {/*    mode="rating"*/}
        {/*  />*/}
        {/*)}*/}
      </div>

      {categories.length > 0 && (
        <>
          <div className="space-y-2 mb-6">
            {categories.slice(0, 3).map((category) => (
              <CategoryRow key={category.id} category={category} />
            ))}
          </div>

          {categories.length > 3 && (
            <Button
              variant="outline"
              onClick={onShowAllRatings}
              className="w-full flex items-center justify-between"
            >
              <span>Show all categories</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </>
      )}
    </Card>
  );
}