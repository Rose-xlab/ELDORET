import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Add dynamic directive since we use request URL and database queries
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const targetId = parseInt(searchParams.get('targetId') || '0');
    const userId = parseInt(searchParams.get('userId') || '0');

    // Add input validation
    if (!type || !['nominee', 'institution'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }


    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const ratingCount = type === 'nominee'
      ? await prisma.nomineeRating.count({
          where: {
            userId,
            nomineeId: targetId,
            createdAt: { gte: twentyFourHoursAgo }
          }
        })
      : await prisma.institutionRating.count({
          where: {
            userId,
            institutionId: targetId,
            createdAt: { gte: twentyFourHoursAgo }
          }
        });

    return NextResponse.json({
      allowed: ratingCount < 5,
      count: ratingCount,
      remainingRatings: 5 - ratingCount
    });
  } catch (error) {
    console.error('Rate limit check error:', error);
    return NextResponse.json({ error: 'Failed to check rate limit' }, { status: 500 });
  }
}