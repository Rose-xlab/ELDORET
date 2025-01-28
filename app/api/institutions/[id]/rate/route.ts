import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limiter';

interface RatingInput {
  categoryId: number;
  score: number;
  comment?: string;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Auth check - commented out for anonymous access
    // const user = await getUser();
    // if (!user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Using default user ID for anonymous access
    const user = { id: 0 };

    const institutionId = parseInt(req.nextUrl.pathname.split('/')[3], 10);
    const institution = await prisma.institution.findUnique({
      where: { id: institutionId },
    });

    if (!institution) {
      return NextResponse.json({ error: 'Institution not found' }, { status: 404 });
    }

    // 2. Check rate limit - commented out for anonymous access
    // const rateLimitCheck = await checkRateLimit(user.id, institutionId, 'institution');
    // if (!rateLimitCheck.allowed) {
    //   return NextResponse.json(
    //     { error: rateLimitCheck.message },
    //     { status: 429 }
    //   );
    // }

    const { ratings } = (await req.json()) as { ratings: RatingInput[] };

    if (!Array.isArray(ratings) || ratings.length === 0) {
      return NextResponse.json({ error: 'Ratings must be an array with at least one item' }, { status: 400 });
    }

    const createdRatings = await Promise.all(
      ratings.map(async (rating) => {
        const { categoryId, score, comment } = rating;

        if (!Number.isInteger(score) || score < 1 || score > 5) {
          throw new Error('Score must be an integer between 1 and 5');
        }

        return prisma.institutionRating.create({
          data: {
            score,
            comment: comment || '',
            userId: user.id,  // Will use anonymous user ID (0)
            institutionId,
            ratingCategoryId: categoryId,
          },
        });
      })
    ).catch((error) => {
      throw new Error('Invalid rating data: ' + error.message);
    });

    // Optional: Add comment creation
    const overallComment = ratings[0]?.comment;
    if (overallComment) {
      await prisma.comment.create({
        data: {
          content: overallComment,
          userId: user.id,
          institutionId
        }
      });
    }

    return NextResponse.json({ ratings: createdRatings }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Error submitting ratings'
    }, { status: 500 });
  }
}