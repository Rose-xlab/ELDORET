import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface User {
  id: number;
  name: string;
  image: string | null;
}

interface RatingCategory {
  id: number;
  name: string;
  description: string;
}

interface Rating {
  id: number;
  score: number;
  nomineeId: number;
  userId: number;
  ratingCategoryId: number;
  createdAt: Date;
  ratingCategory: RatingCategory;
  user: User;
}

interface CategoryRatings {
  category: RatingCategory;
  ratings: Rating[];
  averageScore: number | string;
}

interface CategorizedRatings {
  [key: number]: CategoryRatings;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const nomineeId = parseInt(params.id);
    
    const ratings = await prisma.nomineeRating.findMany({
      where: {
        nomineeId
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

    // Calculate average scores per category
    const categorizedRatings = ratings.reduce((acc: CategorizedRatings, rating: Rating) => {
      const categoryId = rating.ratingCategoryId;
      if (!acc[categoryId]) {
        acc[categoryId] = {
          category: rating.ratingCategory,
          ratings: [],
          averageScore: 0
        };
      }
      acc[categoryId].ratings.push(rating);
      return acc;
    }, {});

    // Calculate averages
    Object.values(categorizedRatings).forEach((category: CategoryRatings) => {
      const sum = category.ratings.reduce((sum: number, rating: Rating) => sum + rating.score, 0);
      category.averageScore = category.ratings.length > 0
        ? (sum / category.ratings.length).toFixed(1)
        : 0;
    });

    return NextResponse.json({
      success: true,
      ratings: categorizedRatings
    });
  
  } catch (error) {
    console.error('Error fetching ratings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ratings' },
      { status: 500 }
    );
  }
}