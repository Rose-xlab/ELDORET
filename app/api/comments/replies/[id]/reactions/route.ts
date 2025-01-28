import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// import { getUser } from '@/lib/auth';  // Commented out

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      // Comment out authentication check
      // const user = await getUser();
      // if (!user || typeof user.id !== 'number') {
      //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      // }

      // Set anonymous user
      const user = { id: 0 };
  
      const { isLike } = await req.json();
      if (typeof isLike !== 'boolean') {
        return NextResponse.json({ error: 'Invalid reaction' }, { status: 400 });
      }
  
      const replyId = parseInt(params.id);
      if (isNaN(replyId)) {
        return NextResponse.json({ error: 'Invalid reply ID' }, { status: 400 });
      }
      
      // Upsert the reaction
      const reaction = await prisma.commentReaction.upsert({
        where: {
          userId_replyId: {
            userId: user.id,
            replyId: replyId,
          },
        },
        update: {
          isLike,
        },
        create: {
          userId: user.id,
          replyId: replyId,
          isLike,
        },
      });
  
      // Get updated reaction counts
      const [likes, dislikes] = await Promise.all([
        prisma.commentReaction.count({
          where: { replyId, isLike: true },
        }),
        prisma.commentReaction.count({
          where: { replyId, isLike: false },
        }),
      ]);
  
      return NextResponse.json({ reaction, likes, dislikes });
    } catch (error) {
      console.error('Error handling reply reaction:', error);
      return NextResponse.json(
        { error: 'Failed to process reaction' },
        { status: 500 }
      );
    }
  }