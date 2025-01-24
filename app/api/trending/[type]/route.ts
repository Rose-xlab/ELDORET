import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    const type = params.type;
    const limit = 5;

    if (type === 'nominees') {
      const nominees = await prisma.nominee.findMany({
        // where: { status: true },
        include: {
          rating: {
            include: {
              ratingCategory: true
            }
          },
          position: true,
          institution: true
        }
      });

      const processedNominees = nominees.map(nominee => ({
        id: nominee.id,
        name: nominee.name,
        image: nominee.image,
        position: nominee.position,
        institution: nominee.institution,
        averageRating: nominee.rating.length > 0
          ? nominee.rating.reduce((acc, r) => acc + r.score, 0) / nominee.rating.length
          : 0,
        totalRatings: nominee.rating.length,
        recentRatings: nominee.rating
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 2)
          .map(r => ({
            score: r.score,
            comment: r.comment,
            category: r.ratingCategory
          }))
      }))
        .sort((a, b) => b.averageRating - a.averageRating)
        .slice(0, limit);

      return NextResponse.json(processedNominees);
    } else if (type === 'institutions') {
      const institutions = await prisma.institution.findMany({
        // where: { status: true },
        include: {
          rating: {
            include: {
              ratingCategory: true
            }
          }
        }
      });

      const processedInstitutions = institutions.map(institution => ({
        id: institution.id,
        name: institution.name,
        image: institution.image,
        averageRating: institution.rating.length > 0
          ? institution.rating.reduce((acc, r) => acc + r.score, 0) / institution.rating.length
          : 0,
        totalRatings: institution.rating.length,
        recentRatings: institution.rating
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 2)
          .map(r => ({
            score: r.score,
            comment: r.comment,
            category: r.ratingCategory
          }))
      }))
        .sort((a, b) => b.averageRating - a.averageRating)
        .slice(0, limit);

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