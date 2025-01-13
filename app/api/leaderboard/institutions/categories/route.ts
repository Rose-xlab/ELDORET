// app/api/leaderboard/institutions/categories/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get all institution rating categories
    const categories = await prisma.institutionRatingCategory.findMany({
      where: { status: true },
      include: {
        InstitutionRating: {
          include: {
            institution: true
          }
        }
      }
    });

    // Process and aggregate data for each category
    const categoryLeaders = await Promise.all(categories.map(async (category) => {
      // Get institutions with ratings in this category
      const institutionsWithRatings = await prisma.institution.findMany({
        where: {
          status: true,
          rating: {
            some: {
              ratingCategoryId: category.id
            }
          }
        },
        include: {
          rating: {
            where: {
              ratingCategoryId: category.id
            }
          }
        }
      });

      // Calculate average ratings and sort
      const leaders = institutionsWithRatings
        .map(institution => ({
          id: institution.id,
          name: institution.name,
          image: institution.image,
          rating: institution.rating.reduce((acc, r) => acc + r.score, 0) / institution.rating.length,
          totalRatings: institution.rating.length
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
    console.error('Error fetching institution category leaders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category leaders' },
      { status: 500 }
    );
  }
}