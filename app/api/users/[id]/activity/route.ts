// app/api/users/[id]/activity/route.ts
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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const [nomineeRatings, institutionRatings, comments] = await Promise.all([
      prisma.nomineeRating.findMany({
        where: { userId: currentUser.id },
        include: {
          nominee: {
            select: {
              id: true,
              name: true,
              image: true,
              position: {
                select: {
                  name: true
                }
              }
            }
          },
          ratingCategory: {
            select: {
              id: true,
              name: true,
              icon: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.institutionRating.findMany({
        where: { userId: currentUser.id },
        include: {
          institution: {
            select: {
              id: true,
              name: true,
              image: true
            }
          },
          ratingCategory: {
            select: {
              id: true,
              name: true,
              icon: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.comment.findMany({
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
          reactions: true,
          replies: {
            include: {
              reactions: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    // Process and combine ratings
    const ratings = [
      ...nomineeRatings.map(r => ({
        type: 'nominee' as const,
        id: r.id,
        target: r.nominee,
        category: r.ratingCategory,
        score: r.score,
        comment: r.comment,
        createdAt: r.createdAt
      })),
      ...institutionRatings.map(r => ({
        type: 'institution' as const,
        id: r.id,
        target: r.institution,
        category: r.ratingCategory,
        score: r.score,
        comment: r.comment,
        createdAt: r.createdAt
      }))
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Process comments
    const processedComments = comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      target: comment.nominee || comment.institution,
      type: comment.nominee ? 'nominee' : 'institution',
      likes: comment.reactions.filter(r => r.isLike).length,
      dislikes: comment.reactions.filter(r => !r.isLike).length,
      replies: comment.replies.map(reply => ({
        id: reply.id,
        content: reply.content,
        createdAt: reply.createdAt,
        likes: reply.reactions.filter(r => r.isLike).length,
        dislikes: reply.reactions.filter(r => !r.isLike).length
      }))
    }));

    return NextResponse.json({
      ratings,
      comments: processedComments
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user activity' },
      { status: 500 }
    );
  }
}