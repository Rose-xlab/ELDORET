// utils/rankings.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RankedEntity {
  id: number;
  name: string;
  rating: Array<{ score: number }>;
}

interface EntityWithRanking {
  id: number;
  name: string;
  averageRating: number;
  totalRatings: number;
}

export async function getRankingStats(type: 'nominee' | 'institution') {
  try {
    // Separate queries based on type to avoid union type issues
    const [entities, totalRatings] = await (async () => {
      if (type === 'nominee') {
        const nominees = await prisma.nominee.findMany({
          select: {
            id: true,
            name: true,
            rating: {
              select: {
                score: true
              }
            }
          }
        });
        const ratingsCount = await prisma.nomineeRating.count();
        return [nominees, ratingsCount] as const;
      } else {
        const institutions = await prisma.institution.findMany({
          select: {
            id: true,
            name: true,
            rating: {
              select: {
                score: true
              }
            }
          }
        });
        const ratingsCount = await prisma.institutionRating.count();
        return [institutions, ratingsCount] as const;
      }
    })();

    // Calculate rankings for each entity
    const rankedEntities: EntityWithRanking[] = entities.map(entity => ({
      id: entity.id,
      name: entity.name,
      averageRating: entity.rating.length > 0
        ? entity.rating.reduce((acc, curr) => acc + curr.score, 0) / entity.rating.length
        : 0,
      totalRatings: entity.rating.length
    }));

    // Sort by average rating
    const sortedEntities = [...rankedEntities].sort((a, b) => b.averageRating - a.averageRating);

    return {
      totalEntities: entities.length,
      totalRatings,
      topRated: sortedEntities.slice(0, 10) // Get top 10
    };
  } catch (error) {
    console.error('Error calculating ranking stats:', error);
    throw error;
  }
}

export async function getNomineeRank(nomineeId: number): Promise<{ rank: number; totalRatings: number }> {
  const nominees = await prisma.nominee.findMany({
    select: {
      id: true,
      rating: {
        select: {
          score: true
        }
      }
    }
  });

  const rankings = nominees
    .map(nominee => ({
      id: nominee.id,
      averageRating: nominee.rating.length > 0
        ? nominee.rating.reduce((acc, curr) => acc + curr.score, 0) / nominee.rating.length
        : 0,
      totalRatings: nominee.rating.length
    }))
    .sort((a, b) => b.averageRating - a.averageRating);

  const rank = rankings.findIndex(r => r.id === nomineeId) + 1;
  const nomineeData = rankings.find(r => r.id === nomineeId);

  return {
    rank: rank || 0,
    totalRatings: nomineeData?.totalRatings || 0
  };
}

export async function getInstitutionRank(institutionId: number): Promise<{ rank: number; totalRatings: number }> {
  const institutions = await prisma.institution.findMany({
    select: {
      id: true,
      rating: {
        select: {
          score: true
        }
      }
    }
  });

  const rankings = institutions
    .map(institution => ({
      id: institution.id,
      averageRating: institution.rating.length > 0
        ? institution.rating.reduce((acc, curr) => acc + curr.score, 0) / institution.rating.length
        : 0,
      totalRatings: institution.rating.length
    }))
    .sort((a, b) => b.averageRating - a.averageRating);

  const rank = rankings.findIndex(r => r.id === institutionId) + 1;
  const institutionData = rankings.find(r => r.id === institutionId);

  return {
    rank: rank || 0,
    totalRatings: institutionData?.totalRatings || 0
  };
}

export async function getNomineeCategoryRank(nomineeId: number, categoryId: number): Promise<{ rank: number; totalRatings: number }> {
  const nomineeRatings = await prisma.nominee.findMany({
    select: {
      id: true,
      rating: {
        where: {
          ratingCategoryId: categoryId
        },
        select: {
          score: true
        }
      }
    }
  });

  const rankings = nomineeRatings
    .map(nominee => ({
      id: nominee.id,
      averageRating: nominee.rating.length > 0
        ? nominee.rating.reduce((acc, curr) => acc + curr.score, 0) / nominee.rating.length
        : 0,
      totalRatings: nominee.rating.length
    }))
    .sort((a, b) => b.averageRating - a.averageRating);

  const rank = rankings.findIndex(r => r.id === nomineeId) + 1;
  const nomineeData = rankings.find(r => r.id === nomineeId);

  return {
    rank: rank || 0,
    totalRatings: nomineeData?.totalRatings || 0
  };
}

export async function getInstitutionCategoryRank(institutionId: number, categoryId: number): Promise<{ rank: number; totalRatings: number }> {
  const institutionRatings = await prisma.institution.findMany({
    select: {
      id: true,
      rating: {
        where: {
          ratingCategoryId: categoryId
        },
        select: {
          score: true
        }
      }
    }
  });

  const rankings = institutionRatings
    .map(institution => ({
      id: institution.id,
      averageRating: institution.rating.length > 0
        ? institution.rating.reduce((acc, curr) => acc + curr.score, 0) / institution.rating.length
        : 0,
      totalRatings: institution.rating.length
    }))
    .sort((a, b) => b.averageRating - a.averageRating);

  const rank = rankings.findIndex(r => r.id === institutionId) + 1;
  const institutionData = rankings.find(r => r.id === institutionId);

  return {
    rank: rank || 0,
    totalRatings: institutionData?.totalRatings || 0
  };
}