import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma, NomineeRating, InstitutionRating } from '@prisma/client';
import type { BaseResponse, NomineeWithRankAndAverage } from '@/types/interfaces';
import redis from '@/lib/redis';

const prisma = new PrismaClient();

const CACHE_TTL = {
  STALE: 60 * 30,    // Data can be served stale for 30 minutes
  REVALIDATE: 60     // Refresh it every minute in background
};

// Cache keys
const CACHE_KEYS = {
  basic: (page: number, limit: number, search: string, status: string | null) => 
    `nominees:basic:${page}:${limit}:${search}:${status}`,
  rankings: (page: number, rating: string | null) => 
    `nominees:rankings:${page}:${rating}`
};

// Helper function to calculate average rating
function calculateAverageRating(ratings: (NomineeRating | InstitutionRating)[]): number {
  if (!ratings.length) return 0;
  return ratings.reduce((acc, r) => acc + r.score, 0) / ratings.length;
}

// Helper function to format date to ISO string
function formatDate(date: Date): string {
  return date.toISOString();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status');
  const rating = searchParams.get('rating');

  try {
    const basicKey = CACHE_KEYS.basic(page, limit, search, status);
    const rankingsKey = CACHE_KEYS.rankings(page, rating);

    // Try to get cached data
    const [cachedBasic, cachedRankings] = await Promise.all([
      redis.get(basicKey),
      redis.get(rankingsKey)
    ]);

    // If we have cached data, serve it immediately
    if (cachedBasic && cachedRankings) {
      // Check cache age and refresh in background if getting old
      const cacheAge = await redis.ttl(rankingsKey);
      if (cacheAge < CACHE_TTL.REVALIDATE) {
        // Let this run in background
        fetchAndCacheData().catch(console.error);
      }

      return NextResponse.json({
        ...cachedBasic,
        data: cachedRankings
      });
    }

    // If no cache, fetch fresh data
    async function fetchAndCacheData() {
      const where: Prisma.NomineeWhereInput = {
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { position: { name: { contains: search, mode: 'insensitive' } } },
            { institution: { name: { contains: search, mode: 'insensitive' } } },
          ],
        }),
        ...(status === 'active' && { status: true }),
        ...(status === 'inactive' && { status: false }),
      };

      const total = await prisma.nominee.count({ where });
      const pages = Math.ceil(total / limit);
      const skip = (page - 1) * limit;

      const nominees = await prisma.nominee.findMany({
        where,
        skip,
        take: limit,
        include: {
          position: true,
          institution: {
            include: {
              rating: {
                include: {
                  ratingCategory: true
                }
              }
            }
          },
          rating: {
            include: {
              ratingCategory: true,
              user: true
            }
          },
          district: true,
          comments: {
            include: {
              user: true,
              replies: {
                include: {
                  user: true,
                  reactions: true
                }
              },
              reactions: true
            }
          }
        },
        orderBy: rating === 'high'
          ? { rating: { _count: 'desc' } }
          : rating === 'low'
            ? { rating: { _count: 'asc' } }
            : { createdAt: 'desc' }
      });

      const allNominees = await prisma.nominee.findMany({
        include: {
          rating: true
        }
      });

      const rankedNominees = allNominees
        .map(nominee => ({
          id: nominee.id,
          averageRating: calculateAverageRating(nominee.rating)
        }))
        .sort((a, b) => b.averageRating - a.averageRating);

      const nomineesWithRank: NomineeWithRankAndAverage[] = nominees.map(nominee => {
        // Your existing nominee transformation code exactly as is
        const rank = rankedNominees.findIndex(n => n.id === nominee.id) + 1;
        const averageRating = calculateAverageRating(nominee.rating);

        return {
          id: nominee.id,
          name: nominee.name,
          image: nominee.image ?? undefined,
          evidence: nominee.evidence ?? undefined,
          positionId: nominee.positionId,
          institutionId: nominee.institutionId,
          districtId: nominee.districtId,
          status: nominee.status,
          averageRating,
          overallRank: rank,
          createdAt: formatDate(nominee.createdAt),
          position: {
            id: nominee.position.id,
            name: nominee.position.name,
            status: nominee.position.status,
            createdAt: formatDate(nominee.position.createdAt)
          },
          institution: {
            id: nominee.institution.id,
            name: nominee.institution.name,
            image: nominee.institution.image ?? undefined,
            status: nominee.institution.status,
            rating: nominee.institution.rating.map(r => ({
              id: r.id,
              score: r.score,
              comment: r.comment || '',
              createdAt: formatDate(r.createdAt),
              ratingCategory: {
                id: r.ratingCategory.id,
                name: r.ratingCategory.name,
                icon: r.ratingCategory.icon,
                weight: r.ratingCategory.weight,
                description: r.ratingCategory.description,
                examples: r.ratingCategory.examples
              }
            })),
            createdAt: formatDate(nominee.institution.createdAt),
            overallRank: nominee.institution.overallRank ?? undefined
          },
          district: {
            id: nominee.district.id,
            name: nominee.district.name,
            region: nominee.district.region,
            status: nominee.district.status,
            createdAt: formatDate(nominee.district.createdAt)
          },
          rating: nominee.rating.map(r => ({
            id: r.id,
            score: r.score,
            comment: r.comment || '',
            createdAt: formatDate(r.createdAt),
            user: r.user ? {
              id: r.user.id,
              name: r.user.name,
              image: r.user.image ?? undefined
            } : undefined,
            ratingCategory: {
              id: r.ratingCategory.id,
              name: r.ratingCategory.name,
              icon: r.ratingCategory.icon,
              weight: r.ratingCategory.weight,
              description: r.ratingCategory.description,
              examples: r.ratingCategory.examples
            }
          })),
          comments: nominee.comments.map(comment => ({
            id: comment.id,
            content: comment.content,
            userId: comment.userId,
            nomineeId: comment.nomineeId ?? undefined,
            institutionId: comment.institutionId ?? undefined,
            createdAt: formatDate(comment.createdAt),
            user: {
              id: comment.user.id,
              name: comment.user.name,
              image: comment.user.image ?? undefined
            },
            replies: comment.replies.map(reply => ({
              id: reply.id,
              content: reply.content,
              createdAt: formatDate(reply.createdAt),
              user: {
                id: reply.user.id,
                name: reply.user.name,
                image: reply.user.image ?? undefined
              },
              reactions: reply.reactions.map(reaction => ({
                id: reaction.id,
                userId: reaction.userId,
                isLike: reaction.isLike,
                createdAt: formatDate(reaction.createdAt)
              })),
              likes: reply.reactions.filter(r => r.isLike).length,
              dislikes: reply.reactions.filter(r => !r.isLike).length,
              userReaction: reply.reactions.find(r => r.userId === 1)?.isLike
            })),
            reactions: comment.reactions.map(reaction => ({
              id: reaction.id,
              userId: reaction.userId,
              isLike: reaction.isLike,
              createdAt: formatDate(reaction.createdAt)
            })),
            likes: comment.reactions.filter(r => r.isLike).length,
            dislikes: comment.reactions.filter(r => !r.isLike).length,
            userReaction: comment.reactions.find(r => r.userId === 1)?.isLike
          }))
        };
      });

      if (rating) {
        nomineesWithRank.sort((a, b) =>
          rating === 'high'
            ? b.averageRating - a.averageRating
            : a.averageRating - b.averageRating
        );
      }

      const basicData = {
        count: total,
        pages,
        currentPage: page
      };

      // Cache with stale-while-revalidate TTLs
      await Promise.all([
        redis.set(basicKey, basicData, { ex: CACHE_TTL.STALE }),
        redis.set(rankingsKey, nomineesWithRank, { ex: CACHE_TTL.STALE })
      ]);

      return { basicData, nomineesWithRank };
    }

    // Get fresh data and cache it
    const { basicData, nomineesWithRank } = await fetchAndCacheData();

    return NextResponse.json({
      ...basicData,
      data: nomineesWithRank
    });

  } catch (error) {
    console.error('Error fetching nominees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch nominees' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const inputData = await req.json();

    const nominee = await prisma.nominee.create({
      data: {
        name: inputData.name,
        image: inputData.image,
        position: {
          connect: { id: inputData.positionId }
        },
        institution: {
          connect: { id: inputData.institutionId }
        },
        district: {
          connect: { id: inputData.districtId }
        },
        status: inputData.status ?? true,
      }
    });

    // Invalidate all nominee caches
    const keys = await redis.keys('nominees:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }

    return NextResponse.json(nominee);
  } catch (error) {
    console.error('Error creating nominee:', error);
    return NextResponse.json({ error: 'Failed to create nominee' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const inputData = await req.json();

    const updateData: Prisma.NomineeUpdateInput = {
      ...(inputData.name && { name: inputData.name }),
      ...(inputData.image !== undefined && { image: inputData.image }),
      ...(inputData.positionId && {
        position: { connect: { id: inputData.positionId } }
      }),
      ...(inputData.institutionId && {
        institution: { connect: { id: inputData.institutionId } }
      }),
      ...(inputData.districtId && {
        district: { connect: { id: inputData.districtId } }
      }),
      ...(inputData.status !== undefined && { status: inputData.status })
    };

    const nominee = await prisma.nominee.update({
      where: { id: inputData.id },
      data: updateData
    });

    // Invalidate all nominee caches
    const keys = await redis.keys('nominees:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }

    return NextResponse.json(nominee);
  } catch (error) {
    console.error('Error updating nominee:', error);
    return NextResponse.json({ error: 'Failed to update nominee' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get('id') || '');

    const nominee = await prisma.nominee.delete({
      where: { id }
    });

    // Invalidate all nominee caches
    const keys = await redis.keys('nominees:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }

    return NextResponse.json(nominee);
  } catch (error) {
    console.error('Error deleting nominee:', error);
    return NextResponse.json({ error: 'Failed to delete nominee' }, { status: 500 });
  }
}