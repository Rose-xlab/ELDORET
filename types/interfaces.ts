// types/interfaces.ts

export interface BaseUser {
  id: number;
  name: string;
  image?: string;
}

export interface User extends BaseUser {
  id: number;
  name: string;
  image?: string;
}

export interface RatingCategory {
  id: number;
  keyword: string;
  name: string;
  icon: string;
  description: string;
  weight: number;
  examples: string[];
  totalRatings?: number;
  departments?: {
    id: number;
    name: string;
  }[];
  impactAreas?: {
    id: number;
    name: string;
  }[];
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Rating {
  id: number;
  score: number;
  comment: string;
  createdAt: string;
  user?: BaseUser;
  ratingCategory: {
    id: number;
    name: string;
    icon: string;
    weight: number;
    description: string;
    examples: string[];
  };
}

export interface CommentReaction {
  id: number;
  userId: number;
  isLike: boolean;
  createdAt: string;
}

export interface CommentReply {
  id: number;
  content: string;
  createdAt: string;
  user: BaseUser;
  reactions: CommentReaction[];
  likes: number;
  dislikes: number;
  userReaction?: boolean;
}

export interface Comment {
  id: number;
  userId: number;
  nomineeId?: number;
  institutionId?: number;
  content: string;
  createdAt: string;
  user: BaseUser;
  replies: CommentReply[];
  reactions: CommentReaction[];
  likes: number;
  dislikes: number;
  userReaction?: boolean;
}

export interface Position {
  id: number;
  name: string;
  status: boolean;
  createdAt: string;
}

export interface District {
  id: number;
  name: string;
  region: string;
  status: boolean;
  createdAt: string;
}

export interface Institution {
  id: number;
  name: string;
  image?: string;
  status: boolean;
  nominees?: Nominee[];
  rating: Rating[];
  createdAt: string;
  comments?: Comment[];
  overallRank?: number;
}

export interface Nominee {
  id: number;
  name: string;
  image?: string;
  positionId: number;
  institutionId: number;
  districtId: number;
  status: boolean;
  createdAt: string;
  position: Position;
  institution: Institution;
  district: District;
  rating: Rating[];
  comments?: Comment[];
  overallRank?: number;
}

export interface NomineeWithRankAndAverage extends Omit<Nominee, 'institution' | 'overallRank'> {
  averageRating: number;
  overallRank: number;
  institution: Omit<Institution, 'nominees' | 'comments'> & {
    overallRank: number | undefined;
  };
}

export interface Evidence {
  id: number;
  title: string;
  description: string;
  fileUrl?: string;
  status: string;
  createdAt: string;
  user: User;
}

export interface Scandal {
  id: number;
  title: string;
  description: string;
  sourceUrl?: string;
  createdAt: string;
  verified: boolean;
}

export interface EntityData {
  id: number;
  name: string;
  image?: string;
  description?: string;
  rating: Rating[];
  scandals: Scandal[];
  comments: Comment[];
  evidence: Evidence[];
  overallRank?: number;
  ratingCategories: RatingCategory[];
}

export interface RatingSubmission {
  categoryId: number;
  score: number;
  comment: string;
}

export interface SimilarProfile {
  id: number;
  name: string;
  image?: string;
  position?: {
    name: string;
  };
  averageRating: number;
  rank?: number;
}

export interface RankingData {
  rank: number;
  totalRatings: number;
}

export interface CategoryRankingData {
  categoryId: number;
  rank: number;
  totalRatings: number;
}

export interface UserRating {
  id: number;
  score: number;
  comment: string;
  createdAt: string;
  type: 'nominee' | 'institution';
  target: {
    id: number;
    name: string;
    image?: string;
  };
  ratingCategory: {
    id: number;
    name: string;
    icon: string;
  };
}

export interface UserComment {
  id: number;
  content: string;
  createdAt: string;
  nominee?: {
    id: number;
    name: string;
  };
  institution?: {
    id: number;
    name: string;
  };
  likes: number;
  dislikes: number;
  replies: CommentReply[];
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  image?: string;
  createdAt: string;
  ratings: UserRating[];
  comments: UserComment[];
}

export interface BaseResponse<T> {
  count: number;
  pages: number;
  currentPage: number;
  data: T[];
}

// Helper functions for transforming nominees
export const calculateAverageRating = (ratings: Rating[]): number => {
  if (!ratings.length) return 0;
  return ratings.reduce((acc, r) => acc + r.score, 0) / ratings.length;
};

export const transformNomineeToRanked = (
  nominee: Nominee,
  rankedNominees: { id: number; averageRating: number }[]
): NomineeWithRankAndAverage => {
  const rank = rankedNominees.findIndex(n => n.id === nominee.id) + 1;
  const averageRating = calculateAverageRating(nominee.rating);

  return {
    ...nominee,
    averageRating,
    overallRank: rank,
    image: nominee.image || undefined,
    institution: {
      id: nominee.institution.id,
      name: nominee.institution.name,
      image: nominee.institution.image || undefined,
      status: nominee.institution.status,
      rating: nominee.institution.rating,
      createdAt: nominee.institution.createdAt,
      overallRank: nominee.institution.overallRank
    }
  };
};