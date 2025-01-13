import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const institutionId = parseInt(req.nextUrl.pathname.split('/')[3], 10);
    
    const ratings = await prisma.institutionRating.findMany({
      where: {
        institutionId: institutionId
      },
      include: {
        ratingCategory: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!ratings) {
      return NextResponse.json([], { status: 200 }); // Return empty array if no ratings
    }

    return NextResponse.json(ratings);
  } catch (error) {
    console.error('Error fetching institution ratings:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error fetching ratings' }, 
      { status: 500 }
    );
  }
}