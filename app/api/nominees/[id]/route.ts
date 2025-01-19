import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import redis from '@/lib/redis';

const prisma = new PrismaClient();

// Longer cache times for better performance
const CACHE_TTL = {
  STALE: 60 * 60,    // 1 hour instead of 30 minutes
  REVALIDATE: 60     // Still check every minute for updates
};

// Simplified cache key - just one key for all nominee data
const CACHE_KEY = (id: number) => `nominee:${id}:complete`;

// Function to fetch complete nominee data
async function fetchCompleteNomineeData(id: number) {
  const [nominee, allNominees] = await Promise.all([
    prisma.nominee.findUnique({
      where: { id },
      include: {
        position: true,
        institution: true,
        district: true,
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
                },
                reactions: true
              }
            },
            reactions: true
          },
          orderBy: { createdAt: 'desc' }
        },
        scandals: {
          where: { verified: true },
          orderBy: { createdAt: 'desc' }
        },
        evidences: {
          where: { status: 'VERIFIED' },
          include: {
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
    }),
    prisma.nominee.findMany({
      include: {
        rating: true
      }
    })
  ]);

  if (!nominee) {
    return null;
  }

  // Calculate rank once as part of complete data
  const rankedNominees = allNominees
    .map(nominee => ({
      id: nominee.id,
      averageRating: nominee.rating.length > 0
        ? nominee.rating.reduce((acc, r) => acc + r.score, 0) / nominee.rating.length
        : 0
    }))
    .sort((a, b) => b.averageRating - a.averageRating);

  const rank = rankedNominees.findIndex(n => n.id === id) + 1;

  // Return complete data object
  return {
    ...nominee,
    overallRank: rank,
    calculatedAt: new Date().toISOString()
  };
}

// Background refresh function
async function refreshCache(id: number) {
  try {
    const freshData = await fetchCompleteNomineeData(id);
    if (freshData) {
      await redis.set(CACHE_KEY(id), freshData, { ex: CACHE_TTL.STALE });
    }
  } catch (error) {
    console.error('Background refresh failed:', error);
  }
}

// GET - Get nominee by ID with complete data
export async function GET(req: NextRequest) {
  try {
    const id = parseInt(req.nextUrl.pathname.split('/')[3], 10);
    const cacheKey = CACHE_KEY(id);

    // Try to get complete cached data
    const cachedData = await redis.get(cacheKey);

    // If we have cached data, serve it immediately
    if (cachedData) {
      // Check cache age and refresh in background if getting old
      const cacheAge = await redis.ttl(cacheKey);
      if (cacheAge < CACHE_TTL.REVALIDATE) {
        refreshCache(id).catch(console.error);
      }
      return NextResponse.json(cachedData);
    }

    // If no cache, get fresh data
    const nominee = await fetchCompleteNomineeData(id);

    if (!nominee) {
      return NextResponse.json({ error: 'Nominee not found' }, { status: 404 });
    }

    // Cache the complete fresh data
    await redis.set(cacheKey, nominee, { ex: CACHE_TTL.STALE });

    return NextResponse.json(nominee);
  } catch (error) {
    console.error('Error fetching nominee:', error);
    return NextResponse.json({ error: 'Error fetching nominee' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const id = parseInt(req.url.split('/').pop() as string, 10);
    const dataToUpdate = await req.json();

    const updatedNominee = await prisma.nominee.update({
      where: { id },
      data: dataToUpdate,
      include: {
        position: true,
        institution: true,
        district: true,
      },
    });

    // Invalidate the cache for this nominee
    await redis.del(CACHE_KEY(id));

    // Refresh cache immediately with new data
    refreshCache(id).catch(console.error);

    return NextResponse.json(updatedNominee);
  } catch (error) {
    return NextResponse.json({ error: 'Error updating nominee' + error }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = parseInt(req.url.split('/').pop() as string, 10);

    await prisma.nominee.delete({
      where: { id },
    });

    // Delete the cache for this nominee
    await redis.del(CACHE_KEY(id));

    return NextResponse.json({ message: 'Nominee deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting nominee' + error }, { status: 500 });
  }
}