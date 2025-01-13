import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limiter';

interface RatingSubmission {
  categoryId: number;
  score: number;
  comment?: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  try {
    // 1. Auth check
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse and validate input
    const { ratings } = await req.json() as { ratings: RatingSubmission[] };
    const type = params.type === 'nominees' ? 'nominee' : 'institution';
    const numericId = parseInt(params.id);

    if (Number.isNaN(numericId)) {
      return NextResponse.json(
        { error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    if (!Array.isArray(ratings) || ratings.length === 0) {
      return NextResponse.json(
        { error: 'Invalid ratings format' },
        { status: 400 }
      );
    }

    // Validate all ratings
    for (const rating of ratings) {
      if (
        typeof rating.score !== 'number' ||
        rating.score < 1 ||
        rating.score > 5 ||
        typeof rating.categoryId !== 'number'
      ) {
        return NextResponse.json(
          { error: 'Invalid rating data' },
          { status: 400 }
        );
      }
    }

    // 3. Check rate limit with corrected parameter order
    const rateLimitCheck = await checkRateLimit(user.id, numericId, type);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // 4. Create ratings within a transaction
    const result = await prisma.$transaction(async (prisma) => {
      const createdRatings = await Promise.all(
        ratings.map(async (rating) => {
          const baseData = {
            userId: user.id,
            score: rating.score,
            comment: rating.comment || '',
            ratingCategoryId: rating.categoryId,
          };

          if (type === 'nominee') {
            return prisma.nomineeRating.create({
              data: {
                ...baseData,
                nomineeId: numericId,
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
          } else {
            return prisma.institutionRating.create({
              data: {
                ...baseData,
                institutionId: numericId,
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
          }
        })
      );

      // Create comments for ratings if provided
      const comments = ratings.filter(r => r.comment?.trim());
      if (comments.length > 0) {
        await prisma.comment.createMany({
          data: comments.map(rating => ({
            content: rating.comment!,
            userId: user.id,
            ...(type === 'nominee' 
              ? { nomineeId: numericId }
              : { institutionId: numericId }
            ),
            status: true
          }))
        });
      }

      // Get updated entity data
      const updatedEntity = await (type === 'nominee'
        ? prisma.nominee.findUnique({
            where: { id: numericId },
            include: {
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
                orderBy: { createdAt: 'desc' }
              }
            }
          })
        : prisma.institution.findUnique({
            where: { id: numericId },
            include: {
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
                orderBy: { createdAt: 'desc' }
              }
            }
          }));

      return { ratings: createdRatings, entity: updatedEntity };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error submitting ratings:', error);
    return NextResponse.json(
      { error: 'Failed to submit ratings' },
      { status: 500 }
    );
  }
}