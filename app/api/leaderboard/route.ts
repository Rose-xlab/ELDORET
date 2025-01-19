import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import redis from '@/lib/redis';

// Mark as dynamic since we use request URL and database queries
export const dynamic = 'force-dynamic';

// Cache configuration
const CACHE_TTL = {
  STALE: 60 * 30,    // Data can be served stale for 30 minutes
  REVALIDATE: 60     // Refresh it every minute in background
};

// Cache keys
const CACHE_KEYS = {
  leaderboard: (type: string, categoryId: string | null, limit: number) => 
    `leaderboard:${type}:${categoryId}:${limit}`
};

// Function to fetch fresh data
async function fetchFreshData(type: 'nominees' | 'institutions', categoryId: string | null, limit: number) {
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

    return rankedNominees;
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

    return rankedInstitutions;
  }
}

// Background refresh function
async function refreshCache(type: 'nominees' | 'institutions', categoryId: string | null, limit: number) {
  const cacheKey = CACHE_KEYS.leaderboard(type, categoryId, limit);

  try {
    const freshData = await fetchFreshData(type, categoryId, limit);
    await redis.set(cacheKey, freshData, { ex: CACHE_TTL.STALE });
  } catch (error) {
    console.error('Background refresh failed:', error);
  }
}

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

    // Try to get cached data
    const cacheKey = CACHE_KEYS.leaderboard(type, categoryId, limit);
    const cachedData = await redis.get(cacheKey);

    // If we have cached data, serve it immediately
    if (cachedData) {
      // Check cache age and refresh in background if getting old
      const cacheAge = await redis.ttl(cacheKey);
      if (cacheAge < CACHE_TTL.REVALIDATE) {
        // Don't await - let it refresh in background
        refreshCache(type, categoryId, limit).catch(console.error);
      }

      return NextResponse.json(cachedData);
    }

    // If no cache, get fresh data
    const freshData = await fetchFreshData(type, categoryId, limit);

    // Cache the fresh data
    await redis.set(cacheKey, freshData, { ex: CACHE_TTL.STALE });

    return NextResponse.json(freshData);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}