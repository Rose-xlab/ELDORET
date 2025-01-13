import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    // Get current nominee's details
    const currentNominee = await prisma.nominee.findUnique({
      where: { id },
      include: {
        position: true,
        institution: true,
        rating: {
          include: {
            ratingCategory: true
          }
        }
      }
    });

    if (!currentNominee) {
      return NextResponse.json(
        { error: 'Nominee not found' },
        { status: 404 }
      );
    }

    // Calculate current nominee's average rating
    const currentAvgRating = currentNominee.rating.length > 0
      ? currentNominee.rating.reduce((acc, r) => acc + r.score, 0) / currentNominee.rating.length
      : 0;

    // Find similar nominees based on position, institution, and ratings
    const similarNominees = await prisma.nominee.findMany({
      where: {
        AND: [
          { id: { not: id } },
          {
            OR: [
              { positionId: currentNominee.positionId },
              { institutionId: currentNominee.institutionId }
            ]
          },
          { status: true }
        ]
      },
      include: {
        position: {
          select: {
            id: true,
            name: true
          }
        },
        rating: true
      },
      take: 4
    });

    // Calculate average ratings and similarity scores
    const similarsWithScores = similarNominees.map(nominee => {
      const avgRating = nominee.rating.length > 0
        ? nominee.rating.reduce((acc, r) => acc + r.score, 0) / nominee.rating.length
        : 0;

      // Calculate similarity score based on rating difference
      const ratingDiff = Math.abs(avgRating - currentAvgRating);
      const similarityScore = 1 / (1 + ratingDiff);

      return {
        id: nominee.id,
        name: nominee.name,
        image: nominee.image,
        position: nominee.position,
        averageRating: avgRating,
        similarity: similarityScore
      };
    });

    // Sort by similarity score and return
    const sortedSimilars = similarsWithScores
      .sort((a, b) => b.similarity - a.similarity)
      .map(({ similarity: _similarity, ...rest }) => rest);

    return NextResponse.json(sortedSimilars);
  } catch (error) {
    console.error('Error finding similar nominees:', error);
    return NextResponse.json(
      { error: 'Failed to find similar nominees' },
      { status: 500 }
    );
  }
}