// app/api/users/[id]/ratings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const currentUser = await getUser();
      if (!currentUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
  
      const userId = parseInt(params.id);
      if (userId !== currentUser.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
  
      const [nomineeRatings, institutionRatings] = await Promise.all([
        prisma.nomineeRating.findMany({
          where: { userId },
          select: {
            id: true,
            score: true,
            comment: true,
            createdAt: true,
            nominee: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            ratingCategory: {
              select: {
                id: true,
                name: true,
                icon: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.institutionRating.findMany({
          where: { userId },
          select: {
            id: true,
            score: true,
            comment: true,
            createdAt: true,
            institution: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            ratingCategory: {
              select: {
                id: true,
                name: true,
                icon: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
      ]);
  
      // Combine and format ratings
      const allRatings = [
        ...nomineeRatings.map(r => ({
          ...r,
          type: 'nominee' as const,
          target: r.nominee,
        })),
        ...institutionRatings.map(r => ({
          ...r,
          type: 'institution' as const,
          target: r.institution,
        })),
      ].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  
      return NextResponse.json(allRatings);
    } catch (error) {
      console.error('Error fetching user ratings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch ratings' },
        { status: 500 }
      );
    }
  }
  