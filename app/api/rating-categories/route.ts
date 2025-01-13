import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(_req: NextRequest) {
  try {
    const categories = await prisma.ratingCategory.findMany({
      where: { status: true },
      include: {
        departments: true,
        impactAreas: true
      }
    });

    return NextResponse.json({ data: categories });
  } catch (error) {
    console.error('Error fetching rating categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rating categories' },
      { status: 500 }
    );
  }
}