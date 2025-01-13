import { prisma } from '@/lib/prisma';
import { submitComment } from './comment-helpers';
import { 
  Prisma, 
  Nominee, 
  Institution, 
  NomineeRating, 
  InstitutionRating, 
  User, 
  RatingCategory as PrismaRatingCategory,
  InstitutionRatingCategory as PrismaInstitutionRatingCategory
} from '@prisma/client';

// Define the types for our rating submissions
interface BaseRatingSubmission {
  categoryId: number;
  score: number;
  comment?: string;
}

export interface RatingSubmission extends BaseRatingSubmission {
  id?: number;
}

// Define comprehensive types for ratings with their relations
interface RatingWithRelations extends NomineeRating {
  ratingCategory: PrismaRatingCategory;
  user: Pick<User, 'id' | 'name' | 'image'>;
}

interface InstitutionRatingWithRelations extends InstitutionRating {
  ratingCategory: PrismaInstitutionRatingCategory;
  user: Pick<User, 'id' | 'name' | 'image'>;
}

// Define the EntityData type with proper typing
export type EntityData = (
  | (Nominee & { rating: RatingWithRelations[] })
  | (Institution & { rating: InstitutionRatingWithRelations[] })
) & {
  comments: Array<{
    id: number;
    content: string;
    userId: number;
    user: Pick<User, 'id' | 'name' | 'image'>;
    replies: Array<{
      id: number;
      content: string;
      userId: number;
      user: Pick<User, 'id' | 'name' | 'image'>;
    }>;
    reactions: Array<{
      id: number;
      userId: number;
      isLike: boolean;
    }>;
  }>;
};

export interface RatingResponse {
  entity: EntityData;
  ratings?: (RatingWithRelations | InstitutionRatingWithRelations)[];
}

async function checkRateLimit(type: 'nominee' | 'institution', targetId: number): Promise<boolean> {
  try {
    const response = await fetch(
      `/api/users/rate-limit?type=${type}&targetId=${targetId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Rate limit check failed (${response.status})`);
    }

    const data = await response.json();
    if (!data.allowed) {
      throw new Error(data.message);
    }

    return true;
  } catch (error) {
    throw error instanceof Error ? error : new Error('Rate limit check failed');
  }
}

async function submitRating(
  userId: number,
  targetId: number,
  categoryId: number,
  score: number,
  comment: string,
  type: 'nominee' | 'institution',
  isOverallComment: boolean = false
) {
  const baseRatingData = {
    userId,
    score,
    comment: comment || null,
    ratingCategoryId: categoryId,
  };

  if (type === 'nominee') {
    const rating = await prisma.nomineeRating.create({
      data: {
        ...baseRatingData,
        nomineeId: targetId,
      },
      include: {
        ratingCategory: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });

    if (comment?.trim() && (isOverallComment || categoryId)) {
      await submitComment(
        userId,        // userId
        comment,       // content
        type,         // type
        targetId,     // targetId
        undefined,    // parentId
        true          // isRatingComment
      );
    }

    return rating;
  } else {
    const rating = await prisma.institutionRating.create({
      data: {
        ...baseRatingData,
        institutionId: targetId,
      },
      include: {
        ratingCategory: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });

    if (comment?.trim() && (isOverallComment || categoryId)) {
      await submitComment(
        userId,        // userId
        comment,       // content
        type,         // type
        targetId,     // targetId
        undefined,    // parentId
        true          // isRatingComment
      );
    }

    return rating;
  }
}

export async function handleRatingSubmission(
  userId: number,
  entityId: number,
  ratings: RatingSubmission[],
  type: 'nominee' | 'institution'
): Promise<RatingResponse> {
  try {
    await checkRateLimit(type, entityId);
    const createdRatings = [];
    
    const overallComment = ratings[0]?.comment;
    if (overallComment?.trim()) {
      await submitComment(
        userId,           // userId
        overallComment,   // content
        type,            // type
        entityId,        // targetId
        undefined,       // parentId
        true             // isRatingComment
      );
    }

    for (const rating of ratings) {
      const createdRating = await submitRating(
        userId,
        entityId,
        rating.categoryId,
        rating.score,
        rating.comment || '',
        type,
        false
      );
      createdRatings.push(createdRating);
    }

    const includeOptions = {
      rating: {
        include: {
          ratingCategory: true,
          user: {
            select: {
              id: true,
              name: true,
              image: true
            }
          }
        }
      },
      comments: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true
            }
          },
          replies: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true
                }
              }
            }
          },
          reactions: true
        },
        orderBy: {
          createdAt: Prisma.SortOrder.desc
        }
      }
    } as const;

    const updatedEntity = await (type === 'nominee'
      ? prisma.nominee.findUnique({
          where: { id: entityId },
          include: includeOptions
        })
      : prisma.institution.findUnique({
          where: { id: entityId },
          include: includeOptions
        })) as EntityData;

    return {
      ratings: createdRatings,
      entity: updatedEntity
    };
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to submit rating');
  }
}