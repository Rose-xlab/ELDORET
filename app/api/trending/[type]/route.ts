// app/api/trending/[type]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    const type = params.type;
    const limit = 5; // Number of trending entities to return

    if (type === 'nominees') {
      const nominees = await prisma.nominee.findMany({
        where: { status: true },
        include: {
          rating: {
            include: {
              ratingCategory: true
            },
            orderBy: { createdAt: 'desc' },
            take: 2 // Only get 2 most recent ratings
          },
          position: true,
          institution: true
        },
        orderBy: {
          rating: {
            _count: 'desc'
          }
        },
        take: limit
      });

      const processedNominees = nominees.map(nominee => ({
        id: nominee.id,
        name: nominee.name,
        image: nominee.image,
        position: nominee.position,
        institution: nominee.institution,
        averageRating: nominee.rating.reduce((acc, r) => acc + r.score, 0) / nominee.rating.length,
        totalRatings: nominee.rating.length,
        recentRatings: nominee.rating.map(r => ({
          score: r.score,
          comment: r.comment,
          category: r.ratingCategory
        }))
      }));

      return NextResponse.json(processedNominees);
    } else if (type === 'institutions') {
      const institutions = await prisma.institution.findMany({
        where: { status: true },
        include: {
          rating: {
            include: {
              ratingCategory: true
            },
            orderBy: { createdAt: 'desc' },
            take: 2
          }
        },
        orderBy: {
          rating: {
            _count: 'desc'
          }
        },
        take: limit
      });

      const processedInstitutions = institutions.map(institution => ({
        id: institution.id,
        name: institution.name,
        image: institution.image,
        averageRating: institution.rating.reduce((acc, r) => acc + r.score, 0) / institution.rating.length,
        totalRatings: institution.rating.length,
        recentRatings: institution.rating.map(r => ({
          score: r.score,
          comment: r.comment,
          category: r.ratingCategory
        }))
      }));

      return NextResponse.json(processedInstitutions);
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching trending entities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending entities' },
      { status: 500 }
    );
  }
}