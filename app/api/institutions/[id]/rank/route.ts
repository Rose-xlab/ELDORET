// app/api/institutions/[id]/rank/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const id = parseInt(req.nextUrl.pathname.split('/')[3], 10);
    
    // Get all institutions with their average ratings
    const institutions = await prisma.institution.findMany({
      select: {
        id: true,
        rating: {
          select: {
            score: true,
          },
        },
      },
    });

    // Calculate average ratings and sort
    const rankedInstitutions = institutions
      .map(institution => ({
        id: institution.id,
        averageRating: institution.rating.length > 0
          ? institution.rating.reduce((acc, r) => acc + r.score, 0) / institution.rating.length
          : 0
      }))
      .sort((a, b) => b.averageRating - a.averageRating);

    // Find the rank of the requested institution
    const rank = rankedInstitutions.findIndex(i => i.id === id) + 1;

    return NextResponse.json({ rank });
  } catch (error) {
    console.error('Error calculating rank:', error);
    return NextResponse.json(
      { error: 'Failed to calculate rank' },
      { status: 500 }
    );
  }
}