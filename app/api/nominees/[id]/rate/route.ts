import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limiter';
import type { RatingSubmission } from '@/types/interfaces';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Auth check - commented out for anonymous access
    // const user = await getUser();
    // if (!user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Using default user ID for anonymous access
    const user = { id: 0 };

    // 2. Parse and validate input
    const nomineeId = parseInt(params.id);
    const { ratings } = await req.json();

    if (!Array.isArray(ratings) || ratings.length === 0) {
      return NextResponse.json(
        { error: 'Invalid ratings format' },
        { status: 400 }
      );
    }

    // 3. Check rate limit - commented out for anonymous access
    // const rateLimitCheck = await checkRateLimit(user.id, nomineeId, 'nominee');
    // if (!rateLimitCheck.allowed) {
    //   return NextResponse.json(
    //     { error: rateLimitCheck.message },
    //     { status: 429 }
    //   );
    // }

    // 4. Submit ratings
    const createdRatings = await Promise.all(
      ratings.map(async (rating: RatingSubmission) => {
        return prisma.nomineeRating.create({
          data: {
            userId: user.id,
            nomineeId,
            ratingCategoryId: rating.categoryId,
            score: rating.score,
            comment: rating.comment || ''
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
      })
    );

    // 5. Create comment for overall comment if provided
    const overallComment = ratings[0]?.comment;
    if (overallComment) {
      await prisma.comment.create({
        data: {
          content: overallComment,
          userId: user.id,
          nomineeId
        }
      });
    }

    // 6. Get updated nominee data
    const updatedNominee = await prisma.nominee.findUnique({
      where: { id: nomineeId },
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
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Ratings submitted successfully',
      ratings: createdRatings,
      nominee: updatedNominee
    });
  } catch (error) {
    console.error('Error submitting ratings:', error);
    return NextResponse.json(
      { error: 'Failed to submit ratings' },
      { status: 500 }
    );
  }
}