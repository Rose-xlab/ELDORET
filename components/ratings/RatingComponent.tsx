"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { AuthModal } from '@/components/AuthModal';
import { toast } from '@/components/ui/use-toast';


interface RatingCategory {
  id: number;
  name: string;
  icon: string;
  description: string;
  examples: string[];
}

interface RatingSubmission {
  categoryId: number;
  score: number;
  comment?: string;
}

interface RatingComponentProps {
  type: 'nominee' | 'institution';
  entityId: number;
  categories: RatingCategory[];
  onClose?: () => void;
  onSubmit: (ratings: RatingSubmission[]) => Promise<void>;
}

export function RatingComponent({
  type,
  entityId,
  categories,
  onClose
}: RatingComponentProps) {
  const { isAuthenticated } = useAuth();
  // const { toast } = useToast();
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [overallComment, setOverallComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [rateLimit, setRateLimit] = useState<{
    allowed: boolean;
    remainingRatings: number;
  }>({ allowed: true, remainingRatings: 5 });

  useEffect(() => {
    const checkRateLimit = async () => {
      try {
        const response = await fetch(
          `/api/rate-limit?type=${type}&targetId=${entityId}`
        );
        const data = await response.json();
        setRateLimit(data);
      } catch (error) {
        console.error('Error checking rate limit:', error);
      }
    };

    checkRateLimit();
  }, [isAuthenticated, type, entityId]);

  const handleRating = (categoryId: number, score: number) => {
    if (!isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please sign in to rate"
      });
      return;
    }

    if (!rateLimit.allowed) {
      toast({
        variant: "destructive",
        title: "Rate Limit Exceeded",
        description: `You can submit ${rateLimit.remainingRatings} more ratings in 24 hours`
      });
      return;
    }

    setRatings(prev => ({
      ...prev,
      [categoryId]: score
    }));
  };

  const validateSubmission = (): boolean => {
    if (Object.keys(ratings).length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please rate at least one category"
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!isAuthenticated || !validateSubmission()) return;

    setLoading(true);
    try {
      const submissions: RatingSubmission[] = Object.entries(ratings).map(([categoryId, score]) => ({
        categoryId: parseInt(categoryId),
        score
      }));

      if (overallComment) {
        submissions[0].comment = overallComment;
      }

      const response = await fetch(`/api/${type}s/${entityId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ratings: submissions })
      });

      if (!response.ok) {
        throw new Error('Failed to submit ratings');
      }

      toast({
        title: "Success",
        description: "Ratings submitted successfully"
      });

      setRatings({});
      setOverallComment('');
      setLoading(false);

      if (onClose) {
        onClose();
      }

    } catch (error) {
      console.error('Error submitting ratings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit ratings"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (categoryId: number) => {
    const currentRating = ratings[categoryId] || 0;
    return (
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => handleRating(categoryId, score)}
            className={`p-1 rounded-full transition-colors ${
              score <= currentRating 
                ? 'text-yellow-400 hover:text-yellow-500' 
                : 'text-gray-300 hover:text-gray-400'
            }`}
          >
            <Star 
              className={`w-8 h-8 ${score <= currentRating ? 'fill-current' : ''}`} 
            />
          </button>
        ))}
      </div>
    );
  };

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose?.();
    }
  };

  if (!isAuthenticated) {
    return (
      <AuthModal
        trigger={
          <Button className="w-full">Sign in to Rate</Button>
        }
        mode="rating"
      />
    );
  }

  if (!rateLimit.allowed) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          <p className="font-medium">Rating limit reached</p>
          <p className="mt-2">
            You can submit {rateLimit.remainingRatings} more ratings in 24 hours
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
    >
      <Card className="w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto bg-gray-50">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Submit Rating</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-gray-200"
          >
            ✕
          </Button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
          <div className="space-y-2 bg-white p-4 rounded-lg shadow-sm">
            <label className="font-medium text-gray-700">Overall Comment (Optional)</label>
            <Textarea
              value={overallComment}
              onChange={(e) => setOverallComment(e.target.value)}
              placeholder="Share your overall experience..."
              className="min-h-[100px] border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-8">
            {categories.map((category) => (
              <div key={category.id} className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4 bg-blue-50 p-3 rounded-lg">
                  <span className="text-2xl bg-blue-100 p-2 rounded-full">{category.icon}</span>
                  <div>
                    <h3 className="font-semibold text-blue-900">{category.name}</h3>
                    <p className="text-sm text-blue-700">{category.description}</p>
                  </div>
                </div>

                <div className="mb-4 bg-gray-50 p-4 rounded-lg">
                  {renderStars(category.id)}
                </div>

                {category.examples.length > 0 && (
                  <div className="mt-4 bg-green-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-green-800 mb-2">Examples:</p>
                    <ul className="list-disc list-inside text-sm text-green-700 space-y-1">
                      {category.examples.map((example, index) => (
                        <li key={index}>{example}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
            {onClose && (
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={loading || Object.keys(ratings).length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Submitting...' : 'Submit Ratings'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}