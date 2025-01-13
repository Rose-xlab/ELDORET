// utils/profile-helpers.ts
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

interface EntityWithRatings {
  id: number;
  name: string;
  image?: string | null;
  position?: {
    id: number;
    name: string;
  };
  rating: {
    score: number;
    id: number;
  }[];
}

export async function getUserActivity(userId: number) {
  const [nomineeRatings, institutionRatings, comments] = await Promise.all([
    prisma.nomineeRating.findMany({
      where: { userId },
      include: {
        nominee: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        ratingCategory: true
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.institutionRating.findMany({
      where: { userId },
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        ratingCategory: true
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.comment.findMany({
      where: { userId },
      include: {
        nominee: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        institution: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        reactions: true
      },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  const ratings = [
    ...nomineeRatings.map(r => ({
      ...r,
      type: 'nominee' as const,
      target: r.nominee
    })),
    ...institutionRatings.map(r => ({
      ...r,
      type: 'institution' as const,
      target: r.institution
    }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const processedComments = comments.map(comment => ({
    ...comment,
    likes: comment.reactions.filter(r => r.isLike).length,
    dislikes: comment.reactions.filter(r => !r.isLike).length,
  }));

  return {
    ratings,
    comments: processedComments
  };
}

export async function getSimilarProfiles(
  id: number,
  type: 'nominee' | 'institution',
  limit: number = 4
): Promise<EntityWithRatings[]> {
  if (type === 'nominee') {
    const currentNominee = await prisma.nominee.findUnique({
      where: { id },
      include: {
        position: true,
        rating: true
      }
    });

    if (!currentNominee) return [];

    const similarNominees = await prisma.nominee.findMany({
      where: {
        AND: [
          { id: { not: id } },
          { positionId: currentNominee.positionId }
        ]
      },
      include: {
        position: {
          select: {
            id: true,
            name: true
          }
        },
        rating: {
          select: {
            id: true,
            score: true
          }
        }
      },
      take: limit
    });

    return similarNominees;
  } else {
    const similarInstitutions = await prisma.institution.findMany({
      where: {
        id: { not: id }
      },
      include: {
        rating: {
          select: {
            id: true,
            score: true
          }
        }
      },
      take: limit
    });

    return similarInstitutions;
  }
}

export function calculateAverageRating(entity: EntityWithRatings): number {
  if (!entity.rating || entity.rating.length === 0) return 0;
  const sum = entity.rating.reduce((acc: number, r) => acc + r.score, 0);
  return sum / entity.rating.length;
}