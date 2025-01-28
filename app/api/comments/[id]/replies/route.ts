import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// import { getUser } from '@/lib/auth';  // Commented out

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Comment out authentication check
    // const user = await getUser();
    // if (!user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Set anonymous user
    const user = { id: 0 };

    const { content } = await req.json();
    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const commentId = parseInt(params.id);
    const reply = await prisma.commentReply.create({
      data: {
        content,
        userId: user.id, // Using anonymous user ID
        commentId,
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json(reply, { status: 201 });
  } catch (error) {
    console.error('Error creating reply:', error);
    return NextResponse.json(
      { error: 'Failed to create reply' },
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

    const replies = await prisma.commentReply.findMany({
      where: { commentId },
      include: {
        user: true,
      },
    });

    return NextResponse.json(replies, { status: 200 });
  } catch (error) {
    console.error('Error fetching replies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch replies' },
      { status: 500 }
    );
  }
}