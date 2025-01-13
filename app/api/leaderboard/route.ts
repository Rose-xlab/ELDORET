import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Mark as dynamic since we use request URL and database queries
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const searchParams = new URL(req.url).searchParams;
    const type = searchParams.get('type') as 'nominees' | 'institutions';
    const categoryId = searchParams.get('categoryId');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Input validation
    if (!type || !['nominees', 'institutions'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type parameter' },
        { status: 400 }
      );
    }

    if (categoryId && isNaN(parseInt(categoryId))) {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400 }
      );
    }

    if (isNaN(limit) || limit < 1) {
      return NextResponse.json(
        { error: 'Invalid limit parameter' },
        { status: 400 }
      );
    }

    if (type === 'nominees') {
      const nominees = await prisma.nominee.findMany({
        where: {
          status: true,
          rating: categoryId ? {
            some: {
              ratingCategoryId: parseInt(categoryId)
            }
          } : undefined
        },
        include: {
          position: true,
          institution: {
            select: {
              id: true,
              name: true
            }
          },
          rating: {
            where: categoryId ? {
              ratingCategoryId: parseInt(categoryId)
            } : undefined,
            include: {
              ratingCategory: true
            }
          }
        }
      });

      const rankedNominees = nominees
        .map(nominee => {
          const avgRating = nominee.rating.length > 0
            ? nominee.rating.reduce((acc, r) => acc + r.score, 0) / nominee.rating.length
            : 0;

          return {
            ...nominee,
            averageRating: avgRating,
            totalRatings: nominee.rating.length
          };
        })
        .sort((a, b) => b.averageRating - a.averageRating)
        .slice(0, limit);

      return NextResponse.json(rankedNominees);
    } else {
      const institutions = await prisma.institution.findMany({
        where: {
          status: true,
          rating: categoryId ? {
            some: {
              ratingCategoryId: parseInt(categoryId)
            }
          } : undefined
        },
        include: {
          rating: {
            where: categoryId ? {
              ratingCategoryId: parseInt(categoryId)
            } : undefined,
            include: {
              ratingCategory: true
            }
          }
        }
      });

      const rankedInstitutions = institutions
        .map(institution => {
          const avgRating = institution.rating.length > 0
            ? institution.rating.reduce((acc, r) => acc + r.score, 0) / institution.rating.length
            : 0;

          return {
            ...institution,
            averageRating: avgRating,
            totalRatings: institution.rating.length
          };
        })
        .sort((a, b) => b.averageRating - a.averageRating)
        .slice(0, limit);

      return NextResponse.json(rankedInstitutions);
    }
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}