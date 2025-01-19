// app/api/institutions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Institution, Nominee, InstitutionRating } from '@prisma/client';
import redis from '@/lib/redis';

interface WhereClause {
  name?: { contains: string; mode: 'insensitive' };
  status?: boolean;
  type?: string;
}

interface InstitutionWithRating extends Institution {
  nominees: Nominee[];
  rating: (InstitutionRating & {
    ratingCategory: {
      id: number;
      name: string;
      weight: number;
    }
  })[];
  averageRating?: number;
}

// Updated cache configuration with stale-while-revalidate
const CACHE_TTL = {
  STALE: 60 * 30,    // Data can be served stale for 30 minutes
  REVALIDATE: 60     // Refresh it every minute in background
};

// Cache keys
const CACHE_KEYS = {
  basic: (page: number, limit: number, search: string, status: string | null, type: string | null) => 
    `institutions:basic:${page}:${limit}:${search}:${status}:${type}`,
  ratings: (page: number, rating: string | null) => 
    `institutions:ratings:${page}:${rating}`
}

// Function to fetch and process fresh data
async function fetchFreshData(page: number, limit: number, search: string, status: string | null, type: string | null, rating: string | null) {
  const where: WhereClause = {};

  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }

  if (status === 'active') {
    where.status = true;
  } else if (status === 'inactive') {
    where.status = false;
  }

  if (type) {
    where.type = type;
  }

  const [total, rawInstitutions] = await Promise.all([
    prisma.institution.count({ where }),
    prisma.institution.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        nominees: true,
        rating: {
          include: {
            ratingCategory: true
          }
        }
      },
      orderBy: rating === 'high'
        ? { rating: { _count: 'desc' } }
        : rating === 'low'
        ? { rating: { _count: 'asc' } }
        : { createdAt: 'desc' }
    })
  ]);

  const pages = Math.ceil(total / limit);

  const institutions: InstitutionWithRating[] = rawInstitutions.map(institution => ({
    ...institution,
    averageRating: institution.rating.length
      ? institution.rating.reduce((acc, r) => acc + r.score, 0) / institution.rating.length
      : 0
  }));

  if (rating) {
    institutions.sort((a, b) => {
      const aRating = a.averageRating || 0;
      const bRating = b.averageRating || 0;
      return rating === 'high' ? bRating - aRating : aRating - bRating;
    });
  }

  return {
    institutions,
    basicData: {
      count: total,
      pages,
      currentPage: page
    }
  };
}

// Background refresh function
async function refreshCache(page: number, limit: number, search: string, status: string | null, type: string | null, rating: string | null) {
  const basicKey = CACHE_KEYS.basic(page, limit, search, status, type);
  const ratingsKey = CACHE_KEYS.ratings(page, rating);

  try {
    const { institutions, basicData } = await fetchFreshData(page, limit, search, status, type, rating);
    
    await Promise.all([
      redis.set(basicKey, basicData, { ex: CACHE_TTL.STALE }),
      redis.set(ratingsKey, institutions, { ex: CACHE_TTL.STALE })
    ]);
  } catch (error) {
    console.error('Background refresh failed:', error);
  }
}

// Preload function
async function preloadCache() {
  const basicKey = CACHE_KEYS.basic(1, 10, '', null, null);
  const ratingsKey = CACHE_KEYS.ratings(1, null);

  const [cachedBasic, cachedRatings] = await Promise.all([
    redis.get(basicKey),
    redis.get(ratingsKey)
  ]);

  if (!cachedBasic || !cachedRatings) {
    const { institutions, basicData } = await fetchFreshData(1, 10, '', null, null, null);
    
    await Promise.all([
      redis.set(basicKey, basicData, { ex: CACHE_TTL.STALE }),
      redis.set(ratingsKey, institutions, { ex: CACHE_TTL.STALE })
    ]);
  }
}

// Call preload when server starts
preloadCache().catch(console.error);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status');
  const rating = searchParams.get('rating');
  const type = searchParams.get('type');

  try {
    const basicKey = CACHE_KEYS.basic(page, limit, search, status, type);
    const ratingsKey = CACHE_KEYS.ratings(page, rating);

    // Try to get cached data
    const [cachedBasic, cachedRatings] = await Promise.all([
      redis.get(basicKey),
      redis.get(ratingsKey)
    ]);

    // If we have cached data, serve it immediately
    if (cachedBasic && cachedRatings) {
      // Check cache age and refresh in background if getting old
      const cacheAge = await redis.ttl(ratingsKey);
      if (cacheAge < CACHE_TTL.REVALIDATE) {
        // Don't await - let it refresh in background
        refreshCache(page, limit, search, status, type, rating).catch(console.error);
      }

      return NextResponse.json({
        ...cachedBasic,
        data: cachedRatings
      });
    }

    // If no cache, get fresh data
    const { institutions, basicData } = await fetchFreshData(page, limit, search, status, type, rating);

    // Cache the fresh data
    await Promise.all([
      redis.set(basicKey, basicData, { ex: CACHE_TTL.STALE }),
      redis.set(ratingsKey, institutions, { ex: CACHE_TTL.STALE })
    ]);

    return NextResponse.json({
      ...basicData,
      data: institutions
    });

  } catch (error) {
    console.error('Error fetching institutions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch institutions' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, image } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Institution name is required' },
        { status: 400 }
      );
    }

    const newInstitution = await prisma.institution.create({
      data: {
        name: name.trim(),
        image,
        status: true
      },
    });

    // Invalidate all institution caches
    const keys = await redis.keys('institutions:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }

    // Trigger preload after cache invalidation
    await preloadCache();

    return NextResponse.json(newInstitution, { status: 201 });
  } catch (error) {
    console.error('Error creating institution:', error);
    return NextResponse.json(
      { error: 'Failed to create institution' },
      { status: 500 }
    );
  }
}