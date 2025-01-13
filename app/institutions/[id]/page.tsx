"use client";
import { useEffect, useState } from "react";
import { useParams } from 'next/navigation';
import { useToast } from "@/components/ui/use-toast";
import { EntityDetail } from "@/components/sections/EntityDetail";
import { handleRatingSubmission } from "@/utils/rating-helpers";
import { submitComment } from "@/utils/comment-helpers";
import { LoadingScreen } from "@/components/ui/loading";
import SuccessToast from "@/components/ui/SuccessToast";
import { BaseResponse, Scandal, RatingCategory } from '@/types/interfaces';

// Define database-aligned types
interface InstitutionRating {
  id: number;
  userId: number;
  institutionId: number;
  ratingCategoryId: number;
  score: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  categoryRank: number | null;
}

interface CommentReaction {
  id: number;
  userId: number;
  isLike: boolean;
  createdAt: string;
}

interface CommentReply {
  id: number;
  content: string;
  userId: number;
  user: {
    id: number;
    name: string;
    image: string | null;
  };
  reactions: CommentReaction[];
  createdAt: string;
}

interface RawComment {
  id: number;
  content: string;
  userId: number;
  institutionId: number | null;
  replies: CommentReply[];
  reactions: CommentReaction[];
  createdAt: string;
  user: {
    id: number;
    name: string;
    image: string | null;
  };
}

// Component types
interface ComponentRating {
  id: number;
  score: number;
  comment?: string;
  createdAt: string;
  ratingCategory: {
    id: number;
    name: string;
    icon: string;
    description: string;
    weight: number;
    examples: string[];
  };
}

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
  rating: ComponentRating[];
  scandals: Scandal[];
  comments: ComponentComment[];
  overallRank?: number;
  ratingCategories: RatingCategory[];
  nominees?: { // Added this field
    id: number;
    name: string;
  }[];
}

interface RatingSubmission {
  categoryId: number;
  score: number;
  comment?: string;
}

interface APIRatingResponse {
  entity: {
    rating: InstitutionRating[];
  };
}

