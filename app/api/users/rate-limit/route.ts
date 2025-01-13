import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';

// Mark as dynamic since we use request URL and auth
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const targetId = searchParams.get('targetId');

    if (!type || !['nominee', 'institution'].includes(type)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    if (!targetId || targetId === 'undefined' || isNaN(parseInt(targetId))) {
      return NextResponse.json({
        allowed: true,
        count: 0,
        remainingRatings: 5
      });
    }

    // Now we're using parsedTargetId in the response
    const parsedTargetId = parseInt(targetId);
    return NextResponse.json({
      allowed: true,
      count: 0,
      remainingRatings: 5,
      targetId: parsedTargetId // Using the parsed ID in the response
    });

  } catch (error) {
    console.error('Rate limit check error:', error);
    return NextResponse.json({ error: 'Failed to check rate limit' }, { status: 500 });
  }
}