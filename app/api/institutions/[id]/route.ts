import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import redis from '@/lib/redis';

const prisma = new PrismaClient();

const CACHE_TTL = {
  STALE: 60 * 20,    // 1 hour
  REVALIDATE: 60,    // Check every minute for updates
  BASIC_DATA: 24 * 60 * 60  // Basic data cached for 24 hours
};

const CACHE_KEY = {
  COMPLETE: (id: number) => `institution:${id}:complete`,
  BASIC: (id: number) => `institution:${id}:basic`
};

// Define interface for transformed nominee data
interface TransformedNominee {
  id: number;
  name: string;
  image: string | null;
  role: string;
}

// Interface for basic institution data
interface BasicInstitutionData {
  id: number;
  name: string;
  image: string | null;
  status: boolean;
  nominees: TransformedNominee[];
  averageRating: number;
  overallRank: number;
  lastUpdated: string;
}

// Function to fetch just basic institution data
async function fetchBasicInstitutionData(id: number): Promise<BasicInstitutionData | null> {
  const [institution, allInstitutions] = await Promise.all([
    prisma.institution.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        image: true,
        status: true,
        nominees: {
          select: {
            id: true,
            name: true,
            image: true,
            position: {
              select: {
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            rating: true
          }
        }
      }
    }),
    prisma.institution.findMany({
      select: {
        id: true,
        _count: {
          select: {
            rating: true
          }
        }
      }
    })
  ]);

  if (!institution) return null;

  // Calculate average rating (assuming a simpler rating model)
  const averageRating = 0; // You'll need to implement this based on your actual rating model

  // Calculate rank based on rating counts for this example
  const rankedInstitutions = allInstitutions
    .sort((a, b) => b._count.rating - a._count.rating);

  const rank = rankedInstitutions.findIndex(inst => inst.id === id) + 1;

  // Transform nominees data
  const transformedNominees: TransformedNominee[] = institution.nominees.map(nominee => ({
    id: nominee.id,
    name: nominee.name,
    image: nominee.image,
    role: nominee.position.name
  }));

  return {
    id: institution.id,
    name: institution.name,
    image: institution.image,
    status: institution.status,
    nominees: transformedNominees,
    averageRating,
    overallRank: rank,
    lastUpdated: new Date().toISOString()
  };
}

// Function to fetch complete institution data
async function fetchCompleteInstitutionData(id: number) {
  const institution = await prisma.institution.findUnique({
    where: { id },
    include: {
      nominees: {
        include: {
          position: true
        }
      },
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
  });

  if (!institution) {
    return null;
  }

  // Transform nominees data
  const transformedNominees: TransformedNominee[] = institution.nominees.map(nominee => ({
    id: nominee.id,
    name: nominee.name,
    image: nominee.image,
    role: nominee.position.name
  }));

  // Return complete data object
  return {
    ...institution,
    nominees: transformedNominees,
    calculatedAt: new Date().toISOString()
  };
}

// Background refresh function
async function refreshCache(id: number) {
  try {
    const [basicData, completeData] = await Promise.all([
      fetchBasicInstitutionData(id),
      fetchCompleteInstitutionData(id)
    ]);

    if (basicData) {
      await redis.set(CACHE_KEY.BASIC(id), basicData, { ex: CACHE_TTL.BASIC_DATA });
    }
    if (completeData) {
      await redis.set(CACHE_KEY.COMPLETE(id), completeData, { ex: CACHE_TTL.STALE });
    }
  } catch (error) {
    console.error('Background refresh failed:', error);
  }
}

// GET - Get institution by ID with staged loading
export async function GET(req: NextRequest) {
  try {
    const id = parseInt(req.nextUrl.pathname.split('/')[3], 10);
    const basicCacheKey = CACHE_KEY.BASIC(id);
    const completeCacheKey = CACHE_KEY.COMPLETE(id);

    // Check if client wants full data
    const wantFullData = req.headers.get('x-load-full-data') === 'true';

    if (!wantFullData) {
      // Try to get basic cached data first
      const cachedBasicData = await redis.get(basicCacheKey);
      if (cachedBasicData) {
        return NextResponse.json(cachedBasicData);
      }

      // If no basic cache, fetch and cache basic data
      const basicData = await fetchBasicInstitutionData(id);
      if (!basicData) {
        return NextResponse.json({ error: 'Institution not found' }, { status: 404 });
      }

      await redis.set(basicCacheKey, basicData, { ex: CACHE_TTL.BASIC_DATA });
      return NextResponse.json(basicData);
    }

    // Handle full data request
    const cachedCompleteData = await redis.get(completeCacheKey);
    if (cachedCompleteData) {
      const cacheAge = await redis.ttl(completeCacheKey);
      if (cacheAge < CACHE_TTL.REVALIDATE) {
        refreshCache(id).catch(console.error);
      }
      return NextResponse.json(cachedCompleteData);
    }

    const completeData = await fetchCompleteInstitutionData(id);
    if (!completeData) {
      return NextResponse.json({ error: 'Institution not found' }, { status: 404 });
    }

    await redis.set(completeCacheKey, completeData, { ex: CACHE_TTL.STALE });
    return NextResponse.json(completeData);
  } catch (error) {
    console.error('Error fetching institution:', error);
    return NextResponse.json({ error: 'Error fetching institution' }, { status: 500 });
  }
}

// PATCH - Update institution
export async function PATCH(req: NextRequest) {
  try {
    const id = parseInt(req.url.split('/').pop() as string, 10);
    const dataToUpdate = await req.json();

    const updatedInstitution = await prisma.institution.update({
      where: { id },
      data: dataToUpdate,
      include: {
        nominees: {
          include: {
            position: true
          }
        }
      }
    });

    // Transform nominees data
    const transformedNominees: TransformedNominee[] = updatedInstitution.nominees.map(nominee => ({
      id: nominee.id,
      name: nominee.name,
      image: nominee.image,
      role: nominee.position.name
    }));

    const response = {
      ...updatedInstitution,
      nominees: transformedNominees
    };

    // Invalidate both basic and complete caches
    await Promise.all([
      redis.del(CACHE_KEY.BASIC(id)),
      redis.del(CACHE_KEY.COMPLETE(id))
    ]);

    // Refresh caches immediately with new data
    refreshCache(id).catch(console.error);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating institution:', error);
    return NextResponse.json({ 
      error: 'Error updating institution: ' + error 
    }, { status: 500 });
  }
}

// DELETE - Delete institution
export async function DELETE(req: NextRequest) {
  try {
    const id = parseInt(req.url.split('/').pop() as string, 10);

    await prisma.institution.delete({
      where: { id },
    });

    // Delete both basic and complete caches
    await Promise.all([
      redis.del(CACHE_KEY.BASIC(id)),
      redis.del(CACHE_KEY.COMPLETE(id))
    ]);

    return NextResponse.json({ 
      message: 'Institution deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting institution:', error);
    return NextResponse.json({ 
      error: 'Error deleting institution: ' + error 
    }, { status: 500 });
  }
}