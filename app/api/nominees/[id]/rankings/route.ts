// app/api/nominees/[id]/rankings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getNomineeRank, getNomineeCategoryRank } from '@/utils/rankings';

export async function GET(req: NextRequest) {
  try {
    const id = parseInt(req.nextUrl.pathname.split('/')[3], 10);
    const searchParams = new URL(req.url).searchParams;
    const categoryId = searchParams.get('categoryId');

    if (categoryId) {
      const categoryRank = await getNomineeCategoryRank(id, parseInt(categoryId));
      return NextResponse.json(categoryRank);
    }

    const overallRank = await getNomineeRank(id);
    return NextResponse.json(overallRank);
  } catch (error) {
    console.error('Error fetching nominee rankings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rankings' },
      { status: 500 }
    );
  }
}