export default function InstitutionPage() {
  const params = useParams();
  const { toast } = useToast();
  const [institution, setInstitution] = useState<ComponentEntityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const fetchInstitutionData = async () => {
      try {
        const id = params.id as string;
        const [institutionRes, scandalsRes, ratingsRes, categoriesRes] = await Promise.all([
          fetch(`/api/institutions/${id}`),
          fetch(`/api/scandals?type=institution&entityId=${id}`),
          fetch(`/api/institutions/${id}/ratings`),
          fetch(`/api/institution-rating-categories`)
        ]);

        if (!institutionRes.ok) throw new Error('Failed to fetch institution');

        const [institutionData, scandalsData, ratingsData, categoriesData] = await Promise.all([
          institutionRes.json(),
          scandalsRes.json() as Promise<BaseResponse<Scandal>>,
          ratingsRes.json() as Promise<InstitutionRating[]>,
          categoriesRes.json() as Promise<{ data: RatingCategory[] }>
        ]);

        // Transform ratings to match component expectations
        const transformedRatings: ComponentRating[] = ratingsData.map(rating => {
          const categoryMatch = categoriesData.data.find(cat => 
            cat.id === rating.ratingCategoryId
          );

          return {
            id: rating.id,
            score: rating.score,
            comment: rating.comment || undefined,
            createdAt: rating.createdAt,
            ratingCategory: categoryMatch ? {
              id: categoryMatch.id,
              name: categoryMatch.name,
              icon: categoryMatch.icon,
              weight: categoryMatch.weight,
              description: categoryMatch.description,
              examples: categoryMatch.examples
            } : {
              id: rating.ratingCategoryId,
              name: '',
              icon: '',
              weight: 0,
              description: '',
              examples: []
            }
          };
        });

        // Transform comments to match component interface
        const transformComments = (comments: RawComment[]): ComponentComment[] => {
          return comments.map(comment => ({
            id: comment.id,
            content: comment.content,
            userId: String(comment.userId),
            user: {
              id: comment.user.id,
              name: comment.user.name,
              image: comment.user.image || undefined
            },
            createdAt: comment.createdAt,
            likes: comment.reactions.filter(r => r.isLike).length,
            dislikes: comment.reactions.filter(r => !r.isLike).length,
            userReaction: comment.reactions.find(r => r.userId === 1)?.isLike,
            replies: comment.replies.map(reply => ({
              id: reply.id,
              content: reply.content,
              userId: String(reply.userId),
              user: {
                id: reply.user.id,
                name: reply.user.name,
                image: reply.user.image || undefined
              },
              createdAt: reply.createdAt,
              likes: reply.reactions.filter(r => r.isLike).length,
              dislikes: reply.reactions.filter(r => !r.isLike).length,
              userReaction: reply.reactions.find(r => r.userId === 1)?.isLike,
              replies: []
            }))
          }));
        };

        // Transform the data to match component interface
        const transformedData: ComponentEntityData = {
          district: { id: 0, name: "", region: "", status: "" },
          institution: { id: 0, name: "" },
          position: { id: 0, name: "" },
          id: institutionData.id,
          name: institutionData.name,
          image: institutionData.image,
          description: institutionData.description,
          rating: transformedRatings,
          scandals: scandalsData.data || [],
          comments: transformComments(institutionData.comments || []),
          overallRank: institutionData.overallRank,
          ratingCategories: categoriesData.data,
          nominees: institutionData.nominees || [] // Added this line
        };

        setInstitution(transformedData);
      } catch (error) {
        console.error('Error fetching institution data:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load institution data"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInstitutionData();
  }, [params.id, toast]);

  const handleRatingSubmit = async (ratings: RatingSubmission[]): Promise<void> => {
    if (!institution) return;
  
    try {
      const result = await handleRatingSubmission(
        1, // Assuming user ID 1 for now
        institution.id,
        ratings,
        'institution'
      ) as unknown as APIRatingResponse;
      
      if (result?.entity) {
        const updatedRatings = result.entity.rating.map((rating): ComponentRating => {
          const categoryMatch = institution.ratingCategories.find(cat => 
            cat.id === rating.ratingCategoryId
          );

          return {
            id: rating.id,
            score: rating.score,
            comment: rating.comment || undefined,
            createdAt: rating.createdAt,
            ratingCategory: categoryMatch ? {
              id: categoryMatch.id,
              name: categoryMatch.name,
              icon: categoryMatch.icon,
              weight: categoryMatch.weight,
              description: categoryMatch.description,
              examples: categoryMatch.examples
            } : {
              id: rating.ratingCategoryId,
              name: '',
              icon: '',
              weight: 0,
              description: '',
              examples: []
            }
          };
        });

        setInstitution(prev => prev ? {
          ...prev,
          rating: updatedRatings
        } : null);
      }
      setShowSuccess(true);
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit rating"
      });
    }
  };

  const handleCommentSubmit = async (content: string, parentId?: number) => {
    if (!institution) return;

    try {
      const result = await submitComment(
        1, // userId (hardcoded for now)
        content,
        'institution',
        institution.id,
        parentId,
        false
      );

      if (result && typeof result === 'object') {
        // Fetch updated comments
        const commentsRes = await fetch(`/api/institutions/${params.id}/comments`);
        if (!commentsRes.ok) throw new Error('Failed to fetch updated comments');
        
        const commentsData = await commentsRes.json();
        if (Array.isArray(commentsData)) {
          const transformedComments = commentsData.map((comment: RawComment): ComponentComment => ({
            id: comment.id,
            content: comment.content,
            userId: String(comment.userId),
            user: {
              id: comment.user.id,
              name: comment.user.name,
              image: comment.user.image || undefined
            },
            createdAt: comment.createdAt,
            likes: comment.reactions.filter(r => r.isLike).length,
            dislikes: comment.reactions.filter(r => !r.isLike).length,
            userReaction: comment.reactions.find(r => r.userId === 1)?.isLike,
            replies: comment.replies.map(reply => ({
              id: reply.id,
              content: reply.content,
              userId: String(reply.userId),
              user: {
                id: reply.user.id,
                name: reply.user.name,
                image: reply.user.image || undefined
              },
              createdAt: reply.createdAt,
              likes: reply.reactions.filter(r => r.isLike).length,
              dislikes: reply.reactions.filter(r => !r.isLike).length,
              userReaction: reply.reactions.find(r => r.userId === 1)?.isLike,
              replies: []
            }))
          }));

          setInstitution(prev => prev ? {
            ...prev,
            comments: transformedComments
          } : null);
        }
      }

      setShowSuccess(true);
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit comment"
      });
    }
  };

  const handleReaction = async (commentId: number, isLike: boolean, isReply?: boolean) => {
    try {
      const response = await fetch(`/api/comments/${commentId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isLike, isReply })
      });

      if (!response.ok) throw new Error('Failed to update reaction');

      const commentsRes = await fetch(`/api/institutions/${params.id}/comments`);
      if (!commentsRes.ok) throw new Error('Failed to fetch updated comments');
      
      const commentsData = await commentsRes.json();

      if (institution && Array.isArray(commentsData)) {
        const transformedComments = commentsData.map((comment: RawComment): ComponentComment => ({
          id: comment.id,
          content: comment.content,
          userId: String(comment.userId),
          user: {
            id: comment.user.id,
            name: comment.user.name,
            image: comment.user.image || undefined
          },
          createdAt: comment.createdAt,
          likes: comment.reactions.filter(r => r.isLike).length,
          dislikes: comment.reactions.filter(r => !r.isLike).length,
          userReaction: comment.reactions.find(r => r.userId === 1)?.isLike,
          replies: comment.replies.map(reply => ({
            id: reply.id,
            content: reply.content,
            userId: String(reply.userId),
            user: {
              id: reply.user.id,
              name: reply.user.name,
              image: reply.user.image || undefined
            },
            createdAt: reply.createdAt,
            likes: reply.reactions.filter(r => r.isLike).length,
            dislikes: reply.reactions.filter(r => !r.isLike).length,
            userReaction: reply.reactions.find(r => r.userId === 1)?.isLike,
            replies: []
          }))
        }));

        setInstitution({
          ...institution,
          comments: transformedComments
        });
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update reaction"
      });
    }
  };

  if (loading) return <LoadingScreen />;
  if (!institution) return <div>Institution not found</div>;

  return (
    <>
      <EntityDetail
        entity={institution}
        type="institution"
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