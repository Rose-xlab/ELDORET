import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type');
    const entityId = searchParams.get('entityId');

    const where = {
      ...(type === 'nominee' ? { nomineeId: entityId ? parseInt(entityId) : undefined } : {}),
      ...(type === 'institution' ? { institutionId: entityId ? parseInt(entityId) : undefined } : {}),
    };

    const [total, items] = await Promise.all([
      prisma.scandal.count({ where }),
      prisma.scandal.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          nominee: {
            select: {
              id: true,
              name: true,
            },
          },
          institution: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    return NextResponse.json({
      data: items,
      count: total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error('Error fetching scandals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scandals' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { title, description, sourceUrl, nomineeId, institutionId } = data;

    const scandal = await prisma.scandal.create({
      data: {
        title,
        description,
        sourceUrl,
        nomineeId: nomineeId ? parseInt(nomineeId) : null,
        institutionId: institutionId ? parseInt(institutionId) : null,
        createdBy: user.id, // Add the user ID as createdBy
      },
    });

    return NextResponse.json(scandal, { status: 201 });
  } catch (error) {
    console.error('Error creating scandal:', error);
    return NextResponse.json(
      { error: 'Failed to create scandal' },
      { status: 500 }
    );
  }
}