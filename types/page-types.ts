// types/page-types.ts
import { Rating, Comment, Scandal, Evidence, RatingCategory } from '@/types/interfaces';

export type { Rating, Comment, Scandal, Evidence };

export interface CategoryData extends RatingCategory {
  totalRatings?: number;
}

export interface EntityData {
  id: number;
  name: string;
  image?: string;
  description?: string;
  positionId?: number;
  institutionId?: number;
  districtId?: number;
  status?: boolean;
  rating: Rating[];
  comments: Comment[];
  scandals: Scandal[];
  evidence: Evidence[];
  overallRank?: number;
  ratingCategories: CategoryData[];
}

export interface RatingSubmission {
  categoryId: number;
  score: number;
  comment: string;
}

// Re-export other useful types that might be needed
export type { BaseResponse, UserProfile, UserRating, UserComment } from '@/types/interfaces';