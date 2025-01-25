"use client"

import { useEffect, useState, useCallback } from "react";
import { useParams } from 'next/navigation';
import { useToast } from "@/components/ui/use-toast";
import { EntityDetail } from "@/components/sections/EntityDetail";
import { handleRatingSubmission } from "@/utils/rating-helpers";
import { LoadingScreen } from "@/components/ui/loading";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import SuccessToast from "@/components/ui/SuccessToast";
import type {
  Rating as ImportedRating,
  RatingCategory,
  RatingSubmission
} from "@/types/interfaces";
import type { Prisma } from '@prisma/client';

// Move type definitions outside component to prevent recreating on each render
type DatabaseComment = Prisma.CommentGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        name: true;
        image: true;
      };
    };
    replies: {
      include: {
        user: {
          select: {
            id: true;
            name: true;
            image: true;
          };
        };
        reactions: true;
      };
    };
    reactions: true;
  };
}>;

type DatabaseRating = Prisma.NomineeRatingGetPayload<{
  include: {
    ratingCategory: true;
    user: {
      select: {
        id: true;
        name: true;
        image: true;
      };
    };
  };
}>;

interface ComponentComment {
  id: number;
  content: string;
  userId: string;
  user: {
    id: number;
    name: string;
    image?: string;
  };
  createdAt: string;
  likes: number;
  dislikes: number;
  userReaction?: boolean;
  replies: ComponentComment[];
}

interface ComponentEntityData {
  position: { id: number; name: string };
  institution: { id: number; name: string };
  district: {
    id: number;
    name: string;
    region: string;
    status: string;
  };
  id: number;
  name: string;
  image?: string;
  description?: string;
  rating: ImportedRating[];
  scandals: {
    id: number;
    title: string;
    description: string;
    sourceUrl?: string;
    createdAt: string;
    verified: boolean;
  }[];
  comments: ComponentComment[];
  overallRank?: number;
  ratingCategories: RatingCategory[];
}

interface ComponentRatingSubmission {
  categoryId: number;
  score: number;
  comment?: string;
}

// Move transformation functions outside component
const transformDatabaseRating = (rating: DatabaseRating): ImportedRating => ({
  id: rating.id,
  score: rating.score,
  comment: rating.comment || '',
  createdAt: rating.createdAt.toISOString(),
  ratingCategory: {
    id: rating.ratingCategory.id,
    name: rating.ratingCategory.name,
    icon: rating.ratingCategory.icon,
    weight: rating.ratingCategory.weight,
    description: rating.ratingCategory.description,
    examples: rating.ratingCategory.examples
  }
});

const transformToComponentComment = (comment: DatabaseComment): ComponentComment => ({
  id: comment.id,
  content: comment.content,
  userId: String(comment.userId),
  createdAt: new Date(comment.createdAt).toISOString(),
  user: {
    id: comment.user.id,
    name: comment.user.name,
    image: comment.user.image || undefined
  },
  replies: (comment.replies || []).map(reply => ({
    id: reply.id,
    content: reply.content,
    userId: String(reply.userId),
    createdAt: new Date(reply.createdAt).toISOString(),
    user: {
      id: reply.user.id,
      name: reply.user.name,
      image: reply.user.image || undefined
    },
    reactions: (reply.reactions || []).map(r => ({
      id: r.id,
      userId: r.userId,
      isLike: r.isLike,
      createdAt: new Date(r.createdAt).toISOString()
    })),
    likes: (reply.reactions || []).filter(r => r.isLike).length,
    dislikes: (reply.reactions || []).filter(r => !r.isLike).length,
    userReaction: reply.reactions?.find(r => r.userId === 1)?.isLike,
    replies: []
  })),
  likes: (comment.reactions || []).filter(r => r.isLike).length,
  dislikes: (comment.reactions || []).filter(r => !r.isLike).length,
  userReaction: comment.reactions?.find(r => r.userId === 1)?.isLike
});

const transformToInterfaceRating = (ratings: ComponentRatingSubmission[]): RatingSubmission[] =>
  ratings.map(rating => ({
    categoryId: rating.categoryId,
    score: rating.score,
    comment: rating.comment || ''
  }));

