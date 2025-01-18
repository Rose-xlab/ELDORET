// components/ratings/RatingComponent.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
//import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { AuthModal } from '@/components/AuthModal';
import { useToast } from '@/components/ui/use-toast';

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
  const { toast } = useToast();
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [comments, setComments] = useState<Record<number, string>>({});
  const [overallComment, setOverallComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [rateLimit, setRateLimit] = useState<{
    allowed: boolean;
    remainingRatings: number;
  }>({ allowed: true, remainingRatings: 5 });

  useEffect(() => {
    const checkRateLimit = async () => {
      // if (!isAuthenticated) return;

      try {
        // console.log("Entity ID: ", entityId);
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
        score,
        comment: comments[parseInt(categoryId)] || ''
      }));

      if (overallComment) {
        submissions[0].comment = overallComment;
      }

      const response = await fetch(`/api/${type}s/${entityId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ratings: submissions })
      });

      if (!response.ok) throw new Error('Failed to submit ratings');

      setRatings({});
      setComments({});
      setOverallComment('');

      toast({
        title: "Success",
        description: "Ratings submitted successfully"
      });
      // Close the modal if onClose is provided
      if (onClose) onClose();

      // Refresh the page to update the ratings display
      window.location.reload();
    } catch (error) {
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
    // Only close if the overlay itself (not its children) was clicked
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
      <Card className="w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Submit Rating</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full"
          >
            ✕
          </Button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
          <div className="space-y-2">
            <label className="font-medium">Overall Comment (Optional)</label>
            <Textarea
              value={overallComment}
              onChange={(e) => setOverallComment(e.target.value)}
              placeholder="Share your overall experience..."
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-8">
            {categories.map((category) => (
              <div key={category.id} className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">{category.icon}</span>
                  <div>
                    <h3 className="font-medium">{category.name}</h3>
                    <p className="text-sm text-gray-600">{category.description}</p>
                  </div>
                </div>

                <div className="mb-4">
                  {renderStars(category.id)}
                </div>

                <Textarea
                  placeholder={`Additional comments about ${category.name.toLowerCase()}...`}
                  value={comments[category.id] || ''}
                  onChange={(e) => setComments(prev => ({
                    ...prev,
                    [category.id]: e.target.value
                  }))}
                />

                {category.examples.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium">Examples:</p>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {category.examples.map((example, index) => (
                        <li key={index}>{example}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-4">
            {onClose && (
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={loading || Object.keys(ratings).length === 0}
            >
              {loading ? 'Submitting...' : 'Submit Ratings'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}