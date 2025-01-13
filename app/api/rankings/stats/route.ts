import { NextRequest, NextResponse } from 'next/server';
import { getRankingStats } from '@/utils/rankings';

// Add this line to explicitly mark the route as dynamic
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const searchParams = new URL(req.url).searchParams;
    const type = searchParams.get('type') as 'nominee' | 'institution';

    if (!type || !['nominee', 'institution'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type parameter' },
        { status: 400 }
      );
    }

    const stats = await getRankingStats(type);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching ranking stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ranking stats' },
      { status: 500 }
    );
  }
}