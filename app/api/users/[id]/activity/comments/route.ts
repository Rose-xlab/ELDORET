// app/api/users/[id]/activity/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getUser();
    if (!currentUser || currentUser.id !== parseInt(params.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const comments = await prisma.comment.findMany({
      where: { userId: currentUser.id },
      include: {
        nominee: {
          select: {
            id: true,
            name: true
          }
        },
        institution: {
          select: {
            id: true,
            name: true
          }
        },
        replies: {
          include: {
            user: {
              select: {
                name: true,
                image: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        reactions: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Process comments to include reaction counts
    const processedComments = comments.map(comment => ({
      ...comment,
      likes: comment.reactions.filter(r => r.isLike).length,
      dislikes: comment.reactions.filter(r => !r.isLike).length
    }));

    return NextResponse.json(processedComments);
  } catch (error) {
    console.error('Error fetching user comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}