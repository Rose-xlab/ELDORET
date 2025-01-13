// app/api/users/[id]/activity/ratings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getUser();
    if (!currentUser || currentUser.id !== parseInt(params.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [nomineeRatings, institutionRatings] = await Promise.all([
      prisma.nomineeRating.findMany({
        where: { userId: currentUser.id },
        include: {
          nominee: {
            select: {
              id: true,
              name: true,
              image: true
            }
          },
          ratingCategory: {
            select: {
              id: true,
              name: true,
              icon: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.institutionRating.findMany({
        where: { userId: currentUser.id },
        include: {
          institution: {
            select: {
              id: true,
              name: true,
              image: true
            }
          },
          ratingCategory: {
            select: {
              id: true,
              name: true,
              icon: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    // Format ratings for consistent structure
    const formattedRatings = [
      ...nomineeRatings.map(r => ({
        id: r.id,
        score: r.score,
        comment: r.comment,
        createdAt: r.createdAt,
        type: 'nominee' as const,
        target: r.nominee,
        ratingCategory: r.ratingCategory
      })),
      ...institutionRatings.map(r => ({
        id: r.id,
        score: r.score,
        comment: r.comment,
        createdAt: r.createdAt,
        type: 'institution' as const,
        target: r.institution,
        ratingCategory: r.ratingCategory
      }))
    ].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(formattedRatings);
  } catch (error) {
    console.error('Error fetching user ratings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ratings' },
      { status: 500 }
    );
  }
}