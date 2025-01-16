// app/api/comments/[id]/reactions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';


export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUser();
    if (!user || typeof user.id !== 'number') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { isLike } = await req.json();
    if (typeof isLike !== 'boolean') {
      return NextResponse.json({ error: 'Invalid reaction' }, { status: 400 });
    }

    const commentId = parseInt(params.id);
    if (isNaN(commentId)) {
      return NextResponse.json({ error: 'Invalid comment ID' }, { status: 400 });
    }

    // Upsert the reaction (update if exists, create if doesn't)
    const reaction = await prisma.commentReaction.upsert({
      where: {
        userId_commentId: {
          userId: user.id,
          commentId: commentId,
        }
      },
      update: {
        isLike,
      },
      create: {
        userId: user.id,
        commentId: commentId,
        isLike,
      },
    });

    // Get updated reaction counts
    const [likes, dislikes] = await Promise.all([
      prisma.commentReaction.count({
        where: { commentId, isLike: true },
      }),
      prisma.commentReaction.count({
        where: { commentId, isLike: false },
      }),
    ]);

    return NextResponse.json({ reaction, likes, dislikes });
  } catch (error) {
    console.error('Error handling reaction:', error);
    return NextResponse.json(
      { error: 'Failed to process reaction' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const commentId = parseInt(params.id);
    if (isNaN(commentId)) {
      return NextResponse.json({ error: 'Invalid comment ID' }, { status: 400 });
    }

    const reactions = await prisma.commentReaction.findMany({
      where: { commentId },
      include: {
        user: true,
      },
    });

    return NextResponse.json(reactions, { status: 200 });
  } catch (error) {
    console.error('Error fetching reactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reactions' },
      { status: 500 }
    );
  }
}