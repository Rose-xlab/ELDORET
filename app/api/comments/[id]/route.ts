import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const commentId = parseInt(params.id);
    if (isNaN(commentId)) {
      return NextResponse.json({ error: 'Invalid comment ID' }, { status: 400 });
    }

    const user = await getUser();
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        user: { select: { id: true, name: true, image: true } },
        replies: {
          include: {
            user: { select: { id: true, name: true, image: true } },
            reactions: true,
          },
        },
        reactions: true,
      },
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const likes = comment.reactions.filter((r) => r.isLike).length;
    const dislikes = comment.reactions.filter((r) => !r.isLike).length;
    const userReaction = user
      ? comment.reactions.find((r) => r.userId === user.id)?.isLike
      : undefined;

    const processedReplies = comment.replies.map((reply) => {
      const replyLikes = reply.reactions.filter((r) => r.isLike).length;
      const replyDislikes = reply.reactions.filter((r) => !r.isLike).length;
      const userReplyReaction = user
        ? reply.reactions.find((r) => r.userId === user.id)?.isLike
        : undefined;

      return {
        ...reply,
        reactions: undefined,
        likes: replyLikes,
        dislikes: replyDislikes,
        userReaction: userReplyReaction,
      };
    });

    const processedComment = {
      ...comment,
      reactions: undefined,
      replies: processedReplies,
      likes,
      dislikes,
      userReaction,
    };

    return NextResponse.json(processedComment, { status: 200 });
  } catch (error) {
    console.error('Error fetching comment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comment' },
      { status: 500 }
    );
  }
}