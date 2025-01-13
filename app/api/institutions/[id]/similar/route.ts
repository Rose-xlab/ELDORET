// app/api/institutions/[id]/similar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const id = parseInt(req.nextUrl.pathname.split('/')[3], 10);
    
    // Get the current institution's details
    const currentInstitution = await prisma.institution.findUnique({
      where: { id },
      include: {
        rating: true,
      },
    });

    if (!currentInstitution) {
      return NextResponse.json(
        { error: 'Institution not found' },
        { status: 404 }
      );
    }

    // Calculate current institution's average rating
    const currentAverage = currentInstitution.rating.length > 0
      ? currentInstitution.rating.reduce((acc, r) => acc + r.score, 0) / currentInstitution.rating.length
      : 0;

    // Find similar institutions based on ratings
    const similarInstitutions = await prisma.institution.findMany({
      where: {
        id: { not: id }, // Exclude current institution
      },
      include: {
        rating: true,
      },
      take: 4, // Limit to 4 similar institutions
    });

    // Calculate average ratings and sort by similarity
    const similarWithScores = similarInstitutions
      .map(institution => {
        const avgRating = institution.rating.length > 0
          ? institution.rating.reduce((acc, r) => acc + r.score, 0) / institution.rating.length
          : 0;
        return {
          ...institution,
          averageRating: avgRating,
          similarity: Math.abs(avgRating - currentAverage), // Lower is more similar
        };
      })
      .sort((a, b) => a.similarity - b.similarity);

    return NextResponse.json(similarWithScores);
  } catch (error) {
    console.error('Error finding similar institutions:', error);
    return NextResponse.json(
      { error: 'Failed to find similar institutions' },
      { status: 500 }
    );
  }
}