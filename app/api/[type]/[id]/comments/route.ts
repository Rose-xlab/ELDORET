// app/api/[type]/[id]/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  try {
    const id = parseInt(params.id);
    const type = params.type === 'nominees' ? 'nominee' : 'institution';
    const user = await getUser();

    const comments = await prisma.comment.findMany({
      where: {
        ...(type === 'nominee' 
          ? { nomineeId: id } 
          : { institutionId: id }
        ),
        status: true
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true
              }
            },
            reactions: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        reactions: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Process reactions and add user's reaction status
    const processedComments = comments.map(comment => {
      const likes = comment.reactions.filter(r => r.isLike).length;
      const dislikes = comment.reactions.filter(r => !r.isLike).length;
      const userReaction = user
        ? comment.reactions.find(r => r.userId === user.id)?.isLike
        : undefined;

      const processedReplies = comment.replies.map(reply => ({
        ...reply,
        reactions: undefined,
        likes: reply.reactions.filter(r => r.isLike).length,
        dislikes: reply.reactions.filter(r => !r.isLike).length,
        userReaction: user
          ? reply.reactions.find(r => r.userId === user.id)?.isLike
          : undefined
      }));

      return {
        ...comment,
        reactions: undefined,
        replies: processedReplies,
        likes,
        dislikes,
        userReaction
      };
    });

    return NextResponse.json(processedComments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const id = parseInt(params.id);
    const type = params.type === 'nominees' ? 'nominee' : 'institution';
    const { content, parentId } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    // Handle reply to existing comment
    if (parentId) {
      const reply = await prisma.commentReply.create({
        data: {
          content: content.trim(),
          userId: user.id,
          commentId: parentId
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true
            }
          }
        }
      });

      return NextResponse.json(reply);
    }

    // Create new top-level comment
    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        userId: user.id,
        ...(type === 'nominee' 
          ? { nomineeId: id } 
          : { institutionId: id }
        ),
        status: true
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}