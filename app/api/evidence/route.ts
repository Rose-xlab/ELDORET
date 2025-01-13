// app/api/evidence/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import { EvidenceStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type');
    const entityId = searchParams.get('entityId');
    const status = searchParams.get('status');

    const where = {
      ...(type === 'nominee' ? { nomineeId: entityId ? parseInt(entityId) : undefined } : {}),
      ...(type === 'institution' ? { institutionId: entityId ? parseInt(entityId) : undefined } : {}),
      ...(status ? { status: status as EvidenceStatus } : {}),  // Changed this line
    };

    const [total, items] = await Promise.all([
      prisma.evidence.count({ where }),
      prisma.evidence.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
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
    console.error('Error fetching evidence:', error);
    return NextResponse.json(
      { error: 'Failed to fetch evidence' },
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
    const { title, description, fileUrl, nomineeId, institutionId } = data;

    const evidence = await prisma.evidence.create({
      data: {
        title,
        description,
        fileUrl,
        userId: user.id,
        nomineeId: nomineeId ? parseInt(nomineeId) : null,
        institutionId: institutionId ? parseInt(institutionId) : null,
        status: EvidenceStatus.PENDING,  // Changed this line
      },
    });

    return NextResponse.json(evidence, { status: 201 });
  } catch (error) {
    console.error('Error creating evidence:', error);
    return NextResponse.json(
      { error: 'Failed to create evidence' },
      { status: 500 }
    );
  }
}