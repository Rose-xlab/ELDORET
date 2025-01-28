import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// import { getUser } from '@/lib/auth';  // Commented out
import { z } from 'zod';

// Define the User interface for getUser
interface User {
  id: number;
  name: string;
  email: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const nomineeId = searchParams.get('nomineeId');
    const institutionId = searchParams.get('institutionId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    
    // Set default anonymous user
    const user: User = { id: 0, name: 'Anonymous User', email: 'anonymous@example.com' };
    // const user: User | null = await getUser();  // Commented out

    const where = {
      ...(nomineeId ? { nomineeId: parseInt(nomineeId) } : {}),
      ...(institutionId ? { institutionId: parseInt(institutionId) } : {}),
    };

    const total = await prisma.comment.count({ where });
    const pages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const comments = await prisma.comment.findMany({
      where,
      skip,
      take: limit,
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
      orderBy: { createdAt: 'desc' },
    });

    const processedComments = comments.map((comment) => {
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

      return {
        ...comment,
        reactions: undefined,
        replies: processedReplies,
        likes,
        dislikes,
        userReaction,
      };
    });

    return NextResponse.json({
      data: processedComments,
      count: total,
      pages,
      currentPage: page,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Comment out user authentication
    // const user = await getUser();
    // if (!user || typeof user.id !== 'number') {
    //   return NextResponse.json({ error: 'Unauthorized or invalid user' }, { status: 401 });
    // }

    const schema = z.object({
      content: z.string().min(1),
      nomineeId: z.number().optional(),
      institutionId: z.number().optional(),
    });

    const { content, nomineeId, institutionId } = schema.parse(await req.json());

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        userId: 0, // Use anonymous user ID
        nomineeId: nomineeId ? (nomineeId) : null,
        institutionId: institutionId ? (institutionId) : null,
      },
      include: { user: { select: { id: true, name: true, image: true } } },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}