// app/api/nominees/[id]/rank/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const id = parseInt(req.nextUrl.pathname.split('/')[3], 10);
    
    // Get all nominees with their average ratings
    const nominees = await prisma.nominee.findMany({
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
    const rankedNominees = nominees
      .map(nominee => ({
        id: nominee.id,
        averageRating: nominee.rating.length > 0
          ? nominee.rating.reduce((acc, r) => acc + r.score, 0) / nominee.rating.length
          : 0
      }))
      .sort((a, b) => b.averageRating - a.averageRating);

    // Find the rank of the requested nominee
    const rank = rankedNominees.findIndex(n => n.id === id) + 1;

    return NextResponse.json({ rank });
  } catch (error) {
    console.error('Error calculating rank:', error);
    return NextResponse.json(
      { error: 'Failed to calculate rank' },
      { status: 500 }
    );
  }
}