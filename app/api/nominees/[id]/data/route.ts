// app/api/nominees/[id]/data/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    const nominee = await prisma.nominee.findUnique({
      where: { id: Number(id) },
      include: {
        institution: true,
        rating: {
          include: {
            user: true,
            ratingCategory: true
          }
        }
      }
    });

    if (!nominee) {
      return NextResponse.json(
        { error: 'Nominee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: nominee });
  } catch (error) {
    console.error('Error fetching nominee:', error);
    return NextResponse.json(
      { error: 'Failed to fetch nominee data' },
      { status: 500 }
    );
  }
}
