"use client"

import { useEffect, useState } from "react";
import { useParams } from 'next/navigation';
import { useToast } from "@/components/ui/use-toast";
import { EntityDetail } from "@/components/sections/EntityDetail";
import { handleRatingSubmission } from "@/utils/rating-helpers";
import { submitComment } from "@/utils/comment-helpers";
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

// Interfaces matching EntityDetail.tsx expectations
interface ComponentComment {
  id: number;
  content: string;
  userId: string; // EntityDetail expects string
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

function transformDatabaseRating(rating: DatabaseRating): ImportedRating {
  return {
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
  };
}

function transformToComponentComment(comment: DatabaseComment): ComponentComment {
  return {
    id: comment.id,
    content: comment.content,
    userId: String(comment.userId), // Convert to string for component
    createdAt: comment.createdAt.toISOString(),
    user: {
      id: comment.user.id,
      name: comment.user.name,
      image: comment.user.image || undefined
    },
    replies: comment.replies.map(reply => ({
      id: reply.id,
      content: reply.content,
      userId: String(reply.userId),
      createdAt: reply.createdAt.toISOString(),
      user: {
        id: reply.user.id,
        name: reply.user.name,
        image: reply.user.image || undefined
      },
      reactions: reply.reactions.map(r => ({
        id: r.id,
        userId: r.userId,
        isLike: r.isLike,
        createdAt: r.createdAt.toISOString()
      })),
      likes: reply.reactions.filter(r => r.isLike).length,
      dislikes: reply.reactions.filter(r => !r.isLike).length,
      userReaction: reply.reactions.find(r => r.userId === 1)?.isLike,
      replies: []
    })),
    likes: comment.reactions.filter(r => r.isLike).length,
    dislikes: comment.reactions.filter(r => !r.isLike).length,
    userReaction: comment.reactions.find(r => r.userId === 1)?.isLike
  };
}

// Local type for component RatingSubmission
interface ComponentRatingSubmission {
  categoryId: number;
  score: number;
  comment?: string;
}

function transformToInterfaceRating(ratings: ComponentRatingSubmission[]): RatingSubmission[] {
  return ratings.map(rating => ({
    categoryId: rating.categoryId,
    score: rating.score,
    comment: rating.comment || '' // Ensure comment is always a string
  }));
}

export default function NomineePage() {
  const params = useParams();
  const { toast } = useToast();
  const [nominee, setNominee] = useState<ComponentEntityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const fetchNomineeData = async () => {
      try {
        setError(null);
        const id = params.id;

        const responses = await Promise.all([
          fetch(`/api/nominees/${id}`),
          fetch(`/api/scandals?type=nominee&entityId=${id}`),
          fetch(`/api/evidence?type=nominee&entityId=${id}&status=VERIFIED`),
          fetch(`/api/nominees/${id}/ratings`),
          fetch(`/api/rating-categories`),
          fetch(`/api/nominees/${id}/comments`)
        ]);


        if (responses.some(res => !res.ok)) {
          throw new Error('Failed to fetch nominee data');
        }

        const [nomineeData, scandalsData, evidenceData,
          ,
          categoriesData] = await Promise.all(
          responses.map(res => res.json())
        );


        const entityData: ComponentEntityData = {
          ...nomineeData,
          scandals: scandalsData.data || [],
          evidence: evidenceData.data || [],

          ratingCategories: categoriesData.data
        };
        // console.log("Entity Data: ", entityData);
        setNominee(entityData);
      } catch (error) {
        console.error('Error fetching nominee data:', error);
        setError(error instanceof Error ? error.message : "Failed to load nominee data");
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load nominee data"
        });
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchNomineeData();
    }
  }, [params.id, toast]);

  const handleRatingSubmit = async (ratings: ComponentRatingSubmission[]): Promise<void> => {
    if (!nominee) return;

    try {
      setError(null);
      const transformedRatings = transformToInterfaceRating(ratings);
      const result = await handleRatingSubmission(
        1,
        nominee.id,
        transformedRatings,
        'nominee'
      );

      if (result.entity) {
        const transformedRatings = (result.entity.rating as DatabaseRating[])
          .map(transformDatabaseRating);
        const transformedComments = (result.entity.comments as DatabaseComment[])
          .map(transformToComponentComment);

        setNominee(prev => {
          if (!prev) return null;
          return {
            ...prev,
            rating: transformedRatings,
            comments: transformedComments
          };
        });
      }
      
      setShowSuccess(true);
      toast({
        title: "Success",
        description: "Rating submitted successfully"
      });
    } catch (error) {
      console.error('Error submitting rating:', error);
      setError(error instanceof Error ? error.message : "Failed to submit rating");
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit rating"
      });
    }
  };

  const handleCommentSubmit = async (content: string, parentId?: number): Promise<void> => {
    if (!nominee) return;

    try {
      setError(null);
      const result = await submitComment(
        1,
        content,
        'nominee',
        nominee.id,
        parentId
      );

      if (result) {
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
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      setError(error instanceof Error ? error.message : "Failed to post comment");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to post comment"
      });
    }
  };

  const handleReaction = async (commentId: number, isLike: boolean, isReply?: boolean): Promise<void> => {
    if (!nominee) return;

    try {
      const response = await fetch(`/api/comments/${commentId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isLike, isReply })
      });

      if (!response.ok) throw new Error('Failed to update reaction');

      const commentsRes = await fetch(`/api/nominees/${params.id}/comments`);
      if (!commentsRes.ok) throw new Error('Failed to fetch updated comments');

      const commentsData = await commentsRes.json();
      const transformedComments = (commentsData as DatabaseComment[])
        .map(transformToComponentComment);

      setNominee(prev => 
        prev ? { 
          ...prev, 
          comments: transformedComments 
        } : null
      );
    } catch (error) {
      console.error('Error handling reaction:', error);
      setError(error instanceof Error ? error.message : "Failed to update reaction");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update reaction"
      });
    }
  };

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