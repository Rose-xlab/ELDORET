// utils/comment-helpers.ts
import { prisma } from '@/lib/prisma';

export async function submitComment(
  userId: number,
  content: string,
  type: 'nominee' | 'institution',
  targetId: number,
  parentId?: number,
  isRatingComment: boolean = false
) {
  // If it's a rating comment, we need to create a regular comment
  if (isRatingComment) {
    return prisma.comment.create({
      data: {
        content,
        userId,
        ...(type === 'nominee' 
          ? { nomineeId: targetId } 
          : { institutionId: targetId }
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
  }

  // Handle reply to existing comment
  if (parentId) {
    return prisma.commentReply.create({
      data: {
        content,
        userId,
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
  }

  // Create new top-level comment
  return prisma.comment.create({
    data: {
      content,
      userId,
      ...(type === 'nominee' 
        ? { nomineeId: targetId } 
        : { institutionId: targetId }
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
}