export default function NomineePage() {
  const params = useParams();
  const { toast } = useToast();
  const [nominee, setNominee] = useState<ComponentEntityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Memoize data fetching function
  const fetchData = useCallback(async (endpoint: string) => {
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error(`Failed to fetch from ${endpoint}`);
    return response.json();
  }, []);

  useEffect(() => {
    const fetchNomineeData = async () => {
      try {
        setError(null);
        const id = params.id;

        // Use Promise.all to fetch data concurrently
        const [nomineeData, scandalsData, evidenceData, , categoriesData] = await Promise.all([
          fetchData(`/api/nominees/${id}`),
          fetchData(`/api/scandals?nomineeId=${id}`),
          fetchData(`/api/evidence?type=nominee&entityId=${id}&status=VERIFIED`),
          fetchData(`/api/nominees/${id}/ratings`),
          fetchData(`/api/rating-categories`)
        ]);

        setNominee({
          ...nomineeData,
          scandals: scandalsData.data || [],
          evidence: evidenceData.data || [],
          ratingCategories: categoriesData.data
        });
      } catch (error) {
        console.error('Error fetching nominee data:', error);
        const errorMessage = error instanceof Error ? error.message : "Failed to load nominee data";
        setError(errorMessage);
        toast({
          variant: "destructive",
          title: "Error",
          description: errorMessage
        });
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchNomineeData();
    }
  }, [params.id, toast, fetchData]);

  // Memoize handlers to prevent unnecessary re-renders
  const handleRatingSubmit = useCallback(async (ratings: ComponentRatingSubmission[]): Promise<void> => {
    if (!nominee) return;

    try {
      setError(null);
      const transformedRatings = transformToInterfaceRating(ratings);
      const result = await handleRatingSubmission(1, nominee.id, transformedRatings, 'nominee');

      if (result.entity) {
        setNominee(prev => {
          if (!prev) return null;
          return {
            ...prev,
            rating: (result.entity.rating as DatabaseRating[]).map(transformDatabaseRating),
            comments: (result.entity.comments as DatabaseComment[]).map(transformToComponentComment)
          };
        });
      }

      setShowSuccess(true);
      toast({
        title: "Success",
        description: "Rating submitted successfully"
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to submit rating";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      });
    }
  }, [nominee, toast]);

  const handleCommentSubmit = useCallback(async (content: string, parentId?: number): Promise<void> => {
    if (!nominee) return;

    try {
      setError(null);
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          entityType: 'nominee',
          nomineeId: nominee.id,
          parentId,
        }),
      });

      if (!response.ok) throw new Error('Failed to post comment');

      const result = await response.json();
      const transformedComment = transformToComponentComment(result as DatabaseComment);

      setNominee(prev =>
        prev ? {
          ...prev,
          comments: [transformedComment, ...prev.comments]
        } : null
      );

      toast({
        title: "Success",
        description: "Comment posted successfully"
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to post comment";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to post comment"
      });
    }
  }, [nominee, toast]);

  const handleReaction = useCallback(async (commentId: number, isLike: boolean): Promise<void> => {
    if (!nominee) return;

    try {
      await fetch(`/api/comments/${commentId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isLike })
      });

      const commentsData = await fetchData(`/api/nominees/${params.id}/comments`);

      setNominee(prev =>
        prev ? {
          ...prev,
          comments: (commentsData as DatabaseComment[]).map(transformToComponentComment)
        } : null
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update reaction";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update reaction"
      });
    }
  }, [nominee, params.id, fetchData, toast]);

  if (loading) return <LoadingScreen />;
  if (error) return (
    <Alert variant="destructive" className="m-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
  if (!nominee) return (
    <Alert variant="destructive" className="m-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>Nominee not found</AlertDescription>
    </Alert>
  );

  return (
    <>
      <EntityDetail
        entity={nominee}
        type="nominee"
        onSubmitRating={handleRatingSubmit}
        onSubmitComment={handleCommentSubmit}
        onReact={handleReaction}
      />
      <SuccessToast
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
      />
    </>
  );
}