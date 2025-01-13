// app/api/leaderboard/nominees/categories/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get all rating categories
    const categories = await prisma.ratingCategory.findMany({
      where: { status: true },
      include: {
        NomineeRating: {
          include: {
            nominee: {
              include: {
                position: true,
                institution: true
              }
            }
          }
        }
      }
    });

    // Process and aggregate data for each category
    const categoryLeaders = await Promise.all(categories.map(async (category) => {
      // Get nominees with ratings in this category
      const nomineesWithRatings = await prisma.nominee.findMany({
        where: {
          status: true,
          rating: {
            some: {
              ratingCategoryId: category.id
            }
          }
        },
        include: {
          position: true,
          institution: true,
          rating: {
            where: {
              ratingCategoryId: category.id
            }
          }
        }
      });

      // Calculate average ratings and sort
      const leaders = nomineesWithRatings
        .map(nominee => ({
          id: nominee.id,
          name: nominee.name,
          image: nominee.image,
          position: nominee.position.name,
          institution: nominee.institution.name,
          rating: nominee.rating.reduce((acc, r) => acc + r.score, 0) / nominee.rating.length,
          totalRatings: nominee.rating.length
        }))
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 10); // Get top 10

      return {
        id: category.id,
        name: category.name,
        icon: category.icon,
        description: category.description,
        leaders
      };
    }));

    return NextResponse.json(categoryLeaders);
  } catch (error) {
    console.error('Error fetching nominee category leaders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category leaders' },
      { status: 500 }
    );
  }